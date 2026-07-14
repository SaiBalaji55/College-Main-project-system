import express from "express";
import { verifyToken } from "../middleware/authMiddleware.mjs";
import User from "../models/userSchema.mjs";
import Complaint from "../models/complaintsSchema.mjs";

const router = express.Router();

router.post("/submit", verifyToken, async (req, res) => {
    try{
        const currentUserRole = req.user.role;
        if (currentUserRole !== "Student") {
            return res.status(403).json({ message: "Access denied: Only students can submit complaints." });
        }
        const { subject, description } = req.body;
        const newComplaint = new Complaint({
            subject,
            description
        })
        await newComplaint.save();
        res.status(201).json({ message: "Complaint submitted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.get('/all', verifyToken, async (req, res) => {
    try{
        const currentUserRole = req.user.role;
        if(currentUserRole !== "Admin"){
            return res.status(403).json({ message: "Access denied: Only admins can view all complaints." });
        }
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.status(200).json({message:"Complaints retrieved successfully!",
            total: complaints.length, 
            complaints});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

router.put('/update-status/:id', verifyToken, async (req, res) => {
    try{
        const currentUserRole = req.user.role;
        if(currentUserRole !== "Admin"){
            return res.status(403).json({ message: "Access denied: Only admins can update complaint status." });
        }
        const complaintId = req.params.id;
        const { status } = req.body;

        if(!["Pending", "Resolved","Rejected"].includes(status)){
            return res.status(400).json({ message: "Invalid status value. Allowed values are: Pending, Resolved, Rejected." });
        }

        const updatedComplaint = await Complaint.findByIdAndUpdate(
            complaintId,
            { status },
            { new: true}
        )
        if(!updatedComplaint){
            return res.status(404).json({ message: "Complaint not found." });
        }
        res.status(200).json({ message: "Complaint status updated successfully!", complaint: updatedComplaint });
    }catch (error) {
        res.status(500).json({ message: error.message });
    }
})

export default router;