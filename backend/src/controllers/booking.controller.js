import Booking from "../models/booking.model.js";
import Event from "../models/event.model.js";

export const bookTicket = async (req, res) => {
    try {
        const { eventId, ticketCount } = req.body;
        
        // We securely get the user ID from our verifyJWT middleware!
        const userId = req.user._id; 

        // 1. Basic Validation
        if (!eventId || !ticketCount || ticketCount < 1) {
            return res.status(400).json({ message: "Valid Event ID and ticket count are required" });
        }

        // 2. Find the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // 3. Check seat availability
        if (event.availableSeats < ticketCount) {
            return res.status(400).json({ 
                message: `Booking failed. Only ${event.availableSeats} seats remaining for this event.` 
            });
        }

        // 4. Create the booking record
        const booking = await Booking.create({
            userId,
            eventId,
            ticketCount,
            totalPrice: event.price * ticketCount // Calculate total cost automatically!
        });

        // 5. Deduct the seats from the event and save it
        event.availableSeats = event.availableSeats-ticketCount;
        await event.save();

        // 6. Send Success Response
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

        // Find bookings and populate the Event details (title, date, location) so the frontend has everything it needs to draw a ticket
        const bookings = await Booking.find({ userId })
            .populate("eventId", "title date location price")
            .sort({ createdAt: -1 }); // Sort by newest first

        return res.status(200).json({
            message: "Bookings fetched successfully",
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error("Fetch Bookings Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Cancel a booking
export const cancelBooking = async (req, res) => {
    try {
        // We will pass the booking ID in the URL (e.g., /api/bookings/12345)
        const { bookingId } = req.params; 
        const userId = req.user._id;

        // 1. Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // 2. SECURITY CHECK: Ensure the logged-in user actually owns this booking!
        // We use .toString() because MongoDB IDs are special objects, not plain strings
        if (booking.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to cancel this ticket" });
        }

        // 3. Find the event and give the seats back
        const event = await Event.findById(booking.eventId);
        if (event) {
            event.availableSeats += booking.ticketCount;
            await event.save();
        }

        // 4. Delete the booking from the database
        await Booking.findByIdAndDelete(bookingId);

        return res.status(200).json({
            message: "Ticket cancelled and seats refunded successfully!"
        });

    } catch (error) {
        console.error("Cancel Booking Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};