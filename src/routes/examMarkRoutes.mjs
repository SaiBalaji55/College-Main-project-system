import express from "express";
import { verifyToken } from "../middleware/authMiddleware.mjs";
import User from "../models/userSchema.mjs";
import Mark from "../models/marksSchema.mjs";

const router = express.Router();

router.post('/addMark', verifyToken, async(req,res)=>{
    try{
        const currentUserRole = req.user.role;
        if(currentUserRole === "Student"){
            return res.status(403).json({ message: "Access denied: Only staff can add marks." });
        }

        const { registrationId, examType, subject, marksObtained, totalMarks } = req.body;
        const student = await User.findOne({ registrationId: registrationId, role: "Student" });

        if(!student){
            return res.status(404).json({ message: "Student not found." });
        }
        const existingMark = await Mark.findOne({ registrationId: student._id, examType, subject });
        if(existingMark){
            return res.status(400).json({ message: `Marks for ${subject} in ${examType} have already been uploaded.` });
        }

        const newMark = new Mark({
            registrationId: student._id,
            examType,
            subject,
            marksObtained,
            totalMarks,
            enteredBy: req.user.id
        });
        await newMark.save();
        res.status(201).json({ message: "Marks uploaded successfully!", mark: newMark });
    } catch (error){
        res.status(500).json({ message: error.message });
    }
})

router.put('/updateMark', verifyToken, async(req,res)=>{
    try{
        const currentUserRole = req.user.role;
        if(currentUserRole !== "Admin"){
            return res.status(403).json({ message: "Access denied: Only admins can update marks." });
        }
        const { registrationId, examType, subject, marksObtained, totalMarks } = req.body;
        const student = await User.findOne({ registrationId: registrationId, role: "Student" });
        if(!student){
            return res.status(404).json({ message: "Student not found." });
        }

        const markRecord = await Mark.findOne({ registrationId: student._id, examType, subject });
        if(!markRecord){
            return res.status(404).json({ message: "Mark record not found." });
        }
        markRecord.marksObtained = marksObtained;
        // markRecord.totalMarks = totalMarks;
        await markRecord.save();
        res.status(200).json({ message: "Marks updated successfully!", mark: markRecord });
    }catch (error){
        res.status(500).json({ message: error.message });
    }
})

router.get('/my-Marks', verifyToken, async(req,res)=>{
    try{
        const currentUserRole = req.user.role;
        if(currentUserRole !== "Student"){
            return res.status(403).json({ message: "Access denied: Only students can view their marks." });
        }
        
        const userId = req.user.id;
        const marks = await Mark.find({ registrationId:userId}).sort({examType: 1, subject: 1});
        res.status(200).json({message: "Report card fetched successfully",
            totalRecords: marks.length,
            marks });
    }catch (error){
        res.status(500).json({ message: error.message });
    }
})


// --- GET MARKS BY STUDENT ID (For Staff Search) ---
router.get('/student/:registrationId', verifyToken, async (req, res) => {
    try {
        const student = await User.findOne({ registrationId: req.params.registrationId, role: "Student" });
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        const marks = await Mark.find({ registrationId: student._id }).sort({ examType: 1, subject: 1 });
        res.status(200).json({ marks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;