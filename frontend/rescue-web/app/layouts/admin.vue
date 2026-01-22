<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'; // Import thêm computed
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { 
  Monitor, List, User, Setting, FirstAidKit,
  Bell, Search, SwitchButton, Menu as IconMenu,
  Location, DataAnalysis, CircleCheck,
  WarningFilled, InfoFilled, Van, LocationFilled, CircleCheckFilled // Import đủ icon
} from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
// Import Store và Type
import { useAuthStore } from '~/stores/auth.store';
import { useRescueStore } from '~/stores/rescueStore';

import type { AppNotification } from '~/types/notification';

useHead({
  title: 'Quản lý Cứu Hộ - RescueLink Admin', 
  // Hoặc tên nào bạn thích, ví dụ: 'Tổng quan - RescueLink'
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const rescueStore = useRescueStore();

// Lấy state từ Store ra (Reactive)
const { notifications, unreadCount, hasMore, isLoadingNoti } = storeToRefs(rescueStore);

// --- LOGIC KHỞI TẠO ---
onMounted( async () => {
  await rescueStore.fetchNotifications(false);
  // 1. Kết nối WebSocket để nghe tin mới
  rescueStore.connectWebSocket();
  // 2. (Optional) Gọi API lấy danh sách thông báo cũ nếu cần
  // rescueStore.fetchNotifications(); 
});

// --- HELPER UI ---
// Chọn Icon và Màu sắc dựa trên loại thông báo
const getNotifStyle = (item: AppNotification) => {
  if (item.type === 'new_request') {
    return { icon: WarningFilled, text: 'text-red-600', bg: 'bg-red-100' };
  }
  if (item.type === 'complete') {
    return { icon: CircleCheckFilled, text: 'text-emerald-600', bg: 'bg-emerald-100' };
  }
  if (item.subStatus === 'IN_PROGRESS') {
     return { icon: Van, text: 'text-orange-600', bg: 'bg-orange-100' }; 
  }
  if (item.subStatus === 'ARRIVED') {
     return { icon: LocationFilled, text: 'text-purple-600', bg: 'bg-purple-100' };
  }
  return { icon: InfoFilled, text: 'text-blue-600', bg: 'bg-blue-100' };
};


// Xử lý khi click vào thông báo
const handleNotificationClick = async (item: AppNotification) => {
  if (!item.isRead) {
    await rescueStore.markAsRead(item.id);
  }
  // Điều hướng logic giữ nguyên
  if (item.relatedId) {
      if (item.type === 'new_request') router.push(`/admin/incidents`);
      else router.push(`/admin/tasks`);
  }
};

const handleLoadMore = async () => {
    await rescueStore.fetchNotifications(true); // true = load more
};

const handleMarkAllRead = async () => {
    await rescueStore.markAllAsRead();
};

const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const menuItems = [
  { 
    group: 'Điều Hành', 
    items: [
      { name: 'Tổng quan', path: '/admin', icon: Monitor }, 
      { name: 'Bản đồ trực chiến', path: '/admin/map', icon: Location }
    ] 
  },
  { 
    group: 'Quản Lý Sự Cố', 
    items: [
      { name: 'Danh sách sự cố', path: '/admin/incidents', icon: List },
      { name: 'Danh sách nhiệm vụ', path: '/admin/tasks', icon: List }, 
      // { name: 'Phân tích dữ liệu', path: '/admin/analytics', icon: DataAnalysis }
    ] 
  },
  { 
    group: 'Hệ Thống', 
    items: [
      { name: 'Người dùng & Cán bộ', path: '/admin/accounts', icon: User }, 
      { name: 'Đội Cứu Hộ', path: '/admin/teams', icon: FirstAidKit }, 
      // { name: 'Cấu hình hệ thống', path: '/admin/settings', icon: Setting }, 
      // { name: 'Kiểm tra kết nối', path: '/admin/check', icon: CircleCheck }
    ] 
  }
];

const handleLogout = async () => {
  try {
    // 1. Hiển thị hộp thoại xác nhận
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      'Xác nhận đăng xuất',
      {
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning',
        confirmButtonClass: 'bg-red-600 border-red-600 hover:bg-red-700',
      }
    );

    // 2. Gọi hàm logout từ store (để xóa token, user state)
    if (authStore.logout) {
        await authStore.logout(); 
    } else {
        const token = useCookie('access_token');
        token.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user_info');
    }

    // 3. Thông báo thành công
    ElMessage.success('Đăng xuất thành công!');

    // 4. Chuyển hướng về trang Login
    router.push('/login');

  } catch (error) {
    if (error !== 'cancel') {
        console.error('Lỗi đăng xuất:', error);
    }
  }
};
</script>

<template>

  <div class="fixed top-0 left-0 w-full z-[9999] bg-yellow-400 text-slate-900 h-6 flex items-center overflow-hidden shadow-sm border-b border-yellow-500">
     <div class="whitespace-nowrap animate-marquee font-bold text-xs uppercase tracking-wider flex gap-8">
        <span>⚠️ SẢN PHẨM KHÔNG CÓ MỤC ĐÍCH THƯƠNG MẠI - ĐANG PHỤC VỤ QUÁ TRÌNH HỌC TẬP & NGHIÊN CỨU ⚠️</span>
        <span>⚠️ SẢN PHẨM KHÔNG CÓ MỤC ĐÍCH THƯƠNG MẠI - ĐANG PHỤC VỤ QUÁ TRÌNH HỌC TẬP & NGHIÊN CỨU ⚠️</span>
        <span>⚠️ SẢN PHẨM KHÔNG CÓ MỤC ĐÍCH THƯƠNG MẠI - ĐANG PHỤC VỤ QUÁ TRÌNH HỌC TẬP & NGHIÊN CỨU ⚠️</span>
        <span>⚠️ SẢN PHẨM KHÔNG CÓ MỤC ĐÍCH THƯƠNG MẠI - ĐANG PHỤC VỤ QUÁ TRÌNH HỌC TẬP & NGHIÊN CỨU ⚠️</span>
     </div>
  </div>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-600 pt-6">
    
    <aside class="w-72 bg-[#0f172a] text-slate-200 flex flex-col transition-all duration-300 border-r border-slate-800 shadow-2xl z-20">
       <div class="h-16 flex items-center px-6 border-b border-slate-800 bg-[#0B1120]">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/50">
            <el-icon class="text-white text-lg font-bold"><Location /></el-icon>
          </div>
          <div>
            <h1 class="text-white font-extrabold text-lg tracking-tight leading-none">RESCUE<span class="text-red-500">LINK</span></h1>
            <p class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        <div v-for="(group, index) in menuItems" :key="index">
          <h3 class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{{ group.group }}</h3>
          <ul class="space-y-1 list-none">
            <li v-for="item in group.items" :key="item.path">
              <NuxtLink :to="item.path" class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden" :class="route.path === item.path ? 'bg-slate-800 text-white font-semibold shadow-inner shadow-slate-900/50 ring-1 ring-red-700/50' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-300'">
                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-red-500 rounded-r-full transition-all duration-200" :class="route.path === item.path ? 'h-full opacity-100' : 'h-0 opacity-0'"></div>
                <el-icon :size="18" :class="route.path === item.path ? 'text-red-500' : 'text-slate-500 group-hover:text-red-400'" class="transition-colors ml-1"><component :is="item.icon" /></el-icon>
                <span>{{ item.name }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
       <div class="p-4 border-t border-slate-800 bg-[#0B1120] mt-auto">
        <div class="flex items-center gap-3 p-2 rounded-lg transition">
          <div class="relative">
            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" class="w-10 h-10 rounded-full border-2 border-green-500" />
            <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0B1120] rounded-full"></span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">Admin Manager</p>
            <p class="text-xs text-slate-500 truncate">Online</p>
          </div>
          <button class="p-2 rounded-full hover:bg-slate-700 transition" @click="handleLogout">
              <el-icon class="text-slate-500 hover:text-red-500 transition"><SwitchButton /></el-icon>
          </button>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col h-screen overflow-hidden relative">
      
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm">
        
        <div class="flex items-center gap-4">
           <button class="p-2 text-slate-400 hover:text-slate-600 lg:hidden"><el-icon :size="20"><IconMenu /></el-icon></button>
           <div class="relative hidden md:block">
            <el-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search /></el-icon>
            <input type="text" placeholder="Tìm kiếm..." class="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all w-64" />
          </div>
        </div>

        <div class="flex items-center gap-4">
          
          <el-popover 
            placement="bottom-end" 
            :width="380" 
            trigger="click" 
            popper-class="!p-0 !rounded-xl !border-0 shadow-2xl notification-popover" 
            :show-arrow="false" 
            :offset="12"
          >
            <template #reference>
              <button class="relative p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none">
                  <el-icon :size="22" class="text-slate-600"><Bell /></el-icon>
                  <span v-if="unreadCount > 0" class="absolute top-1.5 right-1.5 flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-2 border-white"></span>
                  </span>
                </button>
            </template>

            <div class="flex flex-col max-h-[550px] bg-white rounded-xl overflow-hidden font-sans border border-slate-100">
                
                <div class="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20 shadow-sm">
                    <h3 class="text-base font-bold text-slate-800">Thông báo</h3>
                    <button 
                      v-if="unreadCount > 0" 
                      class="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      @click="handleMarkAllRead"
                    >
                        Đánh dấu đã đọc
                    </button>
                </div>
                
                <div class="flex-1 overflow-y-auto scrollbar-mini relative">
                    
                    <div v-if="notifications.length === 0 && !isLoadingNoti" class="py-12 text-center flex flex-col items-center">
                        <el-icon :size="48" class="text-slate-200 mb-2"><Bell /></el-icon>
                        <p class="text-sm text-slate-400 font-medium">Không có thông báo mới</p>
                    </div>

                    <div v-else class="divide-y divide-slate-100/50">
                        <div v-for="item in notifications" :key="item.id" 
                            @click="handleNotificationClick(item)"
                            class="relative px-4 py-3.5 cursor-pointer transition-all duration-200 flex gap-3 group items-start"
                            :class="item.isRead ? 'bg-white opacity-70 hover:opacity-100 hover:bg-slate-50' : 'bg-blue-50/80 hover:bg-blue-50'">
                            
                            <div class="shrink-0 mt-0.5">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-transparent"
                                    :class="item.isRead ? 'bg-slate-100 text-slate-400 grayscale' : getNotifStyle(item).bg">
                                    <el-icon :size="18" :class="item.isRead ? '' : getNotifStyle(item).text">
                                        <component :is="getNotifStyle(item).icon" />
                                    </el-icon>
                                </div>
                            </div>
                            
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-start gap-2 mb-0.5">
                                    <h4 class="text-sm leading-tight line-clamp-2 transition-colors"
                                        :class="item.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-900'">
                                        {{ item.title }}
                                    </h4>
                                    <span class="text-[10px] whitespace-nowrap shrink-0 font-medium"
                                          :class="item.isRead ? 'text-slate-400' : 'text-blue-600'">
                                        {{ formatTime(item.time) }}
                                    </span>
                                </div>
                                <p class="text-xs leading-snug line-clamp-2" 
                                    :class="item.isRead ? 'text-slate-400' : 'text-slate-700 font-medium'">
                                    {{ item.message }}
                                </p>
                            </div>
                            
                            <div v-if="!item.isRead" class="absolute top-1/2 -translate-y-1/2 right-3">
                                <div class="w-3 h-3 bg-blue-600 rounded-full shadow-sm ring-2 ring-blue-100"></div>
                            </div>
                        </div>

                        <div v-if="isLoadingNoti" class="py-3 text-center">
                          <el-icon class="is-loading text-blue-500" :size="20"><Loading /></el-icon>
                        </div>
                    </div>
                </div>
                
                <div class="border-t border-slate-100 bg-white sticky bottom-0 z-20">
                    <button 
                      v-if="hasMore"
                      @click.stop="handleLoadMore"
                      :disabled="isLoadingNoti"
                      class="block w-full py-3 text-center text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {{ isLoadingNoti ? 'Đang tải...' : 'XEM CŨ HƠN' }}
                    </button>
                    
                    <div v-else-if="notifications.length > 0" class="py-2 text-center text-[10px] text-slate-400 italic">
                      Đã hiển thị hết thông báo
                    </div>
                </div>
            </div>
          </el-popover>
          
          <div class="h-8 w-px bg-slate-200 mx-1"></div>
          
          <div class="text-right hidden md:block">
            <p class="text-xs font-bold text-slate-700">Trung Tâm Chỉ Huy</p>
            <p class="text-[10px] text-green-600 font-medium">● Hệ thống ổn định</p>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-auto bg-slate-50 p-6">
          <div class="mb-6">
              <div class="text-sm text-slate-500 flex items-center gap-1">
                  <span class="text-xs text-slate-400">Home / Admin / </span>
                  <span class="text-slate-800 font-medium">
                      {{ menuItems.flatMap(g => g.items).find(i => i.path === route.path)?.name || 'Dashboard' }}
                  </span>
              </div>
              <h2 class="text-3xl font-bold text-slate-900 tracking-tight mt-2">
                  {{ menuItems.flatMap(g => g.items).find(i => i.path === route.path)?.name || 'Dashboard' }}
              </h2>
          </div>

          <div class="animate-fade-in-up">
            <slot />
          </div>
      </main>

    </div>
  </div>
</template>

<style>
/* CSS GLOBAL cho Popover (Bắt buộc đặt ở global hoặc không scoped) */
.notification-popover.el-popover {
    padding: 0 !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
    border: 1px solid #e2e8f0 !important;
}
</style>

<style scoped>
/* Scrollbar */
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }

.animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Định nghĩa animation chạy chữ */
.animate-marquee {
  animation: marquee 25s linear infinite;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); } /* Chạy hết 50% độ dài (do mình lặp lại text) */
}
</style>

