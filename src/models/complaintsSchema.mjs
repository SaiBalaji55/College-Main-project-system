import mongoose from "mongoose";

const complaintsSchema = new mongoose.Schema({
    // id:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:'User',
    //     required:true
    // },
    subject:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:['Pending','Resolved','Rejected'],
        default:'Pending'
    }
},
{
    timestamps:true
})

const Complaints = mongoose.model("Complaints", complaintsSchema);
export default Complaints;