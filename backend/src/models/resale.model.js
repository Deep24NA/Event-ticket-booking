// src/models/resale.model.js
import mongoose, { Schema } from "mongoose";

// The subdocument for individual bids
const bidSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        }
    },
    // FIX: Let Mongoose handle the timestamps automatically!
    { timestamps: true } 
);

const resaleListingSchema = new Schema(
    {
        ticketId: { // Note: This links to the Booking model!
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true, 
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        basePrice: {
            type: Number,
            required: true,
            min: 0,
        },
        highestBid: {
            type: Number,
            default: 0, // UPGRADE: Starts at 0 until someone bids
            min: 0,
        },
        bids: [bidSchema], // Your awesome subdocument array!
        
        // UPGRADE: We need to know if the auction is still running
        status: {
            type: String,
            enum: ["active", "sold", "cancelled"],
            default: "active"
        }
    },
    { timestamps: true }
);

const ResaleList = mongoose.model("ResaleList", resaleListingSchema);
export default ResaleList;