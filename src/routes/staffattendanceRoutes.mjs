import express from "express";
import { verifyToken } from "../middleware/authMiddleware.mjs";
import StaffAttendance from "../models/staffAttendanceSchema.mjs";
import User from "../models/userSchema.mjs";


const router = express.Router();

router.post("/mark", verifyToken, async (req, res) => {
    try {
        const { registrationId, date, status } = req.body;
        const currentUserRole = req.user.role;
        
        if(currentUserRole !== "Admin") {
            return res.status(403).json({ message: "Access denied: Only Admin can mark staff attendance." });
        }
        
        // 1. Find the staff member
        const staff = await User.findOne({ registrationId: registrationId });
        if(!staff || staff.role !== "Staff") {
            return res.status(404).json({ message: "Staff not found." });
        }
        
        // 2. Check if a record already exists for this exact date and staff member
        let staffAttendanceRecord = await StaffAttendance.findOne({ registrationId: registrationId, date: date });
        
        if (staffAttendanceRecord) {
            // Update existing record
            staffAttendanceRecord.status = status;
            await staffAttendanceRecord.save();
            return res.status(200).json({ message: "Staff attendance updated successfully", staffAttendanceRecord });
        } else {
            // 3. Create a brand new record (Notice we use registrationId here!)
            const staffAttendance = new StaffAttendance({
                registrationId: registrationId, // <--- THIS MATCHES YOUR SCHEMA
                date: date,
                status: status
            });
            await staffAttendance.save();
            return res.status(201).json({ message: "Staff attendance marked successfully." });
        }
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/my-records', verifyToken, async (req, res) => {
    try{
        const userId = req.user.id;
        
        // 1. Find the staff user to get their registrationId
        const staffUser = await User.findById(userId);
        if(!staffUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Search attendance using their registrationId
        const records = await StaffAttendance.find({ registrationId: staffUser.registrationId }).sort({ date: -1 });
        
        res.status(200).json({ 
            message: "Staff attendance records fetched successfully",
            totalRecords: records.length,
            records 
        });
    }catch(error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/all-records', verifyToken, async (req, res) => {
    try{
        const currentUserRole = req.user.role;
        if(currentUserRole !== "Admin") {
            return res.status(403).json({ message: "Access denied: Only Admin can view all staff attendance records." });
        }
        
        // Removed the .populate() line!
        const records = await StaffAttendance.find().sort({ date: -1 });
        
        res.status(200).json({
            message: "Staff attendance records fetched successfully",
            totalRecords: records.length,
            records 
        });
    }catch(error) {
        res.status(500).json({ message: error.message });
    }
})

export default router;