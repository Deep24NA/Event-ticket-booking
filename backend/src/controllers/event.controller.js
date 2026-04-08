import Event from "../models/event.model.js";

// 1. Create a new event (You will use Postman for this)
export const createEvent = async (req, res) => {
    try {
        const { title, description, date, location, price, availableSeats } = req.body;

        // Basic validation
        if (!title || !description || !date || !location || !price === undefined || !availableSeats === undefined) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const event = await Event.create({
            title,
            description,
            date,
            location,
            price,
            availableSeats
        });

        res.status(201).json({
            message: "Event created successfully",
            event
        });
    } catch (error) {
        console.error("Create Event Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 2. Fetch all events (For the React frontend)
export const getAllEvents = async (req, res) => {
    try {
        
        const events = await Event.find().sort({ date: 1 });
        
        res.status(200).json({
            count: events.length,
            events
        });
    } catch (error) {
        console.error("Get Events Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 3. Fetch a single event by ID
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json({ event });
    } catch (error) {
        console.error("Get Event Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};