<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
    Plus, Search, MoreFilled, 
    Edit, Delete, Key, Lock, Unlock, Refresh, CopyDocument,
    Message, Phone as PhoneIcon, Calendar
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import AccountCreate from '~/components/account/AccountCreate.vue';

definePageMeta({ layout: 'admin' });

// --- Composable & Logic ---
const { 
    loading, accounts, search, hasMore,
    fetchData, handleSearch, handleLoadMore, handleToggleStatus
} = useAccountList();

const dialogVisible = ref(false);

// --- Helpers ---
const copyToClipboard = (text: string | number) => {
    navigator.clipboard.writeText(String(text));
    ElMessage.success('Đã sao chép');
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const getRoleInfo = (roleName: string) => {
    // Chuyển hết về chữ thường để so sánh cho chắc ăn
    const r = (roleName || '').toLowerCase(); 
    
    // 1. Check ADMIN
    if (r.includes('admin') || r.includes('quản trị')) {
        return { 
            label: 'Quản trị viên', 
            class: 'bg-purple-100 text-purple-700 border-purple-200 ring-1 ring-purple-500/10' 
        };
    }

    // 2. Check CỨU HỘ (Dữ liệu của bạn là "Đội cứu hộ")
    if (r.includes('cứu hộ') || r.includes('rescuer')) {
        return { 
            label: 'Cứu hộ viên', 
            class: 'bg-blue-100 text-blue-700 border-blue-200 ring-1 ring-blue-500/10' 
        };
    }
    
    // 3. Mặc định là NGƯỜI DÂN
    return { 
        label: 'Người dân', 
        class: 'bg-gray-100 text-gray-600 border-gray-200 ring-1 ring-gray-500/10' 
    };
};

const getAvatarLetter = (name: string) => (name ? name.charAt(0).toUpperCase() : '?');

// --- Handlers (Giữ nguyên logic cũ) ---
const handleEdit = (row: any) => { console.log('Sửa:', row); };
const handleResetPassword = (row: any) => {
    ElMessageBox.prompt(`Đặt lại mật khẩu cho: ${row.full_name}`, 'Reset Password', {
        confirmButtonText: 'Xác nhận', cancelButtonText: 'Hủy', inputType: 'password',
        inputPattern: /.{8,}/, inputErrorMessage: 'Mật khẩu tối thiểu 8 ký tự',
    }).then(({ value }) => { ElMessage.success('Đổi mật khẩu thành công'); });
};
const handleDelete = (row: any) => {
    ElMessageBox.confirm('Hành động này không thể hoàn tác?', 'Cảnh báo', { 
        confirmButtonText: 'Xóa', type: 'warning' 
    }).then(() => { ElMessage.success('Đã xóa thành công'); });
};

onMounted(fetchData);
</script>
<template>
    <div class="min-h-screen bg-gray-100 p-6 space-y-4">
        
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <div>
                    <h1 class="text-lg font-bold text-gray-900">Tài khoản hệ thống</h1>
                    <p class="text-xs text-gray-500">Quản lý {{ accounts.length }} người dùng</p>
                </div>
            </div>
            
            <div class="flex items-center gap-2 w-full md:w-auto">
                <el-input 
                    v-model="search" 
                    placeholder="Tìm SĐT, Email..." 
                    class="w-64"
                    clearable
                    @clear="handleSearch"
                    @keyup.enter="handleSearch"
                >
                    <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
                <el-button :icon="Refresh" circle @click="fetchData(false)" />
                <el-button type="primary" :icon="Plus" @click="dialogVisible = true" class="!font-semibold">Thêm mới</el-button>
            </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <el-table 
                :data="accounts" 
                v-loading="loading" 
                style="width: 100%"
                :header-cell-style="{ background: '#f8fafc', color: '#334155', fontWeight: '700', fontSize: '13px' }"
                row-class-name="group hover:bg-gray-50"
            >
                <el-table-column label="ID" width="100" align="center" fixed="left">
                    <template #default="{ row }">
                        <div class="flex items-center justify-center gap-1 group/id">
                            <span class="font-mono text-xs text-gray-500">{{ row.id.slice(0, 6) }}</span>
                            <el-icon class="text-gray-400 hover:text-blue-600 cursor-pointer opacity-0 group-hover/id:opacity-100 transition-opacity" @click="copyToClipboard(row.id)">
                                <CopyDocument />
                            </el-icon>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="Họ và tên" min-width="180">
                    <template #default="{ row }">
                        <div class="flex items-center gap-3">
                            <el-avatar :size="32" class="bg-blue-600 text-white text-xs font-bold">
                                {{ getAvatarLetter(row.full_name) }}
                            </el-avatar>
                            <span class="font-bold text-gray-900 text-sm cursor-pointer hover:text-blue-600 transition-colors" @click="handleEdit(row)">
                                {{ row.full_name || 'Chưa đặt tên' }}
                            </span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="Số điện thoại" width="150">
                    <template #default="{ row }">
                        <div class="flex items-center gap-2">
                            <div class="p-1.5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                                <el-icon class="text-xs"><PhoneIcon /></el-icon>
                            </div>
                            <span class="font-mono text-sm text-gray-700 font-medium">{{ row.phone || '--' }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="Email" min-width="220">
                    <template #default="{ row }">
                        <div class="flex items-center gap-2">
                            <div class="p-1.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <el-icon class="text-xs"><Message /></el-icon>
                            </div>
                            <span class="text-sm text-gray-700 truncate font-medium" :title="row.email">{{ row.email || '--' }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="Ngày tạo" width="140" align="center">
                    <template #default="{ row }">
                        <div class="flex items-center justify-center gap-2">
                             <div class="p-1.5 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                                <el-icon class="text-xs"><Calendar /></el-icon>
                            </div>
                            <span class="text-sm text-gray-600 font-medium">{{ formatDate(row.created_at) }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="Vai trò" width="150" align="center">
                    <template #default="{ row }">
                        <span 
                            class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border" 
                            :class="getRoleInfo(row.role?.name).class"
                        >
                            {{ getRoleInfo(row.role?.name).label }}
                        </span>
                    </template>
                </el-table-column>

                <el-table-column label="Trạng thái" width="120" align="center">
                    <template #default="{ row }">
                        <div v-if="row.is_active" class="flex items-center justify-center gap-1.5 text-xs font-bold text-green-700">
                            <span class="relative flex h-2 w-2">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                            </span>
                            Hoạt động
                        </div>
                        <div v-else class="flex items-center justify-center gap-1.5 text-xs font-bold text-red-700">
                            <span class="w-2 h-2 bg-red-600 rounded-full"></span>
                            Đã khóa
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="" width="60" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-dropdown trigger="click" placement="bottom-end">
                            <div class="p-1.5 rounded-md hover:bg-gray-100 cursor-pointer text-gray-500 hover:text-blue-600 transition-colors">
                                <el-icon :size="20"><MoreFilled /></el-icon>
                            </div>
                            <template #dropdown>
                                <el-dropdown-menu class="custom-dropdown">
                                    <el-dropdown-item :icon="Edit" @click="handleEdit(row)">Sửa thông tin</el-dropdown-item>
                                    <el-dropdown-item :icon="Key" @click="handleResetPassword(row)">Đặt lại mật khẩu</el-dropdown-item>
                                    <el-dropdown-item :icon="row.is_active ? Lock : Unlock" @click="handleToggleStatus(row)" divided>
                                        {{ row.is_active ? 'Khóa tài khoản' : 'Mở khóa' }}
                                    </el-dropdown-item>
                                    <el-dropdown-item :icon="Delete" class="text-red-500" @click="handleDelete(row)">Xóa tài khoản</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </template>
                </el-table-column>
            </el-table>

            <div class="p-3 bg-gray-50 border-t border-gray-200 flex justify-center">
                <el-button v-if="hasMore" :loading="loading" @click="handleLoadMore" text bg size="small" class="!text-blue-600 !font-medium">
                    Tải thêm dữ liệu
                </el-button>
                <span v-else class="text-xs text-gray-500 font-medium">Đã hết dữ liệu</span>
            </div>
        </div>

        <AccountCreate v-model="dialogVisible" @success="handleSearch" />
    </div>
</template>

<style scoped>
:deep(.el-table__inner-wrapper::before) {
    display: none;
}
/* Làm đậm tiêu đề bảng hơn */
:deep(.el-table th.el-table__cell) {
    color: #334155 !important; /* slate-800 */
}
</style>