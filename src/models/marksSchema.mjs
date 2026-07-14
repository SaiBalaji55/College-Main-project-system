import mongoose from "mongoose";

const marksSchema = new mongoose.Schema({
    registrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examType: {
        type: String,
        enum: ['Internal 1', 'Internal 2', 'Model Exam'], // Restricts the input to exactly these exams
        required: true
    },
    subject: {
        type: String,
        required: true // e.g., "Data Structures", "Computer Networks"
    },
    marksObtained: {
        type: Number,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true // Usually 50 or 100
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Records which Staff member entered the grades
    }
}, { 
    timestamps: true 
});

export default mongoose.model("Mark", marksSchema);