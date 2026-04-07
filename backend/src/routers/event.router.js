import { Router } from "express";
import { createEvent, getAllEvents } from "../controllers/event.controller.js";

const router = Router();

// Route: POST /api/events/create
router.post("/create", createEvent);

// Route: GET /api/events
router.get("/", getAllEvents);

export default router;