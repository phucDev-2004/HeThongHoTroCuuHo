<script setup lang="ts">
import type { RescueRequest } from '@/types/rescue';
import dayjs from 'dayjs';

defineProps<{
    data: RescueRequest[];
    loading: boolean;
}>();

defineEmits<{
    (e: 'select', row: RescueRequest): void
}>();

// Helper functions
const formatDate = (date: string) => dayjs(date).format('HH:mm DD/MM/YYYY');

// --- LOGIC MÀU SẮC TRẠNG THÁI ---
const getStatusType = (status: string) => {
    // Chuyển về chữ hoa để so sánh cho chuẩn
    const s = status?.toUpperCase();

    // 1. Màu ĐỎ (Khẩn cấp / Chờ xử lý)
    if (['PENDING', 'NEW', 'CHỜ XỬ LÝ', 'MỚI'].includes(s)) {
        return 'danger'; 
    }
    
    // 2. Màu CAM (Đang thực hiện / Đang di chuyển)
    if (['IN_PROGRESS', 'MOVING', 'ĐANG XỬ LÝ', 'ĐANG DI CHUYỂN'].includes(s)) {
        return 'warning';
    }

    // 3. Màu XANH DƯƠNG (Đã điều động / Đã tiếp nhận)
    if (['DISPATCHED', 'ACCEPTED', 'ĐÃ ĐIỀU ĐỘNG', 'ĐÃ TIẾP NHẬN'].includes(s)) {
        return 'primary';
    }

    // 4. Màu XANH LÁ (Hoàn thành)
    if (['COMPLETED', 'DONE', 'HOÀN THÀNH'].includes(s)) {
        return 'success';
    }

    // 5. Màu XÁM (Hủy / Khác)
    return 'info';
};
</script>

<template>
    <el-table 
        v-loading="loading"
        :data="data" 
        style="width: 100%" 
        height="100%" 
        highlight-current-row
        @row-click="(row) => $emit('select', row)"
    >
        <el-table-column label="Thời gian" width="140">
            <template #default="{ row }">
                <span class="text-xs text-slate-600">{{ formatDate(row.created_at) }}</span>
            </template>
        </el-table-column>

        <el-table-column label="Mã SCC" width="200">
            <template #default="{ row }">
                <span class="font-bold text-slate-800">{{row.code}}</span>
            </template>
        </el-table-column>

        <el-table-column label="Người Yêu Cầu" min-width="180">
            <template #default="{ row }">
                <div class="flex flex-col">
                    <span class="font-bold text-slate-800">{{ row.name }}</span>
                    <span class="text-xs text-slate-500">{{ row.contact_phone }}</span>
                </div>
            </template>
        </el-table-column>

        <el-table-column prop="people_summary" label="Nạn Nhân" width="160">
            <template #default="{ row }">
                <el-tag effect="plain" round>{{ row.people_summary }}</el-tag>
            </template>
        </el-table-column>

        <el-table-column prop="address" width="240" label="Địa Chỉ" show-overflow-tooltip />

        <el-table-column label="Trạng Thái" width="100" align="center">
            <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" effect="light" size="small" class="font-bold">
                    {{ row.status }}
                </el-tag>
            </template>
        </el-table-column>
    </el-table>
</template>

<style scoped>
/* CSS Override để highlight dòng đang chọn rõ hơn giống file cũ */
:deep(.el-table__body tr.current-row > td.el-table__cell) {
    background-color: #e6f7ff !important;
}
</style>