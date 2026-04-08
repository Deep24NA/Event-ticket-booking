import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        ticketCount: {
            type: Number,
            required: true,
            min: [1, "Must book at least 1 ticket"],
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Booked", "Cancelled", "Attended",], // "Attended" goes to the History tab!
            default: "Booked",
        },
        isListedForResale: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);