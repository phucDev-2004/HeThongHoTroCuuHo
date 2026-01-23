<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia'; // Import để lấy reactive data từ store
import { 
  WarningFilled, UserFilled, Finished, ArrowRight, Timer, View,
  Bell, ChatDotRound, CircleCheckFilled, InfoFilled, WarnTriangleFilled,
  Loading, Van, LocationFilled // Thêm icon Xe và Vị trí
} from '@element-plus/icons-vue';
import StatCard from '~/components/StatCard.vue';
import { useRescueService } from '~/composables/useRescueService';
import { useRescueStore } from '~/stores/rescueStore'; // Import Store
import type { AppNotification } from '~/types/notification'; // Import Type

definePageMeta({ layout: 'admin' });

// --- 1. CONFIG & STORE ---
const router = useRouter();
const { getAll, getDashboardStats } = useRescueService();
const rescueStore = useRescueStore(); // Khởi tạo Store

// Lấy danh sách thông báo từ Store (Tự động cập nhật khi có Socket)
const { notifications } = storeToRefs(rescueStore);

const isLoading = ref(false);

// ... (Giữ nguyên Interface & State của Incidents/Stats) ...
interface DashboardStatResponse {
  pending_count: number;
  ready_teams_count: number;
  processed_today_count: number;
}

interface IncidentUI {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  status: string;
  time: string; 
}

const recentIncidents = ref<IncidentUI[]>([]);
const statData = ref([
  { title: 'Sự cố đang chờ', value: 0, unit: 'vụ', icon: WarningFilled, color: 'red' as const, change: '...', percent: 0 },
  { title: 'Lực lượng sẵn sàng', value: 0, unit: 'đơn vị', icon: UserFilled, color: 'green' as const, change: '...', percent: 0 },
  { title: 'Đã xử lý hôm nay', value: 0, unit: 'vụ', icon: Finished, color: 'blue' as const, change: '...', percent: 0 },
]);

// --- 2. HELPER UI CHO LIVE LOG (New) ---
// Hàm này chọn màu và icon cho timeline dựa trên sự kiện
const getLogStyle = (item: AppNotification) => {
  // 1. SOS Mới -> Đỏ rực
  if (item.type === 'new_request') {
    return { 
      icon: WarningFilled, 
      color: 'text-red-500 bg-red-500/10 border-red-500/20 ring-red-900/20' 
    };
  }
  // 2. Hoàn thành -> Xanh lá
  if (item.type === 'complete') {
    return { 
      icon: CircleCheckFilled, 
      color: 'text-green-500 bg-green-500/10 border-green-500/20 ring-green-900/20' 
    };
  }
  // 3. Đang di chuyển -> Cam (Xe)
  if (item.subStatus === 'IN_PROGRESS') {
    return { 
      icon: Van, 
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20 ring-orange-900/20' 
    };
  }
  // 4. Đã đến nơi -> Tím (Vị trí)
  if (item.subStatus === 'ARRIVED') {
    return { 
      icon: LocationFilled, 
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 ring-purple-900/20' 
    };
  }
  // Mặc định (Phân công, Tin hệ thống) -> Xanh dương
  return { 
    icon: InfoFilled, 
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 ring-blue-900/20' 
  };
};

const formatLogTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// ... (Giữ nguyên các helper cũ timeAgo, getStatusColor, getStatusText) ...
const timeAgo = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
};

const getStatusColor = (status: string) => {
    switch(status) {
        case 'Chờ xử lý': return 'text-red-400 bg-red-400/10 border-red-400/20';
        case 'Đang thực hiện': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        case 'Hoàn thành': return 'text-green-400 bg-green-400/10 border-green-400/20';
        default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
};

const getStatusText = (status: string) => {
    const map: Record<string, string> = { 'PENDING': 'Đang chờ', 'PROCESSING': 'Đang xử lý', 'DONE': 'Hoàn thành', 'CANCELLED': 'Đã hủy' };
    return map[status] || status;
}

const navigateToDetail = (id: string) => {
  router.push({ path: '/admin/incidents', query: { id: id } });
};

// pages/index.vue

const handleLogClick = (log: AppNotification) => {
    if (log.type === 'new_request') {
        router.push({ path: '/admin/incidents', query: { id: log.relatedId } });
        return;
    }

    const taskId = log.taskId || (log as any).data?.task_id || (log as any).meta?.task_id || (log as any).task_id;
    if (taskId) {
        router.push({ 
            path: '/admin/tasks', 
            query: { taskId: taskId } 
        });
    } else {
        router.push({ 
            path: '/admin/tasks', 
            query: { requestId: log.relatedId } 
        });
    }
};

// --- DATA FETCHING ---
const fetchRecentIncidents = async () => {
  isLoading.value = true;
  try {
    const response = await getAll({page: 1, page_size: 20 });
    const rawData = Array.isArray(response) ? response : (response as any).items || [];
    recentIncidents.value = rawData.map((item: any) => ({
      id: item.id,
      code: item.code,
      name: item.name || 'Không rõ',
      phone: item.contact_phone || '---',
      address: item.address || 'Chưa có định vị',
      status: item.status || 'PENDING',
      time: timeAgo(item.created_at)
    }));
  } catch (error) { console.error(error); } finally { isLoading.value = false; }
};

const fetchStats = async () => {
  try {
    const data: DashboardStatResponse = await getDashboardStats();
    if (data) {
        statData.value[0]!.value = data.pending_count ?? 0;
        statData.value[1]!.value = data.ready_teams_count ?? 0;
        statData.value[2]!.value = data.processed_today_count ?? 0;
    }
  } catch (error) { console.error(error); }
}

onMounted(() => { 
    fetchRecentIncidents(); 
    fetchStats(); 
    // Socket đã được kết nối ở Layout (admin.vue), nên ở đây không cần gọi connect nữa 
    // Trừ khi trang này chạy độc lập không qua layout admin
});
</script>

<template>
  <div class="p-0">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard v-for="(stat, idx) in statData" :key="idx" v-bind="stat" />
      <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col justify-between">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Truy Cập Nhanh</h3>
        <NuxtLink to="/admin/incidents" class="flex items-center justify-between px-3 py-2 bg-slate-700/30 rounded-lg hover:bg-slate-700 transition-colors group">
          <span class="text-slate-300 text-sm font-medium group-hover:text-white">Danh sách sự cố</span>
          <el-icon class="text-red-500 text-base group-hover:scale-110 transition-transform"><WarningFilled /></el-icon>
        </NuxtLink>
        <NuxtLink to="/admin/map" class="mt-1 flex items-center justify-between px-3 py-2 bg-slate-700/30 rounded-lg hover:bg-slate-700 transition-colors group">
          <span class="text-slate-300 text-sm font-medium group-hover:text-white">Bản đồ trực chiến</span>
          <el-icon class="text-green-500 text-base group-hover:scale-110 transition-transform"><View /></el-icon>
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div class="lg:col-span-2 flex flex-col">
        <div class="bg-slate-800 rounded-xl border border-slate-700 shadow-lg h-[630px] flex flex-col overflow-hidden">
          <div class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 flex-shrink-0">
             <h3 class="text-sm font-semibold text-white uppercase flex items-center gap-2">
               <el-icon class="text-red-500"><Timer /></el-icon> Tiếp nhận gần đây
             </h3>
             <NuxtLink to="/admin/incidents" class="text-xs text-blue-400 hover:underline flex items-center gap-1">
               Xem tất cả <el-icon><ArrowRight /></el-icon>
             </NuxtLink>
          </div>
          
          <div class="flex-1 overflow-y-auto scrollbar-thin relative">
            <table class="w-full text-left border-collapse">
                <thead class="sticky top-0 z-10">
                    <tr class="text-slate-400 text-xs border-b border-slate-700 bg-slate-900 shadow-md">
                        <th class="p-4 font-medium uppercase whitespace-nowrap">Mã SC</th>
                        <th class="p-4 font-medium uppercase whitespace-nowrap">Thông tin báo tin</th>
                        <th class="p-4 font-medium uppercase whitespace-nowrap">Trạng thái</th>
                        <th class="p-4 font-medium uppercase whitespace-nowrap text-right">Thời gian</th>
                    </tr>
                </thead>
                <tbody class="text-sm divide-y divide-slate-700/50">
                    <tr v-if="isLoading">
                        <td colspan="4" class="p-10 text-center">
                            <div class="flex flex-col items-center justify-center text-slate-500 gap-2">
                                <el-icon class="is-loading text-2xl text-blue-500"><Loading /></el-icon>
                                <span class="text-xs animate-pulse">Đang cập nhật dữ liệu...</span>
                            </div>
                        </td>
                    </tr>
                    <tr v-else-if="!isLoading && recentIncidents.length === 0">
                        <td colspan="4" class="p-10 text-center text-slate-500 text-xs">
                            <div class="flex flex-col items-center gap-2">
                                <el-icon class="text-2xl"><InfoFilled /></el-icon>
                                Chưa có yêu cầu cứu hộ nào gần đây.
                            </div>
                        </td>
                    </tr>
                    <tr v-else v-for="item in recentIncidents" :key="item.id" @click="navigateToDetail(item.id)" class="hover:bg-slate-700/50 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-blue-500">
                        <td class="p-4 align-top">
                            <span class="font-mono text-blue-400 font-bold group-hover:text-blue-300">#{{ item.code }}</span>
                        </td>
                        <td class="p-4 align-top">
                            <div class="text-white font-semibold text-sm">{{ item.name }}</div>
                            <div class="text-xs text-slate-400 mt-0.5 line-clamp-2" :title="item.address">
                                {{ item.address }}
                            </div>
                            <div class="text-[11px] text-emerald-400 font-mono mt-1 font-medium flex items-center gap-1">
                                <span>📞</span> {{ item.phone }}
                            </div>
                        </td>
                        <td class="p-4 align-top">
                            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap inline-block" :class="getStatusColor(item.status)">
                                {{ getStatusText(item.status) }}
                            </span>
                        </td>
                        <td class="p-4 text-right align-top text-slate-300 text-xs font-mono whitespace-nowrap">
                            {{ item.time }}
                        </td>
                    </tr>
                </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        
        <div class="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col h-[400px]">
          <div class="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
             <h3 class="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
               <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
               Hoạt động trực tuyến
             </h3>
             <span class="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">Realtime</span>
          </div>

          <div class="flex-1 overflow-y-auto p-4 scrollbar-thin">
             <TransitionGroup name="list" tag="div" class="relative border-l border-slate-700 ml-2 space-y-6 pb-2">
                
                <div v-for="log in notifications" :key="log.id" class="ml-6 relative group cursor-pointer" @click="handleLogClick(log)">
                   
                   <span class="absolute -left-[35px] flex h-8 w-8 items-center justify-center rounded-full border ring-4 ring-slate-800 transition-transform group-hover:scale-110" 
                         :class="getLogStyle(log).color">
                      <el-icon :size="14"><component :is="getLogStyle(log).icon" /></el-icon>
                   </span>

                   <div class="flex flex-col bg-slate-700/20 p-2 rounded-lg hover:bg-slate-700/40 transition-colors border border-transparent hover:border-slate-600">
                      <span class="text-xs font-bold text-slate-300 mb-0.5">{{ log.title }}</span>
                      <span class="text-xs font-medium text-slate-400 leading-snug">{{ log.message }}</span>
                      
                      <span class="text-[10px] text-slate-500 mt-1 font-mono flex items-center gap-1">
                        <el-icon><Timer /></el-icon> {{ formatLogTime(log.time) }}
                      </span>
                   </div>
                </div>

             </TransitionGroup>
             
             <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center h-full text-slate-500 text-xs gap-2 opacity-50">
                 <el-icon :size="30"><ChatDotRound /></el-icon>
                 Chưa có hoạt động mới
             </div>
          </div>
        </div>

        <div class="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-4">
          <h3 class="text-xs font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <el-icon><InfoFilled /></el-icon> Phân loại hôm nay
          </h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-slate-300 font-medium">Tai nạn giao thông</span>
                <span class="text-slate-400 font-mono">65%</span>
              </div>
              <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                <div class="h-full bg-gradient-to-r from-red-600 to-red-500 w-[65%] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-slate-300 font-medium">Cháy nổ / Hỏa hoạn</span>
                <span class="text-slate-400 font-mono">20%</span>
              </div>
              <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                <div class="h-full bg-gradient-to-r from-orange-600 to-orange-500 w-[20%]"></div>
              </div>
            </div>
             <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-slate-300 font-medium">Cấp cứu y tế</span>
                <span class="text-slate-400 font-mono">15%</span>
              </div>
              <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                <div class="h-full bg-gradient-to-r from-blue-600 to-blue-500 w-[15%]"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar */
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 20px; }
.scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #64748b; }

/* Animation cho List Log */
.list-move, 
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.list-leave-active {
  position: absolute;
}
</style>