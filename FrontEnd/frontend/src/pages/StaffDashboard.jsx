import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { LayoutDashboard, Users, BookOpen, UserPlus, UserCircle, LogOut, Save, ClipboardCheck, Clock, Search, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
    const { token, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [myAttendance, setMyAttendance] = useState([]);
    const [timetable, setTimetable] = useState([]);
    
    // Filters for Timetable
    const [filter, setFilter] = useState({ department: 'Computer Science', semester: '3' });

    // Student Directory Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedStudent, setSearchedStudent] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // NEW: Bulk Attendance States
    const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
    const [studentList, setStudentList] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({}); 
    const [filterDept, setFilterDept] = useState('Computer Science'); 
    const [filterSem, setFilterSem] = useState('3'); 

    // Form States (Marks & Registration)
    const [markData, setMarkData] = useState({ registrationId: '', examType: 'Internal 1', subject: '', marksObtained: '', totalMarks: '100' });
    const [studentData, setStudentData] = useState({ registrationId: '', name: '', password: '', phone: '', email: '', role: 'Student', department: 'Computer Science', semester: '3' });

    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [profileRes, attendanceRes] = await Promise.all([
                    axios.get('http://localhost:3000/auth/me', config),
                    axios.get('http://localhost:3000/staff-attendance/my-records', config) 
                ]);
                setProfileData(profileRes.data.user);
                setMyAttendance(attendanceRes.data.records || []);
            } catch (error) {
                toast.error("Failed to load profile data.");
            } finally {
                setIsLoading(false);
            }
        };
        if (token) fetchStaffData();
    }, [token]);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!token) return;
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`http://localhost:3000/timetable/schedule/${filter.department}/${filter.semester}`, config);
                setTimetable(res.data.schedule || []);
            } catch (error) {
                // Silently fail if filter is invalid
            }
        };
        fetchSchedule();
    }, [filter, token]);

    // --- NEW: BULK ATTENDANCE HANDLERS ---
    
    const handleLoadStudents = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Fetch students dynamically based on Department and Semester
            const res = await axios.get(`http://localhost:3000/auth/students?department=${filterDept}&semester=${filterSem}`, config);
            const loadedStudents = res.data.students || [];
            
            setStudentList(loadedStudents);
            
            // Default everyone to 'Present' to save time
            const initialRecords = {};
            loadedStudents.forEach(s => {
                initialRecords[s._id] = 'Present'; 
            });
            setAttendanceRecords(initialRecords);
            
            toast.success(`Loaded ${loadedStudents.length} students from ${filterDept} Sem ${filterSem}.`);
        } catch (error) {
            toast.error("Failed to load class list.");
        }
    };

    const toggleAttendance = (studentId, status) => {
        setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if(studentList.length === 0) return toast.error("No students loaded!");
        
        const recordsToSubmit = studentList.map(s => ({
            studentId: s._id,
            status: attendanceRecords[s._id]
        }));

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post('http://localhost:3000/attendance/bulk-mark', {
                date: bulkDate,
                records: recordsToSubmit
            }, config);
            
            toast.success("Class attendance saved successfully!");
            setStudentList([]); 
            setAttendanceRecords({});
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save attendance.");
        }
    };

    // --- EXISTING HANDLERS ---

    const handleUploadMarks = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post('http://localhost:3000/exam-marks/addMark', markData, config);
            toast.success(res.data.message);
            setMarkData({ ...markData, registrationId: '', marksObtained: '' });
        } catch (error) {
            toast.error("Failed to upload marks.");
        }
    };

    const handleRegisterStudent = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post('http://localhost:3000/auth/register', studentData, config);
            toast.success(res.data.message);
            setStudentData({ registrationId: '', name: '', password: '', phone: '', email: '', role: 'Student', department: 'Computer Science', semester: '3' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to register student.");
        }
    };

    const handleSearchStudent = async (e) => {
        e.preventDefault();
        setIsSearching(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const searchId = searchQuery.toUpperCase();
            const [profileRes, attRes, marksRes] = await Promise.all([
                axios.get(`http://localhost:3000/auth/user/${searchId}`, config),
                axios.get(`http://localhost:3000/attendance/student/${searchId}`, config),
                axios.get(`http://localhost:3000/exam-marks/student/${searchId}`, config)
            ]);
            setSearchedStudent({ 
                profile: profileRes.data.user, 
                attendance: attRes.data.records || [], 
                marks: marksRes.data.marks || [], 
                stats: { 
                    present: attRes.data.records?.filter(r => r.status === 'Present').length || 0, 
                    absent: attRes.data.records?.filter(r => r.status === 'Absent').length || 0, 
                    total: attRes.data.records?.length || 0 
                } 
            });
            toast.success("Student records loaded.");
        } catch (error) {
            toast.error("Student not found.");
        } finally {
            setIsSearching(false);
        }
    };

    const renderContent = () => {
        if (isLoading) return <div className="text-gray-400 animate-pulse">Loading dashboard data...</div>;

        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                            <h3 className="text-gray-400 font-semibold mb-2">Faculty Department</h3>
                            <p className="text-2xl font-bold text-white">Computer Science</p>
                        </div>
                    </div>
                );
            case 'mark-attendance':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg w-full">
                        <div className="flex items-center space-x-2 mb-6">
                            <Users className="text-green-500" size={24} />
                            <h2 className="text-xl font-bold text-white">Class Attendance Entry</h2>
                        </div>
                        
                        {/* Control Panel */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-gray-950 p-4 rounded-xl border border-gray-800">
                            <div className="flex-1">
                                <label className="text-xs text-gray-400 uppercase font-semibold">Date</label>
                                <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded text-white" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-400 uppercase font-semibold">Department</label>
                                <input type="text" value={filterDept} onChange={(e) => setFilterDept(e.target.value)} placeholder="e.g. Computer Science" className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded text-white" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-400 uppercase font-semibold">Semester</label>
                                <input type="number" value={filterSem} onChange={(e) => setFilterSem(e.target.value)} placeholder="e.g. 3" className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded text-white" />
                            </div>
                            <div className="flex items-end">
                                <button onClick={handleLoadStudents} className="w-full sm:w-auto px-6 py-2 bg-gray-800 hover:bg-green-500 hover:text-gray-950 text-white font-bold rounded transition-all shadow-md border border-gray-700 hover:border-green-500 h-[42px]">
                                    Load Class
                                </button>
                            </div>
                        </div>

                        {/* Class List Table */}
                        {studentList.length > 0 && (
                            <form onSubmit={handleBulkSubmit} className="space-y-6">
                                <div className="overflow-x-auto w-full border border-gray-800 rounded-lg custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                        <thead>
                                            <tr className="bg-gray-950 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                                <th className="p-3">S.No</th>
                                                <th className="p-3">Reg ID</th>
                                                <th className="p-3">Student Name</th>
                                                <th className="p-3 text-center">Attendance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentList.map((student, idx) => (
                                                <tr key={student._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                                    <td className="p-3 text-gray-500">{idx + 1}</td>
                                                    <td className="p-3 text-green-400 font-mono text-sm font-bold">{student.registrationId}</td>
                                                    <td className="p-3 text-white font-medium">{student.name}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => toggleAttendance(student._id, 'Present')}
                                                                className={`px-4 py-1.5 rounded text-xs font-bold transition-all border ${attendanceRecords[student._id] === 'Present' ? 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300'}`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => toggleAttendance(student._id, 'Absent')}
                                                                className={`px-4 py-1.5 rounded text-xs font-bold transition-all border ${attendanceRecords[student._id] === 'Absent' ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300'}`}
                                                            >
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="flex justify-end pt-2 border-t border-gray-800">
                                    <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                        <Save size={18} /> Submit Class Roster
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                );
            case 'search-student':
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative shadow-lg">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                            <h2 className="text-xl font-bold text-white mb-6">Student Directory Lookup</h2>
                            <form onSubmit={handleSearchStudent} className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                                    placeholder="ENTER STUDENT ID (e.g. CSE-001)"
                                    className="flex-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 uppercase"
                                    required
                                />
                                <button 
                                    type="submit" 
                                    disabled={isSearching} 
                                    className="px-6 py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Search size={18} /> {isSearching ? 'Searching...' : 'Search Record'}
                                </button>
                            </form>
                        </div>

                        {searchedStudent && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
                                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Student Profile</h3>
                                    <div className="space-y-3 text-sm overflow-x-auto">
                                        <p><span className="text-gray-400">Full Name:</span> <span className="text-white font-semibold ml-2">{searchedStudent.profile.name}</span></p>
                                        <p><span className="text-gray-400">Reg ID:</span> <span className="text-green-400 font-mono font-bold ml-2">{searchedStudent.profile.registrationId}</span></p>
                                        <p><span className="text-gray-400">Department:</span> <span className="text-white ml-2">{searchedStudent.profile.department}</span></p>
                                        <p><span className="text-gray-400">Semester:</span> <span className="text-white ml-2">{searchedStudent.profile.semester}</span></p>
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
                        )}
                    </div>
                );
            case 'upload-marks':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl relative shadow-lg">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Exam Marks Entry</h2>
                        <form onSubmit={handleUploadMarks} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Student ID</label>
                                    <input type="text" value={markData.registrationId} onChange={(e) => setMarkData({...markData, registrationId: e.target.value.toUpperCase()})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 uppercase" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Subject</label>
                                    <input type="text" value={markData.subject} onChange={(e) => setMarkData({...markData, subject: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Exam Type</label>
                                    <select value={markData.examType} onChange={(e) => setMarkData({...markData, examType: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500">
                                        <option value="Internal 1">Internal 1</option>
                                        <option value="Internal 2">Internal 2</option>
                                        <option value="Semester">Semester</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Total Marks</label>
                                    <input type="number" value={markData.totalMarks} onChange={(e) => setMarkData({...markData, totalMarks: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold">Marks Obtained</label>
                                <input type="number" value={markData.marksObtained} onChange={(e) => setMarkData({...markData, marksObtained: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                            </div>
                            <button type="submit" className="w-full py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg flex justify-center items-center gap-2 transition-all">
                                <Save size={18} /> Upload Grade
                            </button>
                        </form>
                    </div>
                );
            case 'schedule':
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                const periods = [1, 2, 3, 4, 5, 6, 7, 8];

                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-6">Department Schedule</h2>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <input 
                                placeholder="Department" 
                                value={filter.department} 
                                onChange={(e) => setFilter({...filter, department: e.target.value})}
                                className="p-2 bg-gray-950 border border-gray-700 rounded text-white w-full sm:w-auto"
                            />
                            <input 
                                placeholder="Semester" 
                                value={filter.semester} 
                                onChange={(e) => setFilter({...filter, semester: e.target.value})}
                                className="p-2 bg-gray-950 border border-gray-700 rounded text-white w-full sm:w-24"
                            />
                        </div>

                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-center border-collapse text-xs min-w-[600px]">
                                <thead>
                                    <tr>
                                        <th className="p-3 border border-gray-800 bg-gray-950">Day</th>
                                        {periods.map(p => <th key={p} className="p-3 border border-gray-800 bg-gray-950">P{p}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {days.map(day => (
                                        <tr key={day}>
                                            <td className="p-3 border border-gray-800 font-bold text-green-500">{day}</td>
                                            {periods.map(p => {
                                                const slot = timetable.find(t => t.dayOfWeek === day && String(t.period) === String(p));
                                                return (
                                                    <td key={p} className="p-2 border border-gray-800 h-20">
                                                        {slot ? (
                                                            <div className="bg-green-500/10 p-1 rounded border border-green-500/20">
                                                                <p className="font-bold text-white">{slot.subject}</p>
                                                                <p className="text-[10px] text-gray-400">{slot.registrationId?.name}</p>
                                                            </div>
                                                        ) : "-"}
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
            case 'register-student':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl relative shadow-lg">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">Onboard New Student</h2>
                        <form onSubmit={handleRegisterStudent} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Registration ID</label>
                                    <input type="text" value={studentData.registrationId} onChange={(e) => setStudentData({...studentData, registrationId: e.target.value.toUpperCase()})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 uppercase" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Full Name</label>
                                    <input type="text" value={studentData.name} onChange={(e) => setStudentData({...studentData, name: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Department</label>
                                    <input type="text" value={studentData.department} onChange={(e) => setStudentData({...studentData, department: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Semester</label>
                                    <input type="number" value={studentData.semester} onChange={(e) => setStudentData({...studentData, semester: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Initial Password (DOB)</label>
                                    <input type="text" value={studentData.password} onChange={(e) => setStudentData({...studentData, password: e.target.value})} placeholder="DD-MM-YYYY" className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-semibold">Phone Number</label>
                                    <input type="tel" value={studentData.phone} onChange={(e) => setStudentData({...studentData, phone: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-semibold">Email Address</label>
                                <input type="email" value={studentData.email} onChange={(e) => setStudentData({...studentData, email: e.target.value})} className="w-full mt-1 p-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500" required />
                            </div>
                            <button type="submit" className="w-full py-3 bg-green-500 hover:bg-green-400 text-gray-950 font-bold rounded-lg flex justify-center items-center gap-2 transition-all">
                                <UserPlus size={18} /> Register Account
                            </button>
                        </form>
                    </div>
                );
            case 'my-attendance':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <h2 className="text-xl font-bold text-white mb-6">My Attendance Records</h2>
                        
                        {myAttendance.length > 0 ? (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[300px]">
                                    <thead>
                                        <tr className="border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myAttendance.map((record, index) => (
                                            <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                                <td className="py-3 px-4 text-white">
                                                    {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md 
                                                        ${record.status === 'Present' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                                                          record.status === 'Absent' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                                                          'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
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
            case 'profile':
                return (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-3xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 border-b border-gray-800 pb-8 overflow-x-auto text-center sm:text-left">
                            <div className="h-24 w-24 bg-gray-950 border border-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                <UserCircle size={48} className="text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{profileData?.name || "Staff Member"}</h2>
                                <p className="text-green-400 font-mono mt-1">{profileData?.registrationId}</p>
                                <span className="inline-block mt-2 px-3 py-1 bg-gray-800 text-xs font-medium text-gray-300 rounded-full border border-gray-700">Department Faculty</span>
                            </div>
                        </div>
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
                    Faculty Portal
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

            {/* Staff Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 flex flex-col 
                transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-800 hidden md:block">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                        Faculty Portal
                    </h2>
                </div>
                
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Overview</span>
                    </button>
                    <button onClick={() => { setActiveTab('search-student'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'search-student' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <Search size={20} />
                        <span className="font-medium">Student Directory</span>
                    </button>
                    <button onClick={() => { setActiveTab('mark-attendance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'mark-attendance' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <Users size={20} />
                        <span className="font-medium">Class Attendance</span>
                    </button>
                    <button onClick={() => { setActiveTab('upload-marks'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'upload-marks' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <BookOpen size={20} />
                        <span className="font-medium">Upload Marks</span>
                    </button>
                    <button onClick={() => { setActiveTab('register-student'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'register-student' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <UserPlus size={20} />
                        <span className="font-medium">Register Student</span>
                    </button>
                    <button onClick={() => { setActiveTab('my-attendance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'my-attendance' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <ClipboardCheck size={20} />
                        <span className="font-medium">My Attendance</span>
                    </button>
                    <button onClick={() => { setActiveTab('schedule'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'schedule' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <Clock size={20} />
                        <span className="font-medium">Timetable</span>
                    </button>
                    <button onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'profile' ? 'bg-gray-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                        <UserCircle size={20} />
                        <span className="font-medium">My Profile</span>
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
                    <h1 className="text-2xl md:text-3xl font-bold">Welcome, {profileData?.name || "Professor"}.</h1>
                    <p className="text-gray-400 mt-1 text-sm md:text-base">Select an action from the sidebar to manage your classes.</p>
                </header>

                {renderContent()}
            </main>
        </div>
    );
};

export default StaffDashboard;