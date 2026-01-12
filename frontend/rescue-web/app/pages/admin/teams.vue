<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { 
    Edit, Location, Phone, User, MapLocation, House, Refresh,
    FirstAidKit, Van, StarFilled, HelpFilled, Aim
} from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import type { Rescue } from '~/types/rescue';

definePageMeta({ layout: 'admin' });

// --- 1. CONFIG & CONSTANTS ---
const TEAM_TYPES = [
    { label: 'CỨU HỎA', value: 'CỨU HỎA', color: 'danger', icon: Van, class: 'bg-red-50 text-red-600 border-red-100' },
    { label: 'Y TẾ', value: 'Y TẾ', color: 'success', icon: FirstAidKit, class: 'bg-green-50 text-green-600 border-green-100' },
    { label: 'CÔNG AN', value: 'CÔNG AN', color: 'primary', icon: StarFilled, class: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'CỨU HỘ', value: 'CỨU HỘ', color: 'warning', icon: HelpFilled, class: 'bg-orange-50 text-orange-600 border-orange-100' }
];

const TEAM_STATUS = [
    { label: 'Sẵn sàng', value: 'Sẵn sàng', color: '#10b981' }, 
    { label: 'Đang bận', value: 'Đang bận', color: '#ef4444' },      
];

// --- 2. LOGIC & STATE ---
const { getTeams, updateTeam } = useAdminService();
const loading = ref(false);
const submitting = ref(false);
const teams = ref<Rescue[]>([]);
const editDialog = ref(false);
const formRef = ref<FormInstance>();
const currentTeam = ref<Rescue>({} as Rescue);

const rules = reactive<FormRules>({
    name: [{ required: true, message: 'Vui lòng nhập tên đội', trigger: 'blur' }],
    team_type: [{ required: true, message: 'Vui lòng chọn loại đội', trigger: 'change' }],
    contact_phone: [{ required: true, message: 'Nhập SĐT liên hệ', trigger: 'blur' }],
    latitude: [{ required: true, message: 'Bắt buộc', trigger: 'blur' }],
    longitude: [{ required: true, message: 'Bắt buộc', trigger: 'blur' }],
});

// Helper lấy metadata cho Table
const getTeamMeta = (type: string) => {
    return TEAM_TYPES.find(t => t.value === type) || { 
        color: 'info', icon: HelpFilled, class: 'bg-gray-50 text-gray-600 border-gray-200' 
    };
};

const fetchTeams = async () => {
    loading.value = true;
    try {
        teams.value = await getTeams();
    } catch { ElMessage.error('Không thể tải dữ liệu'); } 
    finally { loading.value = false; }
};

const openEdit = (row: Rescue) => {
    currentTeam.value = { ...row }; 
    editDialog.value = true;
    setTimeout(() => formRef.value?.clearValidate(), 50);
};

const handleUpdate = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(async (valid) => {
        if (valid && currentTeam.value.id) {
            submitting.value = true;
            try {
                await updateTeam(currentTeam.value.id, currentTeam.value);
                ElMessage.success('Cập nhật thành công!');
                editDialog.value = false;
                fetchTeams();
            } catch (e: any) {
                ElMessage.error(e.message || 'Lỗi cập nhật');
            } finally {
                submitting.value = false;
            }
        }
    });
};

onMounted(fetchTeams);
</script>

<template>
    <div class="min-h-screen bg-slate-50/50 p-6 space-y-6">
        
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
                    <el-icon :size="24"><Van /></el-icon>
                </div>
                <div>
                    <h1 class="text-xl font-bold text-slate-800 tracking-tight">Đội Phản Ứng Nhanh</h1>
                    <p class="text-sm text-slate-500 font-medium">Quản lý {{ teams.length }} đơn vị cứu hộ & tài nguyên</p>
                </div>
            </div>
            <el-button :icon="Refresh" circle plain @click="fetchTeams" class="!border-slate-200 hover:!bg-slate-50 hover:!text-indigo-600 transition-colors" />
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <el-table 
                :data="teams" 
                v-loading="loading" 
                style="width: 100%" 
                :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: '600', padding: '12px', fontSize: '13px' }"
                row-class-name="hover:bg-slate-50/80 transition-colors group"
            >
                <el-table-column label="Đơn vị & Loại hình" min-width="260">
                    <template #default="{ row }">
                        <div class="flex items-center gap-4 py-2">
                            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                                 :class="getTeamMeta(row.team_type).class">
                                <el-icon :size="22"><component :is="getTeamMeta(row.team_type).icon" /></el-icon>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="font-bold text-slate-800 text-[15px] leading-tight">{{ row.name }}</span>
                                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 w-fit border border-slate-200">
                                    {{ row.team_type }}
                                </span>
                            </div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="Chỉ huy & Liên hệ" min-width="200">
                    <template #default="{ row }">
                        <div class="space-y-1.5">
                            <div class="flex items-center gap-2">
                                <el-avatar :size="24" class="bg-indigo-100 text-indigo-600 text-[10px] font-bold">
                                    {{ row.leader_name?.charAt(0) }}
                                </el-avatar>
                                <span class="text-sm font-semibold text-slate-700">{{ row.leader_name || '---' }}</span>
                            </div>
                            <div class="flex items-center gap-2 pl-1">
                                <el-icon class="text-slate-400 text-xs"><Phone /></el-icon>
                                <span class="text-sm text-slate-600 font-mono">{{ row.contact_phone }}</span>
                            </div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="Hotline SOS" width="160">
                    <template #default="{ row }">
                        <div v-if="row.hotline" class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-50 border border-red-100 text-red-600">
                            <el-icon class="text-sm animate-pulse"><Aim /></el-icon> 
                            <span class="font-bold text-sm font-mono">{{ row.hotline }}</span>
                        </div>
                        <span v-else class="text-slate-300 text-xs italic pl-2">---</span>
                    </template>
                </el-table-column>

                <el-table-column label="Khu vực & Vị trí" min-width="220">
                    <template #default="{ row }">
                        <div class="flex flex-col gap-1.5">
                            <div class="flex items-center gap-2">
                                <el-icon class="text-slate-400"><MapLocation /></el-icon>
                                <span class="text-sm font-medium text-slate-700">{{ row.primary_area || 'Chưa phân vùng' }}</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <el-icon class="text-slate-400 mt-0.5 shrink-0"><House /></el-icon>
                                <span class="text-xs text-slate-500 line-clamp-2 leading-relaxed" :title="row.address">
                                    {{ row.address }}
                                </span>
                            </div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="Trạng thái" width="140" align="center">
                    <template #default="{ row }">
                        <el-tag 
                            :type="row.status === 'Sẵn sàng' ? 'success' : 'danger'" 
                            effect="dark" 
                            round
                        >
                            {{ row.status }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column width="80" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button 
                            type="primary" 
                            :icon="Edit" 
                            circle 
                            plain 
                            @click="openEdit(row)" 
                            class="!border-slate-200 !text-slate-400 hover:!text-blue-600 hover:!border-blue-200 hover:!bg-blue-50 transition-all" 
                        />
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <el-dialog v-model="editDialog" title="Cập Nhật Thông Tin Đội Cứu Hộ" width="700px" destroy-on-close align-center>
            <el-form ref="formRef" :model="currentTeam" :rules="rules" label-position="top" class="custom-form">
                
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="Tên đội cứu hộ" prop="name">
                            <el-input v-model="currentTeam.name" placeholder="Nhập tên đội..." />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="Loại hình (Team Type)" prop="team_type">
                            <el-select v-model="currentTeam.team_type" placeholder="Chọn loại hình" class="w-full">
                                <el-option 
                                    v-for="item in TEAM_TYPES" 
                                    :key="item.value" 
                                    :label="item.label" 
                                    :value="item.value" 
                                />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="Đội trưởng / Quản lý" prop="leader_name">
                            <el-input v-model="currentTeam.leader_name" :prefix-icon="User" placeholder="Họ và tên..." />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="Khu vực phụ trách" prop="primary_area">
                            <el-input v-model="currentTeam.primary_area" :prefix-icon="MapLocation" placeholder="Quận/Huyện..." />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="Số điện thoại" prop="contact_phone">
                            <el-input v-model="currentTeam.contact_phone" :prefix-icon="Phone" placeholder="SĐT cá nhân..." />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="Hotline khẩn cấp">
                            <el-input v-model="currentTeam.hotline" :prefix-icon="Phone" placeholder="Đầu số hotline..." />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="Địa chỉ trụ sở" prop="address">
                    <el-input v-model="currentTeam.address" :prefix-icon="House" type="textarea" :rows="2" placeholder="Địa chỉ chi tiết..." />
                </el-form-item>

                <el-divider content-position="left">Cấu hình Vị trí & Trạng thái</el-divider>

                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="Vĩ độ (Latitude)" prop="latitude">
                            <el-input-number v-model="currentTeam.latitude" :precision="6" :step="0.0001" class="w-full" controls-position="right" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="Kinh độ (Longitude)" prop="longitude">
                            <el-input-number v-model="currentTeam.longitude" :precision="6" :step="0.0001" class="w-full" controls-position="right" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="Trạng thái hiện tại">
                            <el-select v-model="currentTeam.status" class="w-full">
                                <el-option 
                                    v-for="item in TEAM_STATUS" 
                                    :key="item.value" 
                                    :label="item.label" 
                                    :value="item.value"
                                >
                                    <span class="flex items-center gap-2">
                                        <span class="w-2 h-2 rounded-full" :class="`bg-${item.color}-500`"></span>
                                        {{ item.label }}
                                    </span>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

            </el-form>
            
            <template #footer>
                <div class="dialog-footer pt-4 border-t border-slate-100">
                    <el-button @click="editDialog = false">Hủy bỏ</el-button>
                    <el-button type="primary" :loading="submitting" @click="handleUpdate(formRef)">
                        <el-icon class="mr-1"><Edit /></el-icon> Lưu thay đổi
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
/* Giữ nguyên style tùy chỉnh nhỏ */
.custom-form :deep(.el-input-number .el-input__inner) {
    text-align: left;
}
</style>