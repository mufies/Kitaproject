import axios from "axios";
import { LOGIN_USER } from "../constant/enum";

export const BASE_URL = "http://localhost:5064";
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export const axiosInstance = axios.create({
    baseURL: `${BASE_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the Bearer token in all requests
axiosInstance.interceptors.request.use(
    (config) => {
        // Không gửi token cho các endpoint auth (login, register)
        const isAuthEndpoint = config.url?.startsWith('/auth/');

        if (!isAuthEndpoint) {
            const token = localStorage.getItem(LOGIN_USER);
            if (token) {
                config.headers["Authorization"] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Fetch generic data from the API
export const fetchFromAPI = async (url: string) => {
    try {
        const { data } = await axiosInstance.get(url);
        return data;
    } catch (error) {
        console.error("Error fetching from API:", error);
        throw error;
    }
};

// ==================== AUTH ====================

export const fetchLoginUser = async (email: string, password: string, navigate?: (path: string) => void) => {
    try {
        const { data } = await axiosInstance.post('/auth/login', { email, password });

        // Backend trả về: { success, code, message, data: { token, user } }
        if (data.success && data.data.token) {
            localStorage.setItem(LOGIN_USER, data.data.token);

            // Decode JWT token để lấy thông tin user
            try {
                const payload = data.data.token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payload));

                console.log('Decoded payload:', decodedPayload);

                // Navigate based on user role if needed
                if (navigate) {
                    if (decodedPayload.role === 'admin') {
                        navigate('/admin');
                    } else {
                        navigate('/music');
                    }
                }
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }

        return data;
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

export const fetchRegisterUser = async (payload: { username: string; email: string; password: string }) => {
    try {
        const { data } = await axiosInstance.post('/auth/register', payload);
        return data;
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

export const fetchLogoutUser = async () => {
    try {
        localStorage.removeItem(LOGIN_USER);
        // Backend might not have logout endpoint, just clear token
        return { success: true, message: 'Logged out successfully' };
    } catch (error) {
        console.error("Error logging out:", error);
        throw error;
    }
};

// ==================== USER ====================

export const fetchGetProfile = async () => {
    try {
        const { data } = await axiosInstance.get('/user/profile');
        return data;
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw error;
    }
};

export const fetchUploadAvatar = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await axiosInstance.post('/user/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error) {
        console.error("Error uploading avatar:", error);
        throw error;
    }
};

// ==================== LEGACY FUNCTIONS (for compatibility) ====================

export const fetchForgotPass = async (email: string) => {
    try {
        const { data } = await axiosInstance.post('/auth/forgot-password', { email });
        return data;
    } catch (error) {
        console.error("Error sending reset code:", error);
        throw error;
    }
};

export const fetchResetPass = async (payload: { token: string; newPassword: string }) => {
    try {
        const { data } = await axiosInstance.post('/auth/reset-password', payload);
        return data;
    } catch (error) {
        console.error("Error resetting password:", error);
        throw error;
    }
};

export const fetchCreateUser = async (payload: FormData) => {
    try {
        const { data } = await axiosInstance.post('/user/create', payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error: any) {
        console.error("Error creating user:", error);

        if (error.response?.status === 302) {
            throw new Error('Email đã tồn tại trong hệ thống');
        }

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw new Error('Có lỗi xảy ra khi tạo người dùng');
    }
};
