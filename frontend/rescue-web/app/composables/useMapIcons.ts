import L from 'leaflet';

export const useMapIcons = () => {
  // Hàm tạo HTML cho Marker bằng CSS (Nhẹ hơn ảnh PNG rất nhiều)
  const createHtmlIcon = (color: string, isPulse: boolean = false) => {
    // Nếu là trạng thái khẩn cấp (isPulse = true), thêm class animation
    const pulseHtml = isPulse 
      ? `<span class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style="background-color: ${color}"></span>` 
      : '';

    return L.divIcon({
      className: 'custom-css-icon', // Class rỗng để reset style mặc định của Leaflet
      html: `
        <div class="relative flex items-center justify-center w-6 h-6">
          ${pulseHtml}
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
          <div style="
            position: absolute;
            bottom: -6px;
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid ${color};
          "></div>
        </div>
      `,
      iconSize: [24, 30],   // Kích thước icon
      iconAnchor: [12, 30], // Điểm neo (mũi nhọn chạm đất)
      popupAnchor: [0, -32] // Điểm hiện popup
    });
  };

  const getIcon = (status: string | null = ''): L.DivIcon => {
    const s = String(status).toLowerCase().trim();

    // --- 1. KHẨN CẤP / CHỜ XỬ LÝ: MÀU ĐỎ + NHẤP NHÁY ---
    if (s === 'chờ xử lý' || s === 'pending') {
        return createHtmlIcon('#ef4444', true); // Red-500 + Pulse
    }

    // --- 2. ĐÃ PHÂN CÔNG: MÀU CAM ---
    if (s === 'đã phân công' || s === 'assigned' || s === 'processing') {
        return createHtmlIcon('#f59e0b'); // Amber-500
    }

    // --- 3. ĐANG THỰC HIỆN: MÀU XANH DƯƠNG ---
    if (s === 'đang thực hiện' || s === 'in_progress') {
        return createHtmlIcon('#3b82f6'); // Blue-500
    }

    // --- 4. HOÀN THÀNH: MÀU XANH LÁ ---
    if (s === 'hoàn thành' || s === 'finished' || s === 'completed') {
        return createHtmlIcon('#22c55e'); // Green-500
    }

    // --- 5. AN TOÀN: MÀU TÍM ---
    if (s === 'an toàn' || s === 'safe') {
        return createHtmlIcon('#8b5cf6'); // Violet-500
    }

    // --- MẶC ĐỊNH: MÀU XÁM ---
    return createHtmlIcon('#6b7280'); // Gray-500
  };

  return { getIcon };
};