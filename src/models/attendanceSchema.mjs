import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    date:{
        type:Date,
        required:true
    },
    studentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:['Present','Absent'],
        default:'Absent'
    },
    markedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},
{
    timestamps:true
})

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;