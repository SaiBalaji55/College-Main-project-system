import express from "express";
import Attendance from "../models/attendanceSchema.mjs";
import User from "../models/userSchema.mjs";
import { verifyToken } from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/mark", verifyToken, async (req, res) => {
    try{
        const {registrationId, date, status} = req.body;
        const currentUserRole = req.user.role;
        const staffId = req.user.id;

        if (currentUserRole === "Student") {
            return res.status(403).json({ message: "Access denied: Students cannot mark attendance." });
        }

        const student = await User.findOne({registrationId: registrationId});
        if(!student || student.role !== "Student") {
            return res.status(404).json({message: "Student not found."});
        }

        let attendanceRecord = await Attendance.findOne({ studentId: student._id, date });
        if (attendanceRecord) {
            attendanceRecord.status = status;
            attendanceRecord.markedBy = staffId;
            await attendanceRecord.save();
            return res.status(200).json({ message: "Attendance updated successfully", attendanceRecord });
        }else {
            const attendance = new Attendance({
                studentId: student._id,
                date,
                status,
                markedBy: req.user.id
            });
            await attendance.save();
            res.status(201).json({message: "Attendance marked successfully."});
        }
    } catch(error) {
        res.status(500).json({message: error.message});
    }
})

router.get('/my-records', verifyToken, async (req, res) => {
    try{
        
        const userId = req.user.id;
        const records = await Attendance.find({ studentId: userId }).sort({ date: -1 });
        res.status(200).json({ 
            message: "Attendance fetched successfully",
            totalDays: records.length,
            records 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }  
})

router.get('/all-records', verifyToken, async (req, res) => {
    try{
        const currentUserRole = req.user.role;

        if (currentUserRole === "Student") {
            return res.status(403).json({ message: "Access denied: Students cannot view all attendance records." });
        }
        const records = await Attendance.find()
            .populate("studentId", "name registrationId") // <-- THE MAGIC HAPPENS HERE
            .populate("markedBy", "name") // Optional: Also show which staff member marked it
            .sort({ date: -1 });
        res.status(200).json({ 
            message: "All attendance records fetched successfully",
            totalDays: records.length,
            records 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.put('/update', verifyToken, async(req,res)=>{
    try{
        const {registrationId, date, status} = req.body;
        const currentUserRole = req.user.role;
        const staffId = req.user.id;

        if (currentUserRole === "Student") {
            return res.status(403).json({ message: "Access denied: Students cannot mark attendance." });
        }

        const student = await User.findOne({registrationId: registrationId});
        if(!student || student.role !== "Student") {
            return res.status(404).json({message: "Student not found."});
        }
         let attendanceRecord = await Attendance.findOne({ studentId: student._id, date });
        if (!attendanceRecord) {
            return res.status(404).json({ message: "No attendance record found for this date to update." });
        }
        const today = new Date().toISOString().split('T')[0];
        const isPastDate = date !== today;

        if (isPastDate && currentUserRole !== "Admin") {
            return res.status(403).json({ 
                message: "Access denied: Modifying past dates requires an Admin." 
            });
        }
        attendanceRecord.status = status;
        attendanceRecord.markedBy = staffId;
        await attendanceRecord.save();
        return res.status(200).json({ message: "Attendance updated successfully", attendanceRecord });
        
    } catch(error) {
        res.status(500).json({message: error.message});
    
    }
})

router.get('/summary/:registrationId', verifyToken, async (req, res) => {
    try{
        const currentUserRole = req.user.role;

        if (currentUserRole === "Student") {
            return res.status(403).json({ message: "Access denied: Students cannot view other students' attendance records." });
        }
        const { registrationId } = req.params;
        const student = await User.findOne({ registrationId });
        if(!student || student.role !== "Student") {
            return res.status(404).json({message: "Student not found."});
        }
        const records = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
        let totalPresent = 0;
        let totalAbsent = 0;

        records.forEach(record => {
            if (record.status === "Present") totalPresent++;
            if (record.status === "Absent") totalAbsent++;
        });

        const totalDays = totalPresent + totalAbsent;
        const attendancePercentage = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(2) : 0;
        res.status(200).json({
            message: "Student attendance summary fetched successfully",
            student: {
                name: student.name,
                registrationId: student.registrationId
            },
            summary: {
                totalDays,
                totalPresent,
                totalAbsent,
                percentage: `${attendancePercentage}%`
            },
            records
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

// --- GET USER BY REGISTRATION ID (For Staff Search) ---
// --- GET ATTENDANCE BY STUDENT ID (For Staff Search) ---
router.get('/student/:registrationId', verifyToken, async (req, res) => {
    try {
        const student = await User.findOne({ registrationId: req.params.registrationId, role: "Student" });
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }
        
        const records = await Attendance.find({ studentId: student._id }).sort({ date: -1 });
        res.status(200).json({ records });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- BULK MARK CLASS ATTENDANCE ---
router.post('/bulk-mark', verifyToken, async (req, res) => {
    try {
        const { date, records } = req.body; // records = [{ studentId, status }, ...]
        const staffId = req.user.id;

        if (req.user.role === "Student") {
            return res.status(403).json({ message: "Access denied." });
        }

        // Create an array of update operations
        const bulkOps = records.map(record => ({
            updateOne: {
                filter: { studentId: record.studentId, date: date },
                update: { $set: { status: record.status, markedBy: staffId } },
                upsert: true // If a record doesn't exist for this date, create it!
            }
        }));

        // Execute all operations simultaneously
        await Attendance.bulkWrite(bulkOps);

        res.status(200).json({ message: "Class attendance saved successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;