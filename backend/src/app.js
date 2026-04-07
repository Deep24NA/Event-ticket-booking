import express, { urlencoded , json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(json({
    limit: "16kb",
}))



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


app.use(cookieParser());


export default app;