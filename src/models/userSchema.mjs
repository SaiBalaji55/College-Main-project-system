import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    registrationId: {
        type: String, // Changed to String to accommodate IDs like "CS2023-001"
        required: true,
        unique: true
    },
    password: { // New field for the password
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true, // Automatically converts emails to lowercase
        trim: true       // Removes accidental spaces
    },
    role: {
        type: String,
        required: true,
        enum: ['Student', 'Staff', 'Admin'], // This is your condition! It strictly limits the roles.
        default: 'Student'
    },
    department: {
        type: String,
        required: function() { return this.role === 'Student'; } // Only required for students
    },
    semester: {
        type: Number,
        required: function() { return this.role === 'Student'; } // Only required for students
    },
    isFirstLogin: {
        type: Boolean,
        default: true // Every new user defaults to true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});


userSchema.pre("save", async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) return next();

    try {
        // Generate a salt and hash the password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        // next();
    } catch (error) {
        // next(error);
        throw new Error(error.message);
    }
});

const User = mongoose.model("User", userSchema);
export default User;