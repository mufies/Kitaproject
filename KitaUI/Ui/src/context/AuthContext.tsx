import React, { createContext, useContext, useState, useEffect } from 'react';
import { userStatusService } from '../services/userStatusService';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    token: string | null;
    loading: boolean;
    userRole: string | null;
}

// Helper function to decode JWT payload
const decodeJWT = (token: string): any => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        let isSubscribed = true;

        // Check for existing token in localStorage
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken && isSubscribed) {
            setToken(storedToken);
            setIsAuthenticated(true);
            // Decode JWT to get role
            const payload = decodeJWT(storedToken);
            if (payload?.role) {
                setUserRole(payload.role);
            }

            // Auto-connect to UserStatusHub when returning with valid token
            userStatusService.connect(storedToken).catch(err => {
                if (isSubscribed) {
                    console.error('Failed to connect to UserStatusHub on app load:', err);
                }
            });
        }
        setLoading(false);

        return () => {
            isSubscribed = false;
            // Don't disconnect here - let logout handle it
        };
    }, []);

    const login = (newToken: string) => {
        localStorage.setItem('auth_token', newToken);
        setToken(newToken);
        setIsAuthenticated(true);
        // Decode JWT to get role
        const payload = decodeJWT(newToken);
        if (payload?.role) {
            setUserRole(payload.role);
        }

        // Connect to UserStatusHub on login
        userStatusService.connect(newToken).catch(err => {
            console.error('Failed to connect to UserStatusHub on login:', err);
        });
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setIsAuthenticated(false);
        setUserRole(null);

        // Disconnect from UserStatusHub on logout
        userStatusService.disconnect().catch(err => {
            console.error('Failed to disconnect from UserStatusHub:', err);
        });
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, token, loading, userRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
