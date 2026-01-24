<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRescue } from '@/composables/useRescue';
import { useRescueService } from '@/composables/useRescueService'; // 1. Import Service
import type { RescueRequest } from '@/types/rescue';
import { Loading } from '@element-plus/icons-vue'; // Import icon loading

import { useRoute, useRouter } from 'vue-router';

import RescueFilter from '@/components/rescue/RescueFilter.vue';
import RescueTable from '@/components/rescue/RescueTable.vue';
import RescueDetailPanel from '~/components/rescue/RescueDetailPanel.vue';

definePageMeta({ layout: 'admin' });

const route = useRoute();
const router = useRouter();

// Lấy logic danh sách từ useRescue
const { 
    requests, loading: loadingList, total, filter, // Đổi tên loading -> loadingList để tránh nhầm
    fetchRequests, handleSearch, handleReset 
} = useRescue();

// Lấy hàm gọi chi tiết từ Service
const { getRequestDetail } = useRescueService();

const selectedRequest = ref<RescueRequest | null>(null);
const loadingDetail = ref(false); // 2. State loading cho vùng chi tiết

// 3. Hàm xử lý khi click row (Async gọi API)
const onSelectRequest = async (row: RescueRequest) => {
    // Reset data cũ để tránh hiển thị thông tin rác của người trước
    selectedRequest.value = null; 
    loadingDetail.value = true;

    try {
        // Gọi API lấy thông tin tươi mới nhất (bao gồm media, trạng thái đội...)
        const fullDetail = await getRequestDetail(row.id);
        selectedRequest.value = fullDetail;
    } catch (e) {
        console.error("Lỗi tải chi tiết:", e);
        // Fallback: Nếu lỗi API thì dùng tạm dữ liệu từ bảng
        selectedRequest.value = row;
    } finally {
        loadingDetail.value = false;
    }
};

// 4. Xử lý Refresh (Ví dụ sau khi điều phối xong)
const onRefreshData = () => {
    // Load lại danh sách
    fetchRequests();
    // Nếu đang chọn ai đó, load lại chi tiết người đó luôn
    if (selectedRequest.value) {
        onSelectRequest(selectedRequest.value);
    }
};

// Tự động chọn dòng đầu tiên khi mới vào trang (Có gọi API chi tiết)
watch(requests, async (newRequests) => {
  if (newRequests && newRequests.length > 0 && !selectedRequest.value) {
    await onSelectRequest(newRequests[0]!);
  }
});

onMounted(async () => {
    // 1. Tải danh sách mặc định
    await fetchRequests();
    const queryId = route.query.id as string;
    
    if (queryId) {
        await onSelectRequest({ id: queryId } as RescueRequest);

        router.replace({ query: {} }); 
    }
});
</script>

<template>
  <div class="h-[calc(100vh-6rem)] flex flex-col space-y-4 p-4">
    
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
        <span class="text-xs uppercase text-slate-500 font-bold tracking-wider">Tổng Sự Cố</span>
        <div class="text-3xl font-extrabold text-slate-800">{{ total }}</div>
    </div>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
        
        <div class="lg:col-span-8 flex flex-col h-full space-y-4 overflow-hidden">
            
            <div class="flex-shrink-0">
                <RescueFilter 
                    v-model:search="filter.search"
                    v-model:status="filter.status"
                    @submit="handleSearch"
                    @reset="handleReset"
                />
            </div>

            <div class="flex-1 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden relative">
                <div class="flex-1 overflow-hidden">
                    <RescueTable 
                        :data="requests"
                        :loading="loadingList"
                        @select="onSelectRequest"
                    />
                </div>
                
                <div class="p-3 border-t bg-slate-50 flex justify-end flex-shrink-0">
                    <el-pagination
                        v-model:current-page="filter.page"
                        v-model:page-size="filter.page_size"
                        :total="total"
                        :page-sizes="[10, 20, 50]"
                        layout="total, sizes, prev, pager, next"
                        background
                    />
                </div>
            </div>
        </div>

        <div class="lg:col-span-4 h-full overflow-hidden relative">
            
            <div v-if="loadingDetail" class="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-xl border border-slate-100">
                <div class="flex flex-col items-center gap-3">
                    <el-icon class="is-loading text-blue-600" :size="32"><Loading /></el-icon>
                    <span class="text-sm font-medium text-slate-500">Đang tải thông tin...</span>
                </div>
            </div>

            <RescueDetailPanel 
                :request="selectedRequest" 
                @refresh="onRefreshData" 
            />
        </div>
        
    </div>
  </div>
</template>