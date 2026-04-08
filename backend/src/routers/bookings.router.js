import { Router } from "express";
import { bookTicket, getMyBookings } from "../controllers/booking.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();


router.post("/", verifyJWT, bookTicket);
router.get("/my-tickets", verifyJWT, getMyBookings);


export default router;