<script setup lang="ts">
import { computed } from 'vue';
import { 
  UserFilled, 
  Van, 
  Phone, 
  CircleCheckFilled, 
  CircleCloseFilled 
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus'; // Import thêm UI
import type { RescueRequest } from '@/types/rescue';
import { useRescueService } from '@/composables/useRescueService'; // Import Service

const props = defineProps<{ request: RescueRequest | null }>();
const emit = defineEmits(['openDispatch', 'refresh']); // Emit 'refresh' để báo cha reload

// Khởi tạo Service
const { cancelAssignment } = useRescueService();

const assignment = computed(() => props.request?.active_assignment);

// 1. Kiểm tra trạng thái để ẩn/hiện nút Hủy
const isFinished = computed(() => {
    if (!assignment.value) return false;
    const s = assignment.value.status?.toLowerCase() || '';
    return ['hoàn thành', 'hủy', 'kết thúc', 'xong'].some(k => s.includes(k));
});

// 2. Cấu hình giao diện (Màu sắc, Icon)
const statusConfig = computed(() => {
    if (!assignment.value) return {};
    const status = assignment.value.status || 'Đang thực hiện';
    
    if (status.toLowerCase().includes('hoàn thành')) {
        return {
            colorClass: 'text-green-700 bg-green-50 border-green-200',
            iconColor: 'text-green-600',
            badgeBg: 'bg-green-100',
            icon: CircleCheckFilled,
            label: 'ĐÃ HOÀN THÀNH'
        };
    }
    return {
        colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600',
        badgeBg: 'bg-blue-100',
        icon: Van,
        label: status.toUpperCase()
    };
});

// 3. Format thời gian hiển thị
const formattedTime = computed(() => {
    if (!assignment.value?.updated_at) return '';
    try {
        const date = new Date(assignment.value.updated_at);
        return new Intl.DateTimeFormat('vi-VN', { 
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' 
        }).format(date);
    } catch { return ''; }
});

// --- HÀM XỬ LÝ HỦY ĐIỀU PHỐI (QUAN TRỌNG) ---
const handleCancelDispatch = () => {
  const assignmentData = props.request?.active_assignment;
  // Lấy ID nhiệm vụ (thử nhiều trường hợp tên biến để chắc chắn)
  // @ts-ignore
  const assignmentId = assignmentData?.task_id || assignmentData?.id || assignmentData?.assignment_id;

  if (!assignmentId) {
      ElMessage.warning('Lỗi: Không tìm thấy ID nhiệm vụ!');
      return;
  }

  ElMessageBox.confirm(
    'Bạn có chắc chắn muốn hủy đội cứu hộ này không? Lệnh điều động sẽ bị thu hồi.',
    'Xác nhận hủy',
    {
      confirmButtonText: 'Đồng ý Hủy',
      cancelButtonText: 'Đóng',
      type: 'warning',
      center: true
    }
  ).then(async () => {
    try {
      // Gọi API cancelAssignment từ Service
      // Truyền lý do mặc định vì backend yêu cầu chuỗi
      await cancelAssignment(String(assignmentId)); 
      
      ElMessage.success('Đã hủy phân công thành công');
      emit('refresh'); // Báo ra ngoài để component cha reload dữ liệu
    } catch (e: any) {
      ElMessage.error(e.message || 'Lỗi khi hủy phân công');
    }
  }).catch(() => {
      // Người dùng bấm Cancel -> Không làm gì
  });
};
</script>

<template>
    <div v-if="request" class="pt-2 mt-auto sticky bottom-0 bg-white pb-4 border-t border-slate-100 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        
        <div v-if="assignment" 
             class="border rounded-lg p-3 shadow-sm transition-all"
             :class="statusConfig.colorClass">
            
            <div class="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
                <span class="text-xs font-bold uppercase flex items-center gap-1.5">
                    <el-icon :size="16"><component :is="statusConfig.icon" /></el-icon> 
                    {{ statusConfig.label }}
                </span>
                <span v-if="formattedTime" class="text-[10px] font-medium px-2 py-0.5 rounded-full" :class="statusConfig.badgeBg">
                    {{ formattedTime }}
                </span>
            </div>
            
            <div class="flex items-center gap-3 mb-3">
                <div class="bg-white p-2.5 rounded-full border shadow-sm">
                    <el-icon class="text-xl" :class="statusConfig.iconColor"><UserFilled /></el-icon>
                </div>
                <div class="flex-1 min-w-0"> 
                    <p class="font-bold text-slate-800 text-sm truncate">
                        {{ assignment.team_name || 'Chưa có tên' }}
                    </p>
                    <div class="flex items-center gap-1 mt-0.5">
                        <el-icon class="text-slate-400 text-xs"><Phone /></el-icon>
                        <p class="text-xs text-slate-600 font-mono font-medium">
                            {{ assignment.team_phone || '---' }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="flex gap-2">
                <a :href="assignment.team_phone ? `tel:${assignment.team_phone}` : '#'" class="flex-1 block">
                    <el-button class="w-full" size="default" type="primary" plain :icon="Phone">
                        Gọi Đội
                    </el-button>
                </a>

                <el-button 
                    v-if="!isFinished"
                    size="default" 
                    type="danger" 
                    bg text
                    class="flex-1"
                    :icon="CircleCloseFilled"
                    @click="handleCancelDispatch" 
                >
                    Hủy Đội
                </el-button>
            </div>
        </div>

        <el-button 
            v-else
            type="danger" 
            class="w-full h-12 text-lg font-bold shadow-lg shadow-red-100 transition-transform active:scale-95" 
            :icon="UserFilled" 
            @click="emit('openDispatch')"
        >
            ĐIỀU ĐỘNG CỨU HỘ
        </el-button>
    </div>
</template>