<script setup lang="ts">
import { computed } from 'vue';
import { 
  Close, UserFilled, LocationFilled, Van, Timer, 
  Tickets, Printer, Phone, MapLocation, Check, Warning, Male, Female
} from '@element-plus/icons-vue';
import type { RescueTask } from '~/types/task';

const props = defineProps<{
  modelValue: boolean;
  task: RescueTask | null;
}>();

const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// --- LOGIC UI ---
const activeStep = computed(() => {
  if (!props.task) return 0;
  const status = props.task.status;
  if (status === 'Đã điều động') return 1;
  if (status === 'Đang di chuyển') return 2;
  if (status === 'Đã đến') return 3;
  if (status === 'Hoàn thành') return 4;
  return 0;
});

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleString('vi-VN', { 
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
  });
};

const getPeopleSummary = (req: any) => {
  if (!req) return '0';
  return (req.adults || 0) + (req.children || 0) + (req.elderly || 0);
};

const openGoogleMap = () => {
    const lat = props.task?.rescue_request?.latitude;
    const lng = props.task?.rescue_request?.longitude;
    if(lat && lng) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
};

const handleClose = () => { visible.value = false; };
</script>

<template>
  <el-dialog 
    v-model="visible" 
    width="960px" 
    destroy-on-close 
    class="task-detail-dialog"
    :show-close="false"
    align-center
    append-to-body
  >
    <template #header>
      <div class="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white rounded-t-2xl">
        <div class="flex items-center gap-3">
           <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg border border-indigo-100">
              <el-icon :size="20"><Tickets /></el-icon>
           </div>
           <div class="leading-tight">
             <div class="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Mã Nhiệm Vụ</div>
             <div class="text-lg font-bold text-slate-800 font-mono">
                {{ task?.rescue_request?.code || 'LOADING...' }}
             </div>
           </div>
        </div>
        <div class="flex items-center gap-3">
            <el-tag :type="task?.status === 'Hoàn thành' ? 'success' : (task?.status === 'Đang di chuyển' ? 'warning' : 'primary')" effect="dark" round class="!px-4 !h-8 !text-sm">
                {{ task?.status }}
            </el-tag>
            <div class="w-px h-6 bg-slate-200 mx-1"></div>
            <div class="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-1" @click="handleClose">
                <el-icon :size="24"><Close /></el-icon>
            </div>
        </div>
      </div>
    </template>

    <div class="p-6 bg-slate-50/80 max-h-[85vh] overflow-y-auto custom-scrollbar" v-if="task">
      
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-5">
         <el-steps :active="activeStep" finish-status="success" align-center class="custom-steps">
            <el-step title="Điều động" :icon="Tickets" />
            <el-step title="Di chuyển" :icon="Van" />
            <el-step title="Tiếp cận" :icon="LocationFilled" />
            <el-step title="Hoàn tất" :icon="Check" />
         </el-steps>
      </div>

      <div class="grid grid-cols-12 gap-5">
         
         <div class="col-span-12 md:col-span-8 flex flex-col gap-5">
            
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div class="px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-2">
                  <h4 class="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                     <el-icon class="text-red-500"><UserFilled /></el-icon> Thông tin & Địa điểm
                  </h4>
                  <div class="flex flex-wrap gap-2">
                      <el-tag v-for="cond in task.rescue_request?.conditions" :key="cond" type="danger" size="small" effect="plain" class="!font-bold !border-red-200">
                          {{ cond }}
                      </el-tag>
                  </div>
               </div>
               
               <div class="p-5">
                  <div class="flex items-center gap-5">
                     <el-avatar :size="64" class="bg-red-50 text-red-500 text-2xl font-bold shrink-0 border border-red-100 shadow-sm">
                        {{ task.rescue_request?.name?.charAt(0) }}
                     </el-avatar>
                     
                     <div class="flex-1 min-w-0 flex justify-between items-center gap-4">
                        <div>
                            <h3 class="text-xl font-bold text-slate-800 leading-tight mb-1">{{ task.rescue_request?.name }}</h3>
                            <div class="flex items-center gap-2 text-slate-600">
                                <el-icon><Phone /></el-icon> 
                                <span class="font-mono font-bold text-lg">{{ task.rescue_request?.contact_phone }}</span>
                            </div>
                        </div>
                        <a :href="`tel:${task.rescue_request?.contact_phone}`" class="shrink-0">
                            <el-button type="success" :icon="Phone" round class="!font-bold !px-5 shadow-sm shadow-green-200">Gọi ngay</el-button>
                        </a>
                     </div>
                  </div>

                  <div class="mt-6 grid grid-cols-4 gap-3">
                      <div class="bg-red-50 rounded-lg p-3 text-center border border-red-100 flex flex-col justify-center">
                          <div class="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-1">Tổng SOS</div>
                          <div class="text-2xl font-bold text-red-600 leading-none">{{ getPeopleSummary(task.rescue_request) }}</div>
                      </div>
                      <div class="col-span-3 grid grid-cols-3 gap-3">
                          <div class="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-sm">
                              <div class="text-[10px] text-slate-400 uppercase font-semibold mb-1">Người lớn</div>
                              <div class="text-lg font-bold text-slate-700 leading-none">{{ task.rescue_request?.adults || 0 }}</div>
                          </div>
                          <div class="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-sm">
                              <div class="text-[10px] text-slate-400 uppercase font-semibold mb-1">Trẻ em</div>
                              <div class="text-lg font-bold text-slate-700 leading-none">{{ task.rescue_request?.children || 0 }}</div>
                          </div>
                          <div class="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-sm">
                              <div class="text-[10px] text-slate-400 uppercase font-semibold mb-1">Người già</div>
                              <div class="text-lg font-bold text-slate-700 leading-none">{{ task.rescue_request?.elderly || 0 }}</div>
                          </div>
                      </div>
                  </div>

                  <div class="border-t border-slate-100 my-5"></div>

                  <div>
                      <div class="flex items-start gap-3 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                         <el-icon class="mt-1 text-red-500 shrink-0"><MapLocation /></el-icon>
                         <div class="text-sm text-slate-800 font-medium leading-relaxed">
                            {{ task.rescue_request?.address }}
                         </div>
                      </div>
                      
                      <div @click="openGoogleMap" class="w-full h-32 bg-indigo-50/50 rounded-lg border border-indigo-100 border-dashed border-2 relative overflow-hidden group cursor-pointer flex items-center justify-center transition-all hover:bg-indigo-50">
                          <div class="text-center group-hover:scale-105 transition-transform duration-300">
                             <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm mx-auto mb-2">
                                <el-icon :size="20"><LocationFilled /></el-icon>
                             </div>
                             <span class="text-xs font-bold text-indigo-600 uppercase tracking-wide">Mở Google Maps chỉ đường</span>
                             <div class="text-[10px] font-mono text-slate-400 mt-1" v-if="task.rescue_request?.latitude">
                                {{ task.rescue_request.latitude }}, {{ task.rescue_request.longitude }}
                             </div>
                          </div>
                      </div>
                  </div>
                  
                  <div v-if="task.rescue_request?.description" class="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-100 flex gap-2 items-start">
                     <el-icon class="mt-0.5 text-amber-600"><Warning /></el-icon>
                     <span><span class="font-bold">Ghi chú từ nạn nhân:</span> "{{ task.rescue_request?.description }}"</span>
                  </div>
               </div>
            </div>
         </div>

         <div class="col-span-12 md:col-span-4 flex flex-col gap-5">
            
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div class="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center gap-2 text-white">
                  <el-icon><Van /></el-icon>
                  <span class="font-bold text-sm uppercase tracking-wide">Đơn vị thực hiện</span>
               </div>
               
               <div class="p-5">
                  <div class="mb-4">
                      <div class="text-xs text-slate-400 uppercase font-bold mb-1">Tên đội</div>
                      <div class="font-bold text-lg text-slate-800 leading-tight">
                          {{ task.rescue_team?.team_name }}
                      </div>
                  </div>
                  
                  <div class="space-y-3">
                      <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                              <el-icon><UserFilled /></el-icon>
                          </div>
                          <div>
                              <div class="text-[10px] text-slate-400 uppercase font-bold">Đội trưởng</div>
                              <div class="text-sm font-medium text-slate-700">{{ task.rescue_team?.leader_name || '---' }}</div>
                          </div>
                      </div>
                      
                      <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                              <el-icon><Phone /></el-icon>
                          </div>
                          <div>
                              <div class="text-[10px] text-slate-400 uppercase font-bold">Hotline Đội</div>
                              <div class="text-sm font-mono font-bold text-blue-600">{{ task.rescue_team?.team_phone || 'N/A' }}</div>
                          </div>
                      </div>
                  </div>
               </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
               <div class="px-4 py-3 border-b border-slate-100 font-bold text-slate-700 text-sm flex items-center gap-2 bg-slate-50/50">
                  <el-icon><Timer /></el-icon> Nhật ký xử lý
               </div>
               <div class="p-4 flex-1">
                   <el-timeline style="padding-left: 2px;">
                      <el-timeline-item :timestamp="formatDateTime(task.assigned_at)" type="primary" size="large" :hollow="true">
                         <span class="text-sm font-bold text-slate-700">Điều động</span>
                         <div class="text-xs text-slate-400 mt-0.5">Hệ thống tự động gán</div>
                      </el-timeline-item>
                      
                      <el-timeline-item 
                        :timestamp="task.status === 'Hoàn thành' ? '---' : 'Hiện tại'" 
                        :type="task.status === 'Hoàn thành' ? 'success' : 'warning'" 
                        size="large"
                      >
                         <span class="text-sm font-bold" :class="task.status === 'Hoàn thành' ? 'text-green-600' : 'text-orange-600'">
                            {{ task.status }}
                         </span>
                      </el-timeline-item>
                   </el-timeline>
               </div>
            </div>

         </div>
      </div>

    </div>

    <template #footer>
      <div class="px-6 pb-6 pt-4 bg-white border-t border-slate-100 flex justify-between items-center rounded-b-2xl">
         <div class="text-xs text-slate-400 italic font-mono">
            Ref: {{ task?.id }}
         </div>
         <div class="flex gap-3">
            <el-button @click="handleClose" class="!rounded-lg !h-10 px-6">Đóng</el-button>
            <el-button type="primary" class="!rounded-lg !h-10 !bg-slate-800 border-none shadow-lg shadow-slate-200 px-6" @click="">
               <el-icon class="mr-2"><Printer /></el-icon> In Báo Cáo
            </el-button>
         </div>
      </div>
    </template>
  </el-dialog>
</template>

<style>
/* CSS Tùy chỉnh */
.task-detail-dialog {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}
.task-detail-dialog .el-dialog__header { margin: 0; padding: 0; }
.task-detail-dialog .el-dialog__body { padding: 0 !important; }
.task-detail-dialog .el-dialog__footer { padding: 0 !important; }

/* Custom Stepper */
.custom-steps .el-step__title { font-size: 13px; font-weight: 600; }
.custom-steps .el-step__icon { width: 32px; height: 32px; }
</style>