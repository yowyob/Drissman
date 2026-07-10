import { apiClient } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface VehicleDto {
    id: string;
    schoolId: string;
    monitorId: string | null;
    name: string;
    plateNumber: string;
    latitude: number | null;
    longitude: number | null;
    lastPositionAt: string | null;
    isActive: boolean;
}

export const vehicleService = {
    // --- Admin école ---
    list: (token: string) => apiClient.get<VehicleDto[]>("/schools/admin/vehicles", token),

    create: (payload: { name: string; plateNumber: string; monitorId?: string }, token: string) =>
        apiClient.post<VehicleDto>("/schools/admin/vehicles", payload, token),

    update: (id: string, payload: Partial<VehicleDto>, token: string) =>
        apiClient.put<VehicleDto>(`/schools/admin/vehicles/${id}`, payload, token),

    deactivate: (id: string, token: string) =>
        apiClient.delete<void>(`/schools/admin/vehicles/${id}`, token),

    // --- Public / consommateurs ---
    bySchool: (schoolId: string) => apiClient.get<VehicleDto[]>(`/vehicles/school/${schoolId}`),

    // --- Moniteur : émission de position ---
    sendPosition: (vehicleId: string, latitude: number, longitude: number, token: string) =>
        apiClient.post<VehicleDto>(`/vehicles/${vehicleId}/position`, { latitude, longitude }, token),

    /**
     * Abonnement SSE aux positions temps réel d'une école.
     * Retourne une fonction de désabonnement (à appeler au démontage).
     */
    subscribe(schoolId: string, onPosition: (vehicle: VehicleDto) => void): () => void {
        const source = new EventSource(`${API_BASE_URL}/vehicles/school/${schoolId}/stream`);
        source.addEventListener("position", (event) => {
            try {
                onPosition(JSON.parse((event as MessageEvent).data));
            } catch {
                // trame illisible : ignorée
            }
        });
        return () => source.close();
    },
};
