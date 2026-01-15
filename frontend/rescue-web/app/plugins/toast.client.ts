// plugins/toast.client.ts
import Vue3Toastify, { toast, type ToastContainerOptions } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Vue3Toastify, {
    autoClose: 4000,
    position: 'top-right',
    theme: 'colored',
    clearOnUrlChange: false,
  } as ToastContainerOptions);

  return {
    provide: {
      toast,
    },
  };
});