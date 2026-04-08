import User from "../models/user.model.js";
import { validateEmail, validatePassword, validatePhoneNumber } from "../utils/validator.js"; 
import Booking from "../models/booking.model.js";


// --- THE HELPER FUNCTION ---
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Attach the refresh token to the user and save it
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new Error("Something went wrong while generating tokens");
    }
};

// Standardized cookie options for security
const cookieOptions = {
    httpOnly: true, // Prevents JavaScript (XSS) from reading the cookie
//    secure: process.env.NODE_ENV === "production" // Only sends over HTTPS in production
};

export const registerUser = async (req, res) => {
    try {
        const { fullname, email, password, phoneno, age } = req.body;

        if (!fullname || !email || !password || !phoneno || age === undefined) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (typeof age !== "number" || age < 1 ) {
            return res.status(400).json({ message: "Age must be a valid number greater than 0" });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: "Please provide a valid email address format" });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError }); 
        }

        // 2. Add the phone number validation check!
        if (!validatePhoneNumber(phoneno)) {
            return res.status(400).json({ message: "Phone number must be a valid Indian format" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const user = await User.create({
            fullname,
            email,
            password,
            age,
            phoneno,
        });

        // 🚨 THE FIX IS HERE 🚨
        // Generate the tokens using the helper function you wrote!
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        // Fetch the created user again to remove the password and refresh token from the response
        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        // Send the response WITH the cookies attached!
        return res.status(201)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json({
                message: "User registered and logged in successfully",
                user: createdUser,
                accessToken 
            });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // --- NEW: Use the helper to generate tokens and set cookies ---
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        return res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json({
                message: "User logged in successfully",
                user: loggedInUser,
                accessToken
            });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getUserProfile = async (req, res) => {
    try {
        // 1. Get the logged-in user (Attached by your verifyJWT middleware!)
        const user = req.user;

        // 2. Find all bookings that belong to this user
        // We use .populate() to grab the actual Event data instead of just getting the Event ID back
        const myTickets = await Booking.find({ userId: user._id })
            .populate("eventId", "title date location price") // Only grab the fields we need to display
            .sort({ createdAt: -1 }); // Newest bookings first

        // 3. Send back the combined dashboard data
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneno: user.phoneno
            },
            totalTickets: myTickets.length,
            tickets: myTickets
        });

    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const logoutUser = async (req, res) => {
    // We use the exact same options we used to create the cookie
    const options = {
        httpOnly: true,
        // secure: true // (Keep this commented out for localhost!)
    };

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({ message: "User logged out successfully" });
};

// Save the Firebase Device Token
export const updateFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user._id;

        if (!fcmToken) return res.status(400).json({ message: "Token is required" });

        // Find the user and update their token
        await User.findByIdAndUpdate(userId, { fcmToken });

        res.status(200).json({ message: "Notification token saved successfully" });
    } catch (error) {
        console.error("Save FCM Token Error:", error);
        res.status(500).json({ message: "Failed to save token" });
    }
};