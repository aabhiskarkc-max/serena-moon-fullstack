import { apiClient } from "./client"

export type Profile = {
    id?: string;
    email: string;
    username?: string | null;
    avatar?: string | null;
    role?: string | null;
    createdAt?: string | null;
}

export const profileQueryKey = ["profile"] as const;

export const getProfile = async () => {
    try {
        const res = await apiClient.get<Profile>('/auth/profile')
        return res.data
    }
    catch (error) {
        throw error
    }
}