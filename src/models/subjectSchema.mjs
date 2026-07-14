import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true // e.g., "Data Structures"
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true // e.g., "CS101" - forces uppercase for consistency
    },
    credits: {
        type: Number,
        required: true,
        default: 3 // Standard college credit format
    },
    department: {
        type: String,
        required: true // e.g., "Computer Science"
    }
}, {
    timestamps: true
});

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;