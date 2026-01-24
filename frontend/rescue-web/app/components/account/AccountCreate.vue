<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { User, Phone, Lock, Medal, CircleCheck, Close } from '@element-plus/icons-vue';

const props = defineProps<{
    modelValue: boolean; 
}>();

const emit = defineEmits(['update:modelValue', 'success']);

// Mock service
const createAccount = async (data: any) => {
    return new Promise((resolve) => setTimeout(resolve, 1000));
};

const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive({
    full_name: '',
    phone: '',
    password: '',
    role_code: 'RESCUER',
});

// Reset form
watch(() => props.modelValue, (val) => {
    if (val) {
        form.full_name = '';
        form.phone = '';
        form.password = '';
        form.role_code = 'RESCUER';
        setTimeout(() => formRef.value?.clearValidate(), 50); 
    }
});

const rules = reactive<FormRules>({
    full_name: [
        { required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur' },
        { min: 2, message: 'Tên quá ngắn', trigger: 'blur' }
    ],
    phone: [
        { required: true, message: 'Vui lòng nhập SĐT', trigger: 'blur' },
        { pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: 'SĐT không hợp lệ', trigger: 'blur' }
    ],
    password: [
        { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
        { min: 8, message: 'Tối thiểu 8 ký tự', trigger: 'change' }
    ],
    role_code: [
        { required: true, message: 'Vui lòng chọn vai trò', trigger: 'change' }
    ]
});

const handleClose = () => emit('update:modelValue', false);

const handleSubmit = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid) => {
        if (valid) {
            submitting.value = true;
            try {
                await createAccount(form);
                ElMessage.success('Tạo tài khoản thành công!');
                emit('success'); 
                handleClose();
            } catch (e: any) {
                ElMessage.error(e.message || 'Có lỗi xảy ra');
            } finally {
                submitting.value = false;
            }
        }
    });
};
</script>

<template>
    <el-dialog 
        :model-value="modelValue" 
        @update:model-value="handleClose"
        width="460px"
        destroy-on-close
        align-center
        class="custom-modern-dialog"
        :show-close="false"
        append-to-body
    >
        <template #header>
            <div class="relative pt-6 pb-2 text-center bg-slate-50/50 rounded-t-2xl">
                <div class="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors" @click="handleClose">
                    <el-icon :size="20"><Close /></el-icon>
                </div>

                <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-600 mb-3 shadow-sm border border-blue-100">
                    <el-icon :size="24"><User /></el-icon>
                </div>
                <h3 class="text-xl font-bold text-slate-800 tracking-tight">Tạo Tài Khoản</h3>
                <p class="text-xs text-slate-500 mt-1">Điền thông tin bên dưới để thêm người dùng mới</p>
            </div>
        </template>

        <el-form 
            ref="formRef" 
            :model="form" 
            :rules="rules" 
            label-position="top" 
            class="px-6 py-2"
            size="large"
            hide-required-asterisk
        >
            <el-form-item label="Họ và tên" prop="full_name">
                <el-input 
                    v-model="form.full_name" 
                    placeholder="VD: Nguyễn Văn A" 
                    class="custom-input"
                >
                    <template #prefix>
                        <el-icon class="text-slate-400"><User /></el-icon>
                    </template>
                </el-input>
            </el-form-item>

            <div class="grid grid-cols-2 gap-4">
                <el-form-item label="Số điện thoại" prop="phone">
                    <el-input 
                        v-model="form.phone" 
                        placeholder="09xx..." 
                        maxlength="10"
                        class="custom-input"
                    >
                        <template #prefix>
                            <el-icon class="text-slate-400"><Phone /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>

                <el-form-item label="Vai trò" prop="role_code">
                    <el-select 
                        v-model="form.role_code" 
                        placeholder="Chọn vai trò" 
                        class="w-full custom-input"
                        popper-class="custom-select-popper"
                    >
                        <template #prefix>
                            <el-icon class="text-slate-400"><Medal /></el-icon>
                        </template>
                        <el-option label="Người dân" value="CITIZEN" />
                        <el-option label="Cứu hộ viên" value="RESCUER" />
                        <el-option label="Quản trị viên" value="ADMIN" />
                    </el-select>
                </el-form-item>
            </div>
            
            <el-form-item label="Mật khẩu" prop="password">
                <el-input 
                    v-model="form.password" 
                    type="password" 
                    show-password 
                    placeholder="••••••••" 
                    class="custom-input"
                >
                     <template #prefix>
                        <el-icon class="text-slate-400"><Lock /></el-icon>
                    </template>
                </el-input>
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="flex gap-3 px-6 pb-6 pt-2">
                <el-button 
                    @click="handleClose" 
                    class="flex-1 !rounded-xl !h-11 !border-slate-200 !text-slate-600 hover:!bg-slate-50 hover:!text-slate-900 transition-colors font-medium"
                >
                    Đóng
                </el-button>
                <el-button 
                    type="primary" 
                    :loading="submitting" 
                    @click="handleSubmit"
                    class="flex-1 !rounded-xl !h-11 !bg-blue-600 hover:!bg-blue-700 shadow-lg shadow-blue-200/50 font-medium transition-transform active:scale-[0.98]"
                >
                    <el-icon class="mr-2"><CircleCheck /></el-icon>
                    Xác nhận
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style>
/* 1. Dialog Styling */
.custom-modern-dialog {
    border-radius: 20px !important; /* Bo góc mềm mại hơn */
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}

.custom-modern-dialog .el-dialog__header {
    margin: 0;
    padding: 0;
}

.custom-modern-dialog .el-dialog__body {
    padding: 0 !important; /* Reset padding mặc định để tự control */
}

.custom-modern-dialog .el-dialog__footer {
    padding: 0;
}

/* 2. Input Styling */
.custom-input .el-input__wrapper {
    box-shadow: none !important;
    background-color: #f8fafc; /* Slate-50: Màu nền nhẹ dịu mắt */
    border: 1px solid #e2e8f0; /* Slate-200 */
    border-radius: 12px !important;
    padding-left: 12px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-input .el-input__wrapper:hover {
    background-color: #fff;
    border-color: #cbd5e1;
}

.custom-input .el-input__wrapper.is-focus {
    background-color: #fff;
    border-color: #3b82f6; /* Blue-500 */
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important; /* Hiệu ứng ring focus nhẹ */
}

/* 3. Label Styling */
.el-form-item__label {
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    color: #475569 !important; /* Slate-600 */
    margin-bottom: 4px !important;
}

/* 4. Fix select dropdown border radius */
.custom-select-popper .el-popper__arrow::before {
    background: white !important;
}
.custom-select-popper {
    border-radius: 12px !important;
}
</style>