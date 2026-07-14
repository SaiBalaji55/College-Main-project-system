import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { LayoutDashboard, UserPlus, CalendarPlus, ClipboardCheck, UserCircle, LogOut, ShieldAlert, Save, MessageSquare, CheckCircle, Search, Edit, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { token, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // NEW: Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Form States
    const [staffData, setStaffData] = useState({ registrationId: '', name: '', password: '', phone: '', email: '', role: 'Staff' });
    const [timeSlotData, setTimeSlotData] = useState({ department: 'Computer Science', semester: '3', dayOfWeek: 'Monday', period: '1', timeSlot: '09:00 AM - 10:00 AM', subject: '', registrationId: '' });
    const [staffAttData, setStaffAttData] = useState({ registrationId: '', date: new Date().toISOString().split('T')[0], status: 'Present' });
    
    const [complaints, setComplaints] = useState([]);

    // Student Directory & Admin Update States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedStudent, setSearchedStudent] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // Update Form States
    const [updateProfile, setUpdateProfile] = useState({ name: '', phone: '', email: '' });
    const [updateAtt, setUpdateAtt] = useState({ date: '', status: 'Present' });
    const [updateMark, setUpdateMark] = useState({ examType: 'Internal 1', subject: '', marksObtained: '', totalMarks: '100' });

    // Fetch Admin Profile
    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [profileRes, complaintsRes] = await Promise.all([
                    axios.get('http://localhost:3000/auth/me', config),
                    axios.get('http://localhost:3000/complaint/all', config)
                ]);
                
                setProfileData(profileRes.data.user);
                setComplaints(complaintsRes.data.complaints);
            } catch (error) {
                toast.error("Failed to load dashboard data.");
            } finally {
                setIsLoading(false);
            }
        };
        if (token) fetchAdminData();
    }, [token]);

    // --- API INTEGRATION HANDLERS ---

    const handleRegisterStaff = async (e) => {
        e.preventDefault();
        if (!staffData.registrationId || !staffData.name || !staffData.email) return toast.error("Error: ID, Name, and Email are mandatory!");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post('http://localhost:3000/auth/register', staffData, config);
            toast.success(res.data.message || "Staff member registered successfully!");
            setStaffData({ registrationId: '', name: '', password: '', phone: '', email: '', role: 'Staff' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to register staff.");
        }
    };

    const handleCreateTimetable = async (e) => {
        e.preventDefault();
        if (!timeSlotData.subject || !timeSlotData.registrationId) return toast.error("Error: Subject and Staff ID are required!");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post('http://localhost:3000/timetable/create', timeSlotData, config);
            toast.success(res.data.message || "Timetable slot created successfully!");
            setTimeSlotData({ ...timeSlotData, subject: '', registrationId: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create timetable slot.");
        }
    };

    const handleResolveTicket = async (complaintId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:3000/complaint/update-status/${complaintId}`, { status: 'Resolved' }, config);
            toast.success("Ticket marked as resolved!");
            setComplaints(complaints.map(c => c._id === complaintId ? { ...c, status: 'Resolved' } : c));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resolve ticket.");
        }
    };

    const handleMarkStaffAttendance = async (e) => {
        e.preventDefault();
        if (!staffAttData.registrationId) return toast.error("Error: Staff ID is required!");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post('http://localhost:3000/staff-attendance/mark', staffAttData, config);
            toast.success(res.data.message || "Staff attendance marked successfully!");
            setStaffAttData({ ...staffAttData, registrationId: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to mark staff attendance.");
        }
    };

    // --- STUDENT DIRECTORY SEARCH & UPDATE LOGIC ---
    
    const fetchStudentData = async (searchId) => {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [profileRes, attRes, marksRes] = await Promise.all([
            axios.get(`http://localhost:3000/auth/user/${searchId}`, config),
            axios.get(`http://localhost:3000/attendance/student/${searchId}`, config),
            axios.get(`http://localhost:3000/exam-marks/student/${searchId}`, config)
        ]);

        const attendanceRecords = attRes.data.records || [];
        const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;

        setSearchedStudent({
            profile: profileRes.data.user,
            attendance: attendanceRecords,
            stats: { present: presentCount, absent: absentCount, total: attendanceRecords.length },
            marks: marksRes.data.marks || []
        });

        setUpdateProfile({ name: profileRes.data.user.name, phone: profileRes.data.user.phone, email: profileRes.data.user.email });
    };

    const handleSearchStudent = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return toast.error("Please enter a Student ID.");
        
        setIsSearching(true);
        try {
            await fetchStudentData(searchQuery.toUpperCase());
            toast.success("Student records loaded.");
        } catch (error) {
            setSearchedStudent(null);
            toast.error(error.response?.data?.message || "Student not found.");
        } finally {
            setIsSearching(false);
        }
    };

    const submitProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:3000/auth/update-student/${searchedStudent.profile.registrationId}`, updateProfile, config);
            toast.success("Profile updated successfully!");
            fetchStudentData(searchedStudent.profile.registrationId);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile.");
        }
    };

    const submitAttendanceUpdate = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { registrationId: searchedStudent.profile.registrationId, date: updateAtt.date, status: updateAtt.status };
            await axios.put(`http://localhost:3000/attendance/update`, payload, config);
            toast.success("Attendance updated successfully!");
            fetchStudentData(searchedStudent.profile.registrationId);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update attendance.");
        }
    };

    const submitMarkUpdate = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { 
                registrationId: searchedStudent.profile.registrationId, 
                examType: updateMark.examType, 
                subject: updateMark.subject, 
                marksObtained: updateMark.marksObtained, 
                totalMarks: updateMark.totalMarks 
            };
            await axios.put(`http://localhost:3000/exam-marks/updateMark`, payload, config);
            toast.success("Exam mark updated successfully!");
            fetchStudentData(searchedStudent.profile.registrationId);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update marks.");
        }
    };

    // --- DYNAMIC RENDERING ---
    const renderContent = () => {
        if (isLoading) {
            return <div className="text-gray-400 animate-pulse">Loading secure dashboard...</div>;
        }

        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                            <div className="flex items-center space-x-3 mb-2">
                                <ShieldAlert className="text-red-500" size={24} />
                                <h3 className="text-gray-400 font-semibold">System Status</h3>
                            </div>
                            <p className="text-2xl font-bold text-white">All Systems Operational</p>
                        </div>
                    </div>
                );
            case 'search-student':
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative shadow-lg">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                            <h2 className="text-xl font-bold text-white mb-6">Student Database Directory</h2>
                            <form onSubmit={handleSearchStudent} className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                                    placeholder="ENTER STUDENT ID (e.g. CSE-001)"
                                    className="flex-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 uppercase"
                                    required
                                />
                                <button type="submit" disabled={isSearching} className="px-6 py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50">
                                    <Search size={18} /> {isSearching ? 'Searching...' : 'Retrieve Records'}
                                </button>
                            </form>
                        </div>

                        {searchedStudent && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
                                        <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Student Profile</h3>
                                        <div className="space-y-3 text-sm overflow-x-auto">
                                            <p><span className="text-gray-400">Full Name:</span> <span className="text-white font-semibold ml-2">{searchedStudent.profile.name}</span></p>
                                            <p><span className="text-gray-400">Reg ID:</span> <span className="text-green-400 font-mono font-bold ml-2">{searchedStudent.profile.registrationId}</span></p>
                                            <p><span className="text-gray-400">Email Address:</span> <span className="text-white ml-2">{searchedStudent.profile.email}</span></p>
                                            <p><span className="text-gray-400">Phone Number:</span> <span className="text-white ml-2">{searchedStudent.profile.phone}</span></p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
                                        <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Attendance Summary</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                                                <p className="text-xs text-gray-400 uppercase font-semibold">Total Days</p>
                                                <p className="text-2xl font-bold text-white mt-1">{searchedStudent.stats.total}</p>
                                            </div>
                                            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                                                <p className="text-xs text-green-500 uppercase font-semibold">Present</p>
                                                <p className="text-2xl font-bold text-green-400 mt-1">{searchedStudent.stats.present}</p>
                                            </div>
                                            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                                                <p className="text-xs text-red-500 uppercase font-semibold">Absent</p>
                                                <p className="text-2xl font-bold text-red-400 mt-1">{searchedStudent.stats.absent}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900 border border-red-900/40 rounded-2xl p-6 shadow-lg">
                                    <div className="flex items-center space-x-2 mb-4 border-b border-gray-800 pb-2">
                                        <Edit className="text-red-500" size={20} />
                                        <h3 className="text-lg font-bold text-red-400">Admin Modification Tools</h3>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <form onSubmit={submitProfileUpdate} className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Update Details</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                                <input type="text" value={updateProfile.name} onChange={e => setUpdateProfile({...updateProfile, name: e.target.value})} placeholder="Name" className="p-2 bg-gray-900 border border-gray-700 rounded text-sm text-white" />
                                                <input type="tel" value={updateProfile.phone} onChange={e => setUpdateProfile({...updateProfile, phone: e.target.value})} placeholder="Phone" className="p-2 bg-gray-900 border border-gray-700 rounded text-sm text-white" />
                                                <input type="email" value={updateProfile.email} onChange={e => setUpdateProfile({...updateProfile, email: e.target.value})} placeholder="Email" className="sm:col-span-2 p-2 bg-gray-900 border border-gray-700 rounded text-sm text-white" />
                                            </div>
                                            <button type="submit" className="w-full py-2 bg-gray-800 hover:bg-green-500 text-white hover:text-gray-950 text-xs font-bold rounded transition-colors">Save Details</button>
                                        </form>

                                        <form onSubmit={submitAttendanceUpdate} className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Modify Attendance</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                                <input type="date" value={updateAtt.date} onChange={e => setUpdateAtt({...updateAtt, date: e.target.value})} className="p-2 bg-gray-900 border border-gray-700 rounded text-sm text-white" required />
                                                <select value={updateAtt.status} onChange={e => setUpdateAtt({...updateAtt, status: e.target.value})} className="p-2 bg-gray-900 border border-gray-700 rounded text-sm text-white">
                                                    <option value="Present">Present</option>
                                                    <option value="Absent">Absent</option>
                                                </select>
                                            </div>
                                            <button type="submit" className="w-full py-2 bg-gray-800 hover:bg-green-500 text-white hover:text-gray-950 text-xs font-bold rounded transition-colors">Overwrite Record</button>
                                        </form>

                                        <form onSubmit={submitMarkUpdate} className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Override Exam Marks</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                                <select value={updateMark.examType} onChange={e => setUpdateMark({...updateMark, examType: e.target.value})} className="p-2 bg-gray-900 border border-gray-700 rounded text-sm text-white">
                                                    <option value="Internal 1">Internal 1</option>
                                                    <option value="Internal 2">Internal 2</option>
                                                    <option value="Semester">Semester</option>
                                                </select>
                                                <input type="text" value={updateMark.subject} onChange={e => setUpdateMark({...updateMark, subject: e.target.value})} placeholder="Exact Subject Name" className="p-2 bg-gray-900 border border-gray-700 rounded text-sm text-white" required />
                                                <input type="number" value={updateMark.marksObtained} onChange={e => setUpdateMark({...updateMark, marksObtained: e.target.value})} placeholder="Marks Got" className="p-2 bg-gray-900 border border-gray-700 rounded text-sm text-white" required />
                                                <input type="number" value={updateMark.totalMarks} onChange={e => setUpdateMark({...updateMark, totalMarks: e.target.value})} placeholder="Total" className="p-2 bg-gray-900 border border-gray-700 rounded text-sm text-white" required />
                                            </div>
                                            <button type="submit" className="w-full py-2 bg-gray-800 hover:bg-green-500 text-white hover:text-gray-950 text-xs font-bold rounded transition-colors">Update Grade</button>
                                        </form>
                                    </div>
                                </div>

                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg lg:col-span-2">
                                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Academic Performance</h3>
                                    {searchedStudent.marks.length > 0 ? (
                                        <div className="overflow-x-auto w-full">
                                            <table className="w-full text-left border-collapse min-w-[400px]">
                                                <thead>
                                                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                                        <th className="py-3 px-4">Subject Name</th>
                                                        <th className="py-3 px-4">Exam Type</th>
                                                        <th className="py-3 px-4 text-right">Marks Obtained</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {searchedStudent.marks.map((mark, i) => (
                                                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                                            <td className="py-3 px-4 text-white font-medium">{mark.subject}</td>
                                                            <td className="py-3 px-4 text-gray-400 text-sm">{mark.examType}</td>
                                                            <td className="py-3 px-4 text-right">
                                                                <span className="font-bold text-green-400 text-lg">{mark.marksObtained}</span>
                                                                <span className="text-xs text-gray-600"> / {mark.totalMarks}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : <p className="text-gray-500 text-sm italic p-4 text-center">No exam records found.</p>}
                                </div>

                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg lg:col-span-2">
                                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Detailed Attendance Log</h3>
                                    {searchedStudent.attendance.length > 0 ? (
                                        <div className="overflow-x-auto max-h-64 overflow-y-auto w-full pr-2 custom-scrollbar">
                                            <table className="w-full text-left border-collapse min-w-[300px]">
                                                <thead>
                                                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider sticky top-0 bg-gray-900">
                                                        <th className="py-3 px-4">Date</th>
                                                        <th className="py-3 px-4">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {searchedStudent.attendance.map((rec, i) => (
                                                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                                            <td className="py-3 px-4 text-white text-sm">
                                                                {new Date(rec.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-md border ${rec.status === 'Present' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                                    {rec.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : <p className="text-gray-500 text-sm italic p-4 text-center">No daily attendance logs found.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'register-staff':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl relative shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Onboard New Faculty / Staff</h2>
                        <form onSubmit={handleRegisterStaff} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Staff ID</label>
                                    <input type="text" value={staffData.registrationId} onChange={(e) => setStaffData({...staffData, registrationId: e.target.value.toUpperCase()})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 uppercase" placeholder="e.g. CSE-STAFF-01" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Full Name</label>
                                    <input type="text" value={staffData.name} onChange={(e) => setStaffData({...staffData, name: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Initial Password</label>
                                    <input type="text" value={staffData.password} onChange={(e) => setStaffData({...staffData, password: e.target.value})} placeholder="DD-MM-YYYY" className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Phone Number</label>
                                    <input type="tel" value={staffData.phone} onChange={(e) => setStaffData({...staffData, phone: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold">Email Address</label>
                                <input type="email" value={staffData.email} onChange={(e) => setStaffData({...staffData, email: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                            </div>
                            <button type="submit" className="w-full py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg flex justify-center items-center gap-2 transition-all">
                                <UserPlus size={18} /> Register Staff Member
                            </button>
                        </form>
                    </div>
                );
            case 'create-timetable':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl relative shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Create Timetable Slot</h2>
                        <form onSubmit={handleCreateTimetable} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Department</label>
                                    <input type="text" value={timeSlotData.department} onChange={(e) => setTimeSlotData({...timeSlotData, department: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Semester</label>
                                    <input type="number" value={timeSlotData.semester} onChange={(e) => setTimeSlotData({...timeSlotData, semester: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Day of Week</label>
                                    <select value={timeSlotData.dayOfWeek} onChange={(e) => setTimeSlotData({...timeSlotData, dayOfWeek: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Period (1-8)</label>
                                    <input type="number" min="1" max="8" value={timeSlotData.period} onChange={(e) => setTimeSlotData({...timeSlotData, period: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Subject</label>
                                    <input type="text" value={timeSlotData.subject} onChange={(e) => setTimeSlotData({...timeSlotData, subject: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Assign Staff ID</label>
                                    <input type="text" value={timeSlotData.registrationId} onChange={(e) => setTimeSlotData({...timeSlotData, registrationId: e.target.value.toUpperCase()})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 uppercase" required />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg flex justify-center items-center gap-2 transition-all">
                                <CalendarPlus size={18} /> Allocate Slot
                            </button>
                        </form>
                    </div>
                );
            case 'complaints':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Active Student Tickets</h2>
                        
                        <div className="space-y-4">
                            {complaints.length === 0 ? (
                                <p className="text-gray-400">No pending complaints.</p>
                            ) : (
                                complaints.map((complaint) => (
                                    <div key={complaint._id} className="bg-gray-950 border border-gray-800 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${complaint.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'}`}>
                                                    {complaint.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white">{complaint.subject}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{complaint.description}</p>
                                        </div>
                                        {complaint.status === 'Pending' && (
                                            <button 
                                                onClick={() => handleResolveTicket(complaint._id)} 
                                                className="px-4 py-2 bg-gray-800 hover:bg-green-500 hover:text-gray-950 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-gray-700 hover:border-green-500 w-full sm:w-auto"
                                            >
                                                <CheckCircle size={16} /> Resolve
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            case 'profile':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-3xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <div className="flex items-center space-x-6 mb-8 border-b border-gray-800 pb-8 overflow-x-auto">
                            <div className="h-24 w-24 bg-gray-950 border border-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserCircle size={48} className="text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{profileData?.name || "System Administrator"}</h2>
                                <p className="text-green-400 font-mono mt-1">{profileData?.registrationId}</p>
                                <span className="inline-block mt-2 px-3 py-1 bg-red-900/30 text-xs font-bold text-red-400 rounded-full border border-red-800">Root Access Granted</span>
                            </div>
                        </div>
                    </div>
                );
            case 'staff-attendance':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl relative shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Daily Staff Attendance</h2>
                        <form onSubmit={handleMarkStaffAttendance} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Staff ID</label>
                                    <input type="text" value={staffAttData.registrationId} onChange={(e) => setStaffAttData({...staffAttData, registrationId: e.target.value.toUpperCase()})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 uppercase" placeholder="e.g. CSE-STAFF-01" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Date</label>
                                    <input type="date" value={staffAttData.date} onChange={(e) => setStaffAttData({...staffAttData, date: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold">Status</label>
                                <select value={staffAttData.status} onChange={(e) => setStaffAttData({...staffAttData, status: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500">
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg flex justify-center items-center gap-2 transition-all">
                                <ClipboardCheck size={18} /> Submit Staff Record
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
                    Admin Portal
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

            {/* Admin Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 flex flex-col 
                transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-800 hidden md:block">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                        Admin Control
                    </h2>
                </div>
                
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <LayoutDashboard size={20} />
                        <span className="font-medium">System Overview</span>
                    </button>
                    <button onClick={() => { setActiveTab('search-student'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'search-student' ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <Search size={20} />
                        <span className="font-medium">Student Database</span>
                    </button>
                    <button onClick={() => { setActiveTab('register-staff'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'register-staff' ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <UserPlus size={20} />
                        <span className="font-medium">Register Staff</span>
                    </button>
                    <button onClick={() => { setActiveTab('create-timetable'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'create-timetable' ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <CalendarPlus size={20} />
                        <span className="font-medium">Create Timetable</span>
                    </button>
                    <button onClick={() => { setActiveTab('complaints'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'complaints' ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <MessageSquare size={20} />
                        <span className="font-medium">Help Desk Tickets</span>
                    </button>
                    <button onClick={() => { setActiveTab('staff-attendance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'staff-attendance' ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <ClipboardCheck size={20} />
                        <span className="font-medium">Staff Attendance</span>
                    </button>
                    <button onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'profile' ? 'bg-gray-800 text-green-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <UserCircle size={20} />
                        <span className="font-medium">Admin Profile</span>
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
                    <h1 className="text-2xl md:text-3xl font-bold">Welcome, {profileData?.name || "Admin"}.</h1>
                    <p className="text-gray-400 mt-1 text-sm md:text-base">Select an action to modify system data.</p>
                </header>
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminDashboard;