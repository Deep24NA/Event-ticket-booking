import mongoose , {Schema} from "mongoose";

const eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        availableSeats: {
            type: Number,
            required: true,
            min: 0,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        location: {
            type: String,
            required: true,
        },
        // duration: {
        //     type: String,
        //     required: true,
        // }
    },
    {timestamps: true},
);

const Event = mongoose.model("Event" , eventSchema);
export default Event;
