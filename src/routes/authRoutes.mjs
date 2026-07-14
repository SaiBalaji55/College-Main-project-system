import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; 
import User from "../models/userSchema.mjs";
import { verifyToken } from "../middleware/authMiddleware.mjs"; // Import the security check

const router = express.Router();

// ==========================================
// ROUTE 1: REGISTER USER (Protected Route)
// ==========================================
// The verifyToken middleware runs FIRST to ensure the person making the request is logged in
router.post("/register", verifyToken, async (req, res) => {
    const { registrationId, password, name, phone, email, role, department, semester} = req.body;
    
    // We get the role of the person trying to add a new user from the decoded JWT token
    const currentUserRole = req.user.role; 

    // --- CONDITION CHECKS ---
    
    // 1. Students cannot add ANY users
    if (currentUserRole === "Student") {
        return res.status(403).json({ message: "Access denied: Students cannot register new users." });
    }

    // 2. Staff can ONLY add Students
    if (currentUserRole === "Staff" && role !== "Student") {
        return res.status(403).json({ message: "Access denied: Staff members can only register Students." });
    }

    // (If the user is an Admin, they pass the above checks and can register anyone)
    
    // --- DATABASE REGISTRATION LOGIC ---
    try {
        // Check if the user already exists by registrationId or email
        const userExists = await User.findOne({ 
            $or: [{ email }, { registrationId }] 
        });
        
        if (userExists) {
            return res.status(400).json({ message: "User with this Registration ID or Email already exists." });
        }
        
        // Create the user
        const newUser = new User({
            registrationId,
            password, // This will be automatically encrypted by the pre-save hook in userSchema.mjs
            name,
            phone,
            email,
            role,
            department: role === 'Student' ? department : undefined,
            semester: role === 'Student' ? semester : undefined
        });
        
        // Save to database
        await newUser.save();
        res.status(201).json({ message: `${role} registered successfully!` });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// ROUTE 2: LOGIN USER (Public Route)
// ==========================================
router.post("/login", async (req, res) => {
    const { registrationId, password } = req.body;
    
    try {
        // 1. Find the user by Registration ID
        const user = await User.findOne({ registrationId });
        if (!user) {
            return res.status(404).json({ message: "Invalid Registration ID or Password" });
        }
        
        // 2. Compare the typed password against the encrypted password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Registration ID or Password" });
        }
        
        // 3. Generate the JWT Token (Embedding the ID and ROLE)
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" } // Token expires in 24 hours
        );
        
        // 4. Send the token and role back to the frontend
        res.status(200).json({ 
            message: "Login successful",
            token, 
            role: user.role ,
            isFirstLogin: user.isFirstLogin
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/change-first-password', verifyToken, async (req, res) => {
    try{
        const { newPassword } = req.body;
        const userId = req.user.id
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.isFirstLogin) {
            return res.status(400).json({ message: "Password change not allowed after first login" });
        }
        user.password = newPassword;
        user.isFirstLogin = false; // Mark that the first login password change has been done
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.log("password change error", error)
        res.status(500).json({ message: error.message });
    }
})

router.get('/me', verifyToken, async (req, res) => {
    try {
        // req.user.id is securely extracted from their JWT token by your middleware
        const user = await User.findById(req.user.id).select('-password'); 
        
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- GET USER BY REGISTRATION ID (For Staff Search) ---
router.get('/user/:registrationId', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ registrationId: req.params.registrationId, role: 'Student' }).select('-password');
        if (!user) {
            return res.status(404).json({ message: "Student not found in database." });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- ADMIN ROUTE: UPDATE STUDENT PROFILE ---
router.put('/update-student/:registrationId', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied: Only Admins can modify profile data." });
        }

        const { name, phone, email } = req.body;
        
        // Find the user and update their details
        const updatedUser = await User.findOneAndUpdate(
            { registrationId: req.params.registrationId, role: "Student" },
            { name, phone, email },
            { new: true } // Returns the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.status(200).json({ message: "Profile updated successfully!", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- GET ALL STUDENTS FOR BULK ATTENDANCE ---
router.get('/students', verifyToken, async (req, res) => {
    try {
        const { department, semester } = req.query; // Look for query parameters
        
        // Build the filter securely
        let queryFilter = { role: 'Student' };
        if (department) queryFilter.department = department;
        if (semester) queryFilter.semester = semester;

        const students = await User.find(queryFilter)
            .select('name registrationId _id')
            .sort({ registrationId: 1 });
            
        res.status(200).json({ students });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



export default router;