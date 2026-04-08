import Booking from "../models/booking.model.js";
import Event from "../models/event.model.js";
import ResaleList from "../models/resale.model.js";
import User from "../models/user.model.js"
import { sendNotification } from "../utils/notifcation.js"

export const bookTicket = async (req, res) => {
    try {
        const { eventId, ticketCount } = req.body;
        const userId = req.user._id; 

        if (!eventId || !ticketCount || ticketCount < 1) {
            return res.status(400).json({ message: "Valid Event ID and ticket count are required" });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.availableSeats < ticketCount) {
            return res.status(400).json({ 
                message: `Booking failed. Only ${event.availableSeats} seats remaining for this event.` 
            });
        }

        const booking = await Booking.create({
            userId,
            eventId,
            ticketCount,
            totalAmount: event.price * ticketCount 
        });

        event.availableSeats -= ticketCount;
        await event.save();

        try {
            // Find the user who just booked the ticket
            const user = await User.findById(userId);
            
            if (user && user.fcmToken) {
                const title = "Booking Confirmed! 🎉";
                const body = `You are going to ${event.title}! Your ${ticketCount} ticket(s) are secured.`;
                
                // Send it in the background
                sendNotification(user.fcmToken, title, body);
            }
        } catch (notifyError) {
            console.error("Non-fatal: Notification failed", notifyError);
        }

        // Return the response to the frontend
        return res.status(201).json({
            message: "Tickets booked successfully!",
            booking
        });


    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all bookings for the logged-in user
export const getMyBookings = async (req, res) => {
    try {
        const userId = req.user._id;

        const bookings = await Booking.find({ userId })
            .populate("eventId", "title date location price image")
            .sort({ createdAt: -1 });

        const currentDate = new Date();

        // Find all tickets this user has actively listed on resale
        const activeListings = await ResaleList.find({ ownerId: userId, status: "active" });
        const listedTicketMap = new Map(activeListings.map(l => [l.ticketId.toString(), l._id.toString()]));

        // Split them up so your Frontend tabs (My Tickets vs History) work perfectly!
        const activeBookings = bookings
            .filter(b => {
                const eventDate = new Date(b.eventId?.date);
                return b.status === "Booked" && eventDate >= currentDate;
            })
            .map(b => ({
                ...b.toObject(),
                isListedForResale: listedTicketMap.has(b._id.toString()),
                listingId: listedTicketMap.get(b._id.toString()) || null,
            }));
        
        const historyBookings = bookings.filter(b => {
            const eventDate = new Date(b.eventId?.date);
            return b.status === "Cancelled" || b.status === "Attended" || (b.status === "Booked" && eventDate < currentDate);
        });

        return res.status(200).json({
            message: "Bookings fetched successfully",
            bookings: activeBookings,
            history: historyBookings
        });
    } catch (error) {
        console.error("Fetch Bookings Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
