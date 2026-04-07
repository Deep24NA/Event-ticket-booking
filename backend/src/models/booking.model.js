import mongoose, {Schema} from "mongoose";

const bookingSchema = new Schema (
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
            min: 0,
        },
    },
    {timestamps: true},
);

const Booking = mongoose.model("Booking" , bookingSchema);
export default Booking;