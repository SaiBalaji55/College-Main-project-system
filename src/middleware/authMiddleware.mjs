import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    // 1. Check if the Authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    // 2. Extract the token from the "Bearer <token>" string
    const token = authHeader.split(" ")[1];

    try {
        // 3. Verify the token is real and hasn't expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Attach the user data (including their role) to the request so the route can use it
        req.user = decoded; 
        
        // 5. Allow the request to continue to the route
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};