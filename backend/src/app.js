import express, { urlencoded , json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests from any localhost port (e.g. 5173, 5174, 3000)
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

app.use(urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(json({
    limit: "16kb",
}))

app.use(cookieParser());



// Routers
app.get("/", (req, res) => {
    res.send("Event Booking API is running successfully!");
});

import authRouter from "./routers/auth.router.js";
import eventRouter from "./routers/event.router.js";
import bookingRouter from "./routers/bookings.router.js";
import resaleRouter from "./routers/resale.router.js";

app.use("/api/users" , authRouter);
app.use("/api/events" , eventRouter);
app.use("/api/booking" , bookingRouter);
app.use("/api/resale", resaleRouter);




export default app;