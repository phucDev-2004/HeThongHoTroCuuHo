<script setup lang="ts">
import { 
  Search, Filter, View, Refresh,
  UserFilled, PhoneFilled, LocationFilled, Van,
  Timer, Tickets, ArrowRight, Check
} from '@element-plus/icons-vue';
import type { RescueTask } from '~/types/task';
import TaskDetailDialog from '~/components/tasks/TaskDetailDialog.vue';

definePageMeta({ layout: 'admin' });

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const tasks = ref([]);

const { getAssignmentById } = useRescueService();

const { 
  filteredTasks, pending, error, refresh,
  searchQuery, statusFilter,
  formatDateTime, getPeopleSummary
} = useRescueTaskList();

// State quản lý Dialog
const detailVisible = ref(false);
const detailLoading = ref(false);
const selectedTask = ref<RescueTask | null>(null);

// Hàm mở Dialog
const openDetail = async (task: RescueTask) => {
  // 1. Mở dialog ngay để tạo phản hồi UI
  detailVisible.value = true;
  detailLoading.value = true;
  
  selectedTask.value = null;

  try {
    // 2. Gọi API lấy chi tiết mới nhất
    const fullDetail = await getAssignmentById(task.id);
    selectedTask.value = fullDetail;
  } catch (error) {
    console.error("Lỗi tải chi tiết:", error);
    ElNotification.error({
      title: 'Lỗi',
      message: 'Không thể tải thông tin chi tiết nhiệm vụ.'
    });
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
};

const fetchTasks = async () => {
  loading.value = true;
  try {
    console.log('Đang tải danh sách nhiệm vụ...'); 
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};
const handleSearch = () => {
  // Logic tìm kiếm: reset trang về 1 và gọi lại fetchTasks
  fetchTasks();
};

onMounted(async () => {
    // 1. Vẫn tải danh sách nền bên dưới để nhìn cho đẹp
    await fetchTasks();

    // 2. Kiểm tra URL xem có taskId không
    const targetTaskId = route.query.taskId as string; // <--- Đổi thành taskId cho rõ nghĩa
    
    if (targetTaskId) {
        // THAY VÌ SEARCH, GỌI HÀM MỞ DIALOG LUÔN
        // Ta tạo một object giả chỉ chứa ID để truyền vào hàm openDetail
        // Vì hàm openDetail chỉ cần task.id để gọi API getAssignmentById
        openDetail({ id: targetTaskId } as RescueTask);
        
        // Xóa query trên URL
        router.replace({ query: {} });
    } 
    // Nếu chỉ có requestId (trường hợp cũ) thì vẫn search như thường
    else if (route.query.requestId) {
        searchQuery.value = route.query.requestId as string;
    }
});

// 1. Map trạng thái sang màu sắc & Icon
const getStatusMeta = (status: string) => {
  switch(status) {
    case 'Đã điều động': 
      return { type: 'info', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: Tickets, label: 'Đã nhận lệnh' };
    case 'Đang di chuyển': 
      return { type: 'warning', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Van, label: 'Đang di chuyển' };
    case 'Đã đến': 
      return { type: 'primary', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: LocationFilled, label: 'Đã đến nơi' };
    case 'Hoàn thành': 
      return { type: 'success', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: Check, label: 'Hoàn thành' };
    default: 
      return { type: 'info', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: Timer, label: status };
  }
};

// 2. Timeline Mini (Visual Progress)
const getProgressSteps = (currentStatus: string) => {
  const steps = ['Đã điều động', 'Đang di chuyển', 'Đã đến', 'Hoàn thành'];
  const currentIndex = steps.indexOf(currentStatus);
  return { steps, currentIndex };
};

const handleRefresh = () => refresh();
const handleViewMap = (task: RescueTask) => { console.log("View Map ID:", task.id); };

// Hàm helper để hiển thị danh sách người (nếu có chi tiết)
const getVictimDetails = (req: any) => {
  if (!req) return 'Không có thông tin';
  const parts = [];
  if (req.adults) parts.push(`${req.adults} người lớn`);
  if (req.children) parts.push(`${req.children} trẻ em`);
  if (req.elderly) parts.push(`${req.elderly} người già`);
  return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật số lượng';
};
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 p-6 flex flex-col gap-6">
    
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-orange-200">
          <el-icon :size="24"><Tickets /></el-icon>
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-800 tracking-tight">Điều Phối Nhiệm Vụ</h1>
          <p class="text-sm text-slate-500 font-medium">
            <span v-if="pending" class="flex items-center gap-2"><el-icon class="is-loading"><Refresh /></el-icon> Đang đồng bộ...</span>
            <span v-else>Theo dõi {{ filteredTasks.length }} nhiệm vụ đang hoạt động</span>
          </p>
        </div>
      </div>
      
      <div class="flex gap-3 w-full md:w-auto">
         <el-button :icon="Refresh" circle plain @click="handleRefresh" class="!border-slate-200 hover:!bg-slate-50 hover:!text-orange-600" />
         <el-button type="primary" :icon="Filter" class="!rounded-xl !bg-slate-800 hover:!bg-slate-700 border-none shadow-lg shadow-slate-200">Xuất Báo Cáo</el-button>
      </div>
    </div>

    <div class="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2 items-center">
      <div class="w-full md:w-72">
         <el-input 
           v-model="searchQuery" 
           placeholder="Tìm mã lệnh, tên nạn nhân..." 
           :prefix-icon="Search"
           clearable
           class="custom-search-input"
         />
      </div>
      <div class="w-full md:w-48">
         <el-select v-model="statusFilter" placeholder="Trạng thái" clearable class="w-full">
           <template #prefix><el-icon class="text-slate-400"><Filter /></el-icon></template>
           <el-option label="Đã điều động" value="Đã điều động" />
           <el-option label="Đang di chuyển" value="Đang di chuyển" />
           <el-option label="Đã đến" value="Đã đến" />
           <el-option label="Hoàn thành" value="Hoàn thành" />
         </el-select>
      </div>
    </div>

    <el-alert v-if="error" title="Lỗi kết nối" type="error" :description="error.message" show-icon class="!rounded-xl" />

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-grow flex flex-col">
      <el-table 
        :data="filteredTasks" 
        v-loading="pending"
        style="width: 100%; height: 100%;" 
        :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: '600', padding: '12px', fontSize: '13px' }"
        row-class-name="hover:bg-slate-50/80 transition-colors group"
      >
        <el-table-column label="Mã lệnh & Thời gian" min-width="180">
          <template #default="{ row }">
            <div class="flex flex-col gap-1.5 py-2">
              <div class="flex items-center gap-2">
                 <span class="w-1.5 h-8 rounded-full bg-slate-200 group-hover:bg-orange-500 transition-colors"></span>
                 <div class="flex flex-col">
                    <span class="font-bold text-slate-800 text-[15px] font-mono tracking-tight cursor-pointer hover:text-orange-600 transition-colors">
                      {{ row.rescue_request?.code || 'N/A' }}
                    </span>
                    <span class="text-xs text-slate-400 flex items-center gap-1">
                      <el-icon><Timer /></el-icon> {{ formatDateTime(row.assigned_at) }}
                    </span>
                 </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Thông tin nạn nhân" min-width="260">
          <template #default="{ row }">
             <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                   <el-avatar :size="24" class="bg-red-100 text-red-600 text-[10px] font-bold">
                      {{ row.rescue_request?.name?.charAt(0) || '?' }}
                   </el-avatar>
                   <span class="text-sm font-bold text-slate-700">{{ row.rescue_request?.name }}</span>
                   <span class="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                      {{ row.rescue_request?.contact_phone }}
                   </span>
                </div>
                
                <div class="flex items-start gap-1.5 pl-8">
                   <el-icon class="text-slate-400 mt-0.5 shrink-0"><LocationFilled /></el-icon>
                   <span class="text-xs text-slate-600 line-clamp-2 leading-relaxed" :title="row.rescue_request?.address">
                      {{ row.rescue_request?.address }}
                   </span>
                </div>

                <div class="pl-8 mt-1">
                   <span class="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 inline-flex items-center gap-1">
                      <el-icon><UserFilled /></el-icon> {{ getPeopleSummary(row.rescue_request) }}
                   </span>
                </div>
             </div>
          </template>
        </el-table-column>

        <el-table-column label="Tiến độ thực hiện" min-width="200">
          <template #default="{ row }">
             <div class="flex flex-col gap-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border w-fit"
                     :class="[getStatusMeta(row.status).bg, getStatusMeta(row.status).border, getStatusMeta(row.status).color]">
                   <el-icon class="text-sm" :class="{'animate-spin': row.status === 'Đang di chuyển'}">
                      <component :is="getStatusMeta(row.status).icon" />
                   </el-icon>
                   <span class="text-xs font-bold">{{ getStatusMeta(row.status).label }}</span>
                </div>
                
                <div class="flex gap-1 h-1 w-32">
                   <div v-for="(step, idx) in getProgressSteps(row.status).steps" :key="step"
                        class="h-full flex-1 rounded-full transition-all duration-500"
                        :class="idx <= getProgressSteps(row.status).currentIndex 
                           ? (row.status === 'Hoàn thành' ? 'bg-green-500' : 'bg-orange-500') 
                           : 'bg-slate-200'">
                   </div>
                </div>
             </div>
          </template>
        </el-table-column>

        <el-table-column label="Đơn vị phụ trách" min-width="220">
          <template #default="{ row }">
             <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                   <el-icon :size="18"><Van /></el-icon>
                </div>
                <div class="flex flex-col">
                   <span class="text-sm font-semibold text-slate-800">{{ row.rescue_team?.team_name }}</span>
                   <a v-if="row.rescue_team?.team_phone" :href="`tel:${row.rescue_team.team_phone}`" class="text-xs text-blue-500 hover:underline font-mono flex items-center gap-1">
                      <el-icon><PhoneFilled /></el-icon> {{ row.rescue_team.team_phone }}
                   </a>
                </div>
             </div>
          </template>
        </el-table-column>

       <el-table-column width="80" align="center" fixed="right">
          <template #default="{ row }">
             <el-tooltip content="Xem chi tiết" placement="left">
               <el-button 
                 circle plain :icon="ArrowRight" 
                 @click="openDetail(row)" 
                 class="!border-slate-200 !text-slate-400 hover:!bg-orange-50 hover:!text-orange-600 hover:!border-orange-200 transition-all"
               />
             </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <div class="p-3 border-t border-slate-200 flex justify-end bg-slate-50/50">
        <el-pagination 
           layout="total, prev, pager, next" 
           :total="filteredTasks.length" 
           :page-size="20" 
           background 
           small 
           class="custom-pagination"
        />
      </div>
    </div>

    <TaskDetailDialog 
      v-model="detailVisible" 
      :task="selectedTask" 
    />

  </div>
</template>

<style scoped>
.custom-search-input :deep(.el-input__wrapper) {
  box-shadow: none;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding-left: 12px;
}
.custom-search-input :deep(.el-input__wrapper.is-focus) {
  background-color: #fff;
  border-color: #f97316; /* Orange-500 */
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
}
</style>