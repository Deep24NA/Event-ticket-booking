import { Router } from "express";
import { bookTicket, cancelBooking, getMyBookings } from "../controllers/booking.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();


router.post("/", verifyJWT, bookTicket);
router.get("/my-tickets" , getMyBookings);
router.delete("/:bookingId" , cancelBooking);

export default router;