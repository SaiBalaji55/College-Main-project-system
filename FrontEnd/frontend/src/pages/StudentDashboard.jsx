import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { BookOpen, Calendar, CheckCircle, Clock, LayoutDashboard, LogOut, UserCircle, MessageSquare, Menu, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
    const { token, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // NEW: Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [profileData, setProfileData] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [marksData, setMarksData] = useState([]);
    const [timetableData, setTimetableData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [complaintData, setComplaintData] = useState({ subject: '', description: '', type: 'Infrastructure' });

    const handleSubmitComplaint = async (e) => {
        e.preventDefault();
        
        if (!complaintData.subject || !complaintData.description) {
            return toast.error("Please fill out all fields.");
        }
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:3000/complaint/submit', complaintData, config);
            
            toast.success("Complaint submitted to administration.");
            setComplaintData({ subject: '', description: '', type: 'Infrastructure' }); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit complaint.");
        }
    };

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                const [attendanceRes, marksRes, profileRes, timetableRes] = await Promise.all([
                    axios.get('http://localhost:3000/attendance/my-records', config),
                    axios.get('http://localhost:3000/exam-marks/my-Marks', config),
                    axios.get('http://localhost:3000/auth/me', config),
                    axios.get('http://localhost:3000/timetable/schedule/Computer Science/3', config)
                ]);

                setAttendanceData(attendanceRes.data.records || []);
                setMarksData(marksRes.data.marks || []);
                setProfileData(profileRes.data.user); 
                setTimetableData(timetableRes.data.schedule || []); 
                
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) fetchStudentData();
    }, [token]);

    const presentDays = attendanceData.filter(record => record.status === 'Present').length;
    const totalDays = attendanceData.length;
    const attendancePercentage = totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);
    
    const chartData = [
        { name: 'Present', value: presentDays, color: '#22c55e' }, 
        { name: 'Absent', value: totalDays - presentDays, color: '#1f2937' } 
    ];

    const renderContent = () => {
        if (isLoading || !profileData) {
            return (
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-6 py-1">
                        <div className="h-40 bg-gray-800 rounded-2xl"></div>
                        <div className="h-40 bg-gray-800 rounded-2xl"></div>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg lg:col-span-1 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Overall Attendance</h3>
                            <div className="h-48 relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute text-center">
                                    <span className="text-3xl font-bold text-white">{attendancePercentage}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg lg:col-span-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-green-500 to-transparent"></div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Recent Exam Performance</h3>
                            {marksData.length > 0 ? (
                                <div className="space-y-4">
                                    {marksData.slice(0, 3).map((mark, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-gray-950 rounded-lg border border-gray-800/50">
                                            <div>
                                                <p className="font-semibold text-white">{mark.subject}</p>
                                                <p className="text-xs text-gray-400">{mark.examType}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-green-400">{mark.marksObtained}</span>
                                                <span className="text-sm text-gray-500"> / {mark.totalMarks}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                                    No marks uploaded yet.
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'profile':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-3xl relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        
                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 border-b border-gray-800 pb-8 text-center sm:text-left">
                            <div className="h-24 w-24 bg-gray-950 border border-gray-700 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.15)] flex-shrink-0">
                                <UserCircle size={48} className="text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{profileData.name}</h2>
                                <p className="text-green-400 font-mono mt-1">{profileData.registrationId}</p>
                                <span className="inline-block mt-2 px-3 py-1 bg-gray-800 text-xs font-medium text-gray-300 rounded-full border border-gray-700">
                                    {profileData.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800/50 overflow-x-auto">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email Address</p>
                                <p className="text-gray-200">{profileData.email}</p>
                            </div>
                            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800/50">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone Number</p>
                                <p className="text-gray-200">{profileData.phone}</p>
                            </div>
                            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800/50">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Account Created</p>
                                <p className="text-gray-200">
                                    {new Date(profileData.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800/50">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Current Role</p>
                                <p className="text-gray-200">{profileData.role}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'attendance':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Detailed Attendance Record</h2>
                        
                        {attendanceData.length > 0 ? (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[300px]">
                                    <thead>
                                        <tr className="border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceData.map((record, index) => (
                                            <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                                <td className="py-3 px-4 text-white">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md ${record.status === 'Present' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-400">No attendance records found.</p>
                        )}
                    </div>
                );
            case 'marks':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Full Report Card</h2>
                        
                        {marksData.length > 0 ? (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[400px]">
                                    <thead>
                                        <tr className="border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                                            <th className="py-3 px-4">Subject</th>
                                            <th className="py-3 px-4">Exam Type</th>
                                            <th className="py-3 px-4 text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {marksData.map((mark, index) => (
                                            <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                                <td className="py-3 px-4 text-white font-medium">{mark.subject}</td>
                                                <td className="py-3 px-4 text-gray-400">{mark.examType}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="text-lg font-bold text-green-400">{mark.marksObtained}</span>
                                                    <span className="text-sm text-gray-600"> / {mark.totalMarks}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-400">No marks uploaded yet.</p>
                        )}
                    </div>
                );
            case 'schedule':
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                const periods = [1, 2, 3, 4, 5, 6, 7, 8];

                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative shadow-lg overflow-x-auto w-full">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Class Timetable (Computer Science - Sem 3)</h2>
                        
                        <div className="min-w-[800px]">
                            <table className="w-full text-center border-collapse">
                                <thead>
                                    <tr>
                                        <th className="py-4 px-4 border border-gray-800 bg-gray-950 text-gray-400 font-semibold uppercase tracking-wider text-xs w-32">
                                            Day / Period
                                        </th>
                                        {periods.map(p => (
                                            <th key={p} className="py-4 px-2 border border-gray-800 bg-gray-950 text-gray-400 font-semibold uppercase tracking-wider text-xs">
                                                Period {p}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {days.map(day => (
                                        <tr key={day}>
                                            <td className="py-4 px-4 border border-gray-800 bg-gray-950 font-bold text-green-500">
                                                {day}
                                            </td>
                                            {periods.map(period => {
                                                const slot = timetableData.find(t => t.dayOfWeek === day && String(t.period) === String(period));
                                                
                                                return (
                                                    <td key={`${day}-${period}`} className="border border-gray-800 bg-gray-900/40 hover:bg-gray-800 transition-colors h-24 w-32 align-middle">
                                                        {slot ? (
                                                            <div className="flex flex-col items-center justify-center p-2 space-y-1">
                                                                <span className="font-bold text-white text-sm leading-tight">{slot.subject}</span>
                                                                <span className="text-[10px] text-gray-500">{slot.timeSlot}</span>
                                                                <span className="text-[10px] text-green-400 font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                                    {slot.registrationId?.name || "Staff"}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-800 font-light">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'complaints':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl relative shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Submit a Complaint</h2>
                        <form onSubmit={handleSubmitComplaint} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold">Subject</label>
                                <input 
                                    type="text" 
                                    value={complaintData.subject}
                                    onChange={(e) => setComplaintData({...complaintData, subject: e.target.value})}
                                    className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" 
                                    placeholder="Brief title of the issue" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold">Detailed Description</label>
                                <textarea value={complaintData.description} onChange={(e) => setComplaintData({...complaintData, description: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 h-32 resize-none" placeholder="Explain the issue in detail..." required></textarea>
                            </div>
                            <button type="submit" className="w-full py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg flex justify-center items-center gap-2 transition-all">
                                <MessageSquare size={18} /> Submit Ticket
                            </button>
                        </form>
                    </div>
                );
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row font-sans w-full overflow-x-hidden">
            
            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 z-40 sticky top-0">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                    Student Portal
                </h2>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                    className="text-gray-400 hover:text-white focus:outline-none transition-colors"
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* --- MOBILE OVERLAY --- */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 flex flex-col 
                transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-800 hidden md:block">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                        Student Portal
                    </h2>
                </div>
                
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Overview</span>
                    </button>
                    
                    <button onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'profile' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <UserCircle size={20} />
                        <span className="font-medium">My Profile</span>
                    </button>

                    <button onClick={() => { setActiveTab('attendance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'attendance' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <CheckCircle size={20} />
                        <span className="font-medium">Attendance</span>
                    </button>
                    <button onClick={() => { setActiveTab('marks'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'marks' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <BookOpen size={20} />
                        <span className="font-medium">Report Card</span>
                    </button>
                    <button onClick={() => { setActiveTab('schedule'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'schedule' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <Clock size={20} />
                        <span className="font-medium">Timetable</span>
                    </button>
                    <button onClick={() => { setActiveTab('complaints'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'complaints' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <MessageSquare size={20} />
                        <span className="font-medium">Help Desk</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/30 transition-all">
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                <header className="mb-6 md:mb-8 mt-2 md:mt-0">
                    <h1 className="text-2xl md:text-3xl font-bold">Welcome Back, {profileData?.name || "Student"}.</h1>
                    <p className="text-gray-400 mt-1 text-sm md:text-base">Here is your academic overview for today.</p>
                </header>

                {renderContent()}
            </main>
        </div>
    );
};

export default StudentDashboard;