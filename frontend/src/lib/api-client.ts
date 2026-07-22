const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface RequestOptions extends RequestInit {
    token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    // Session expirée : un appel AUTHENTIFIÉ qui reçoit 401 signifie que le
    // token n'est plus valide → purge de la session et retour au login.
    if (response.status === 401 && token && typeof window !== "undefined") {
        localStorage.removeItem("drissman_token");
        localStorage.removeItem("drissman_user");
        window.location.href = "/login?expired=1";
        throw new Error("Session expirée, veuillez vous reconnecter.");
    }

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
            errorBody?.message ||
            errorBody?.error ||
            errorBody?.details ||
            `Erreur ${response.status}`;
        throw new Error(message);
    }

    // 204 No Content, ou corps vide (endpoints renvoyant Mono<Void> → 200 sans
    // body). Éviter response.json() sur un corps vide qui lève
    // "Unexpected end of JSON input".
    if (response.status === 204) return {} as T;
    const text = await response.text();
    if (!text) return {} as T;
    try {
        return JSON.parse(text) as T;
    } catch {
        return {} as T;
    }
}

export const apiClient = {
    get: <T>(endpoint: string, token?: string) =>
        request<T>(endpoint, { method: "GET", token }),

    post: <T>(endpoint: string, data?: unknown, token?: string) =>
        request<T>(endpoint, { method: "POST", body: JSON.stringify(data), token }),

    put: <T>(endpoint: string, data?: unknown, token?: string) =>
        request<T>(endpoint, { method: "PUT", body: JSON.stringify(data), token }),

    patch: <T>(endpoint: string, data?: unknown, token?: string) =>
        request<T>(endpoint, { method: "PATCH", body: JSON.stringify(data), token }),

    delete: <T>(endpoint: string, token?: string) =>
        request<T>(endpoint, { method: "DELETE", token }),
};
