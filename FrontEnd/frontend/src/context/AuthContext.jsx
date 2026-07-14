import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// 1. Create the Context
export const AuthContext = createContext();

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
    // Check localStorage in case the user refreshes the page
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);

    const login = (jwtToken, role) => {
        setToken(jwtToken);
        setUserRole(role);
        // Save to browser storage so they stay logged in
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('userRole', role);
    };

    const logout = () => {
        // 1. Clear the token and role from storage
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        
        // 2. Clear the React state
        setToken(null);
        setUserRole(null);
        
        // 3. Force a hard redirect back to the login page
        window.location.href = '/'; 
    };

    // --- NEW AXIOS INTERCEPTOR LOGIC ---
    useEffect(() => {
        // Create the interceptor
        const interceptor = axios.interceptors.response.use(
            (response) => response, // Pass successful responses through directly
            (error) => {
                // If the backend returns a 401 Unauthorized or 403 Forbidden
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    toast.error("Session expired. Please log in again.", {
                        style: { background: '#ef4444', color: '#fff' }
                    });
                    logout(); // Trigger the auto-logout sequence
                }
                return Promise.reject(error);
            }
        );

        // Cleanup function to remove the interceptor if the component unmounts
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []); 
    // -----------------------------------

    return (
        <AuthContext.Provider value={{ token, userRole, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};