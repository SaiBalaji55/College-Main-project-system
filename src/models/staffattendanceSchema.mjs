import mongoose from "mongoose";

const staffAttendanceSchema = new mongoose.Schema({
    registrationId: {
        type: String, // Changed to String to accommodate IDs like "CS2023-001"
        required: true,
        // unique: true
    },
    date: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'On Leave'], // Added 'On Leave' for staff
        required: true
    }
}, { 
    timestamps: true 
});
// In staffattendanceSchema.mjs
staffAttendanceSchema.index({ registrationId: 1, date: 1 }, { unique: true });
export default mongoose.model("StaffAttendance", staffAttendanceSchema);