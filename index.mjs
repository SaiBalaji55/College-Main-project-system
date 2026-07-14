import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userRoutes from './src/routes/authRoutes.mjs';
import attendanceRoutes from './src/routes/attendanceRoutes.mjs';
import complaintRoutes from './src/routes/complaintRoutes.mjs';
import staffAttendanceRoutes from './src/routes/staffattendanceRoutes.mjs';
import examMarkRoutes from './src/routes/examMarkRoutes.mjs';
import timetableRoutes from './src/routes/timetableRoutes.mjs';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI).then(()=>{
    console.log("Connected to MongoDB");
}).catch((err)=>{
    console.log(err);
});

app.use('/auth', userRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/staff-attendance', staffAttendanceRoutes);
app.use('/complaint', complaintRoutes);
app.use('/exam-marks', examMarkRoutes);
app.use('/timetable', timetableRoutes);


app.get('/',(req,res)=>{
    res.send("College Portal API is running...")
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});