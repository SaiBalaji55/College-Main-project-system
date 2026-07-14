import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    department: {
        type: String,
        required: true // e.g., "Computer Science"
    },
    semester: {
        type: Number,
        required: true // e.g., 3, 4, 5
    },
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    period: {
        type: Number,
        required: true // e.g., 1, 2, 3, 4
    },
    timeSlot: {
        type: String,
        required: true // e.g., "09:00 AM - 10:00 AM"
    },
    subject: {
        type: String,
        required: true 
    },
    registrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Links to the Staff member teaching this period
        required: true
    }
}, { 
    timestamps: true 
});

export default mongoose.model("Timetable", timetableSchema);