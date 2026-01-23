<script setup lang="ts">
import { ref } from 'vue';
import { InfoFilled, MapLocation } from '@element-plus/icons-vue';
import type { RescueRequest, RescueTeam } from '@/types/rescue'; // Import thêm type RescueTeam nếu cần
import { ElMessage } from 'element-plus';

// 1. Giả sử hàm findNearbyTeams nằm trong useRescueService (hoặc bạn import từ nơi chứa nó)
import { useRescueService } from '@/composables/useRescueService'; 

import RescueMap from './RescueMap.vue';
import RescueInfo from './RescueInfo.vue';
import RescueTaskControl from './RescueTaskControl.vue';
import RescueDispatch from './RescueDispatch.vue';

const props = defineProps<{
    request: RescueRequest | null;
}>();

const emit = defineEmits(['refresh']);

// 2. Lấy hàm API và khởi tạo state
const { findNearbyTeams } = useRescueService();
const showDispatchDialog = ref(false);
const suggestedTeams = ref<RescueTeam[]>([]); // Biến chứa danh sách đội
const loadingTeams = ref(false); // Biến loading

// 3. Hàm xử lý khi bấm nút "Điều động"
const handleOpenDispatch = async () => {
    if (!props.request) return;

    // Reset state cũ
    showDispatchDialog.value = true;
    suggestedTeams.value = []; 
    loadingTeams.value = true;

    try {
        // Kiểm tra xem request có tọa độ không
        if (!props.request.latitude || !props.request.longitude) {
            ElMessage.warning('Yêu cầu này không có tọa độ để tìm đội lân cận.');
            loadingTeams.value = false;
            return;
        }

        // 4. Gọi API findNearbyTeams với tham số
        const teams = await findNearbyTeams({
            latitude: props.request.latitude,
            longitude: props.request.longitude,
            radius_km: 10 // Bán kính mặc định 10km (hoặc cấu hình tùy ý)
        });

        suggestedTeams.value = teams;

    } catch (error) {
        console.error("Lỗi tìm đội:", error);
        ElMessage.error('Không thể tải danh sách đội cứu hộ.');
    } finally {
        loadingTeams.value = false;
    }
};

const onAssignSuccess = () => {
    ElMessage.success('Điều động thành công!');
    showDispatchDialog.value = false;
    emit('refresh');
};
</script>

<template>
    <div class="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full overflow-hidden">
        
        <div class="p-4 border-b flex items-center gap-3 bg-slate-50 border-slate-100">
            <el-icon class="text-blue-600" :size="20"><InfoFilled /></el-icon>
            <h3 class="font-bold text-slate-800 text-base uppercase tracking-wide">Chi tiết Yêu cầu</h3>
            
            <template v-if="request">
                <el-tag v-if="request.active_assignment" type="success" size="small" class="ml-auto font-bold">
                    {{ request.active_assignment.status }}
                </el-tag>
                <el-tag v-else type="warning" size="small" class="ml-auto font-bold">
                    Chờ xử lý
                </el-tag>
            </template>
        </div>

        <div v-if="request" class="flex-1 flex flex-col overflow-hidden relative">
            
            <div class="h-60 shrink-0 border-b border-slate-200 relative z-0">
                <RescueMap :request="request" />
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar">
                <RescueInfo :request="request" />
            </div>

            <RescueTaskControl 
                :request="request"
                @openDispatch="handleOpenDispatch"
                @refresh="$emit('refresh')" />
        </div>

        <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
            <el-icon class="text-6xl mb-4 opacity-20"><MapLocation /></el-icon>
            <p class="font-medium">Chọn một yêu cầu từ danh sách<br>để xem vị trí và chi tiết</p>
        </div>

        <RescueDispatch
            v-model="showDispatchDialog"
            :request="request"
            :teams="suggestedTeams"
            :loading="loadingTeams"
            @success="onAssignSuccess"
        />
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
</style>