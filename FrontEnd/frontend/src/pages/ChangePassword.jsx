import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ChangePassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { token, userRole } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match!");
        }
        if (newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters.");
        }

        setIsLoading(true);
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:3000/auth/change-first-password', {
                newPassword
            }, config);

            toast.success("Password secured! Redirecting to dashboard...");
            
            // Send them to their correct dashboard after success
            setTimeout(() => {
                navigate(`/${userRole.toLowerCase()}-dashboard`);
            }, 1500);

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.15)] w-full max-w-md relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>

                <div className="text-center mb-8">
                    <div className="mx-auto bg-gray-950 h-16 w-16 rounded-full flex items-center justify-center border border-gray-800 mb-4">
                        <ShieldCheck className="h-8 w-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Secure Your Account</h1>
                    <p className="text-gray-400 text-sm">As this is your first time logging in, you must set a new, secure password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-950 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-950 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                                placeholder="Confirm new password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-lg font-bold text-gray-950 bg-green-500 hover:bg-green-400 transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Updating...' : 'Update Password & Continue'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ChangePassword;