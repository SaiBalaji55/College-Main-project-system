import express from "express";
import { verifyToken } from "../middleware/authMiddleware.mjs";
import User from "../models/userSchema.mjs";
import Timetable from "../models/timetableSchema.mjs";

const router = express.Router();

router.post('/create', verifyToken, async (req, res) => {
    try{
        const currentUserRole = req.user.role;
        if(currentUserRole !== 'Admin'){
            return res.status(403).json({ message: "Access denied. Only Admin can create timetable entries." });
        }

        const { department, semester, dayOfWeek, period, timeSlot, subject, registrationId } = req.body;

        const staff = await User.findOne({registrationId:registrationId, role: "Staff"});

        if(!staff){
            return res.status(404).json({ message: "Staff member not found." });
        }
        const classConflict = await Timetable.findOne({ department, semester, dayOfWeek, period });
        if(classConflict){
            return res.status(400).json({ message: `Conflict: Semester ${semester} ${department} already has a class scheduled on ${dayOfWeek} during Period ${period}.`});
        }

        const staffConflict = await Timetable.findOne({ registrationId: staff._id, dayOfWeek, period });
        if(staffConflict){
            return res.status(400).json({ message: `Conflict: Staff member ${staff.name} is already scheduled to teach another class on ${dayOfWeek} during Period ${period}.`});
        }

        const newSlot = new Timetable({
            department,
            semester,
            dayOfWeek,
            period,
            timeSlot,
            subject,
            registrationId: staff._id
        });
        await newSlot.save();
        res.status(201).json({ message: "Timetable entry created successfully.", timetable: newSlot });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.put('/update/:id', verifyToken, async (req, res) => {
    try {
        const currentUserRole = req.user.role;
        if(currentUserRole !== 'Admin'){
            return res.status(403).json({ message: "Access denied. Only Admin can update timetable entries." });
        }
        
        const slotId = req.params.id;
        
        // 1. Create a copy of the request body so we can modify it
        let updateData = { ...req.body };

        // 2. If the update includes a new string registrationId, convert it to an ObjectId
        if (updateData.registrationId) {
            const staff = await User.findOne({ registrationId: updateData.registrationId, role: "Staff" });
            
            if (!staff) {
                return res.status(404).json({ message: "Staff member not found." });
            }
            
            // Replace the string with the actual MongoDB _id
            updateData.registrationId = staff._id;
        }

        // 3. Now perform the update using the safely converted updateData
        const updateSlot = await Timetable.findByIdAndUpdate(slotId, updateData, { new: true });
        
        if(!updateSlot){
            return res.status(404).json({ message: "Timetable entry not found." });
        }
        
        res.status(200).json({ message: "Timetable entry updated successfully.", timetable: updateSlot });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/schedule/:department/:semester', verifyToken, async (req, res) => {
    try{
        const { department, semester } = req.params;
        const schedule = await Timetable.find({ department, semester }).populate("registrationId", "name registrationId").sort({period: 1});
        res.status(200).json({
            message: `Schedule fetched for ${department} Semester ${semester}`,
            totalSlots: schedule.length,
            schedule
        });
    }catch (error) {
        res.status(500).json({ message: error.message });
    }
})

export default router;