import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { User, Lock, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    // Standard login state
    const [registrationId, setRegistrationId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // NEW: Modal control state
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [pendingAuth, setPendingAuth] = useState(null);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // Send exactly what authRoutes.mjs expects
            const response = await axios.post('http://localhost:3000/auth/login', {
                registrationId,
                password
            });

            // Destructure the flags from your backend response
            const { token, role, isFirstLogin } = response.data;
            
            // --- UPDATED TIMED LOGIC WITH CUSTOM MODAL ---
            if (isFirstLogin && role === "Student") {
                // Save the data temporarily and open the custom modal
                setPendingAuth({ token, role });
                setShowStudentModal(true); 
            } 
            else if (isFirstLogin) {
                // Staff and Admins are still FORCED to change it
                toast.success('Security Requirement: Please update your default password.', { style: { background: '#333', color: '#fff' } });
                navigate('/change-password');
                setTimeout(() => login(token, role), 50);
            } 
            else {
                // Normal login for everyone else
                toast.success(`Welcome back, ${role}!`, { icon: '👋', style: { background: '#333', color: '#fff' } });
                navigate(`/${role.toLowerCase()}-dashboard`);
                setTimeout(() => login(token, role), 50);
            }

        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid ID or Password.', {
                style: {
                    background: '#ef4444',
                    color: '#fff',
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Handles the custom modal button clicks
    const handleModalChoice = (choice) => {
        setShowStudentModal(false); // Close the modal
        const { token, role } = pendingAuth;

        if (choice === 'change') {
            navigate('/change-password');
            setTimeout(() => login(token, role), 50);
        } else {
            toast.success(`Welcome back, ${role}!`, { icon: '👋', style: { background: '#333', color: '#fff' } });
            navigate('/student-dashboard');
            setTimeout(() => login(token, role), 50);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <Toaster position="top-right" reverseOrder={false} />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.1)] w-full max-w-md relative overflow-hidden"
            >
                {/* Decorative Neon Top Border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">System Portal</h1>
                    <p className="text-gray-400 text-sm">Please authenticate to access your dashboard.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Registration ID Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registration ID</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                value={registrationId}
                                onChange={(e) => setRegistrationId(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-950 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all uppercase"
                                placeholder="Enter your ID (e.g. CSE-101)"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-950 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-950 bg-green-500 hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            'Authenticating...'
                        ) : (
                            <>
                                Access Dashboard
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>

            {/* --- CUSTOM DARK THEME CONFIRMATION MODAL --- */}
            {showStudentModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
                        {/* Neon Green Top Border */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        
                        <h3 className="text-xl font-bold text-white mb-2">Security Recommendation</h3>
                        <p className="text-gray-400 text-sm mb-8">
                            Welcome! For your privacy, we highly recommend changing your default Date of Birth password to something secure before continuing to your dashboard.
                        </p>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleModalChoice('skip')} 
                                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-700 transition-all"
                            >
                                Skip for Now
                            </button>
                            <button 
                                onClick={() => handleModalChoice('change')} 
                                className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg transition-all"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;