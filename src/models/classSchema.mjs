import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true // e.g., "B.Tech CS 2nd Year Section A"
    },
    department: {
        type: String,
        required: true // e.g., "Computer Science"
    },
    semester: {
        type: Number,
        required: true // e.g., 3, 4, 5
    },
    batchYear: {
        type: String,
        required: true // e.g., "2024-2028" so you know when they graduate
    }
}, {
    timestamps: true
});

const Class = mongoose.model("Class", classSchema);
export default Class;