import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const verifyJWT = async (req, res, next) => {
    try {

        // 1. Grab the token from the HTTP-only cookie OR the Authorization header (good for mobile apps)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized request: Please log in first" });
        }

        // 2. Decode the token using your secret key from .env
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN);
        
        // 3. Find the user in the database. 
        // We use .select() to remove the password and refreshToken so they don't accidentally leak.
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        if (!user) {
            return res.status(401).json({ message: "Invalid Access Token: User not found" });
        }

        // 4. Attach the safe user object to the request!
        req.user = user; 
        
        // 5. Tell Express to move on to the actual controller function
        next(); 

    } catch (error) {
        // If the token is expired or tampered with, jwt.verify will throw an error and land here
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}