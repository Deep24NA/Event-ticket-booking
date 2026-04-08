import { Router } from "express";
import { createEvent, getAllEvents, getEventById } from "../controllers/event.controller.js";

const router = Router();

// Route: POST /api/events/create
router.post("/create", createEvent);

// Route: GET /api/events
router.get("/", getAllEvents);

// Route: GET /api/events/:id
router.get("/:id", getEventById);

export default router;