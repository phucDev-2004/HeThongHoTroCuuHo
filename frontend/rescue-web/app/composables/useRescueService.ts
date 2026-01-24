// composables/useRescueService.ts
import type { RescueRequest, RescueResponse, RescueFilter, FindTeamParams, RescueTeam, AssignTeam } from '~/types/rescue';
import type { RescueTask } from '~/types/task';

export const useRescueService = () => {
    // 1. Dùng Client chuẩn (đã có Auth & BaseURL)
    const { apiFetch } = useApiClient();
    const RESOURCE = '/api/requests';

    // --- Các hàm gọi API ---
    
    const getAll = async (filter: RescueFilter): Promise<RescueResponse> => {
        return await apiFetch<RescueResponse>(RESOURCE, {
            method: 'GET',
            params: filter // apiFetch tự động serialize object thành query param
        });
    };

    const getRequestDetail = async (id: string): Promise<RescueRequest> => {
        return await apiFetch<RescueRequest>(`${RESOURCE}/${id}`, {
            method: 'GET'
        });
    };

    const updateStatus = async (id: string, status: string): Promise<void> => {
        await apiFetch(`${RESOURCE}/${id}/status`, {
            method: 'PATCH',
            body: { status }
        });
    };

    const findNearbyTeams = async (params: FindTeamParams): Promise<RescueTeam[]> => {
        return await apiFetch<RescueTeam[]>('/api/rescue-teams/find-teams', {
            method: 'GET',
            params: {
                latitude: params.latitude,
                longitude: params.longitude,
                radius_km: params.radius_km
            }
        });
    };

    const assignTeam = async (data: AssignTeam): Promise<void> => {
        return await apiFetch('/api/rescue-teams/dispatch/assign', {
            method: 'POST',
            body: {
                request_id: data.requestId,
                rescue_team_id: data.rescueTeamId
            }
        });
    };

    // 2. Lấy danh sách nhiệm vụ đã phân công (CHO MÀN HÌNH BẠN ĐANG LÀM)
    const getAssignments = async (): Promise<RescueTask[]> => {
        return await apiFetch<RescueTask[]>(`/api/rescue-teams/assignments`, {
            method: 'GET'
        });
    };

    const cancelAssignment = async (assignmentId: string): Promise<void> => {
        await apiFetch(`/api/rescue-teams/assignments/${assignmentId}`, {
            method: 'DELETE'
        });
    };

    const getDashboardStats = async () => {
        return await apiFetch<any>('/api/dashboard/status'); 
    };

    // 3. Lấy chi tiết 1 nhiệm vụ theo ID
    const getAssignmentById = async (id: string): Promise<RescueTask> => {
        return await apiFetch<RescueTask>(`/api/rescue-teams/assignments/${id}`, {
            method: 'GET'
        });
    };


    return {
        getAll,
        getRequestDetail,
        updateStatus,
        findNearbyTeams,
        assignTeam,
        getAssignments,
        cancelAssignment,
        getDashboardStats,
        getAssignmentById
    };
};