import ResaleList from "../models/resale.model.js";
import Booking from "../models/booking.model.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { sendNotification } from "../utils/notifcation.js"

// 1. Create a new auction listing
export const createListing = async (req, res) => {
    try {
        const { eventId, basePrice, quantity } = req.body;
        // Fallback for older frontend client just in case
        let targetEventId = eventId;
        if (!targetEventId && req.body.ticketId) {
            const tempBooking = await Booking.findById(req.body.ticketId);
            if (!tempBooking) return res.status(404).json({ message: "Ticket not found." });
            targetEventId = tempBooking.eventId;
        }

        const ownerId = req.user._id;

        if (!targetEventId || basePrice === undefined || basePrice < 0) {
            return res.status(400).json({ message: "Valid event ID and base price are required." });
        }

        const sellQuantity = quantity ? Number(quantity) : 1;

        if (sellQuantity < 1) {
             return res.status(400).json({ message: "Must sell at least 1 ticket." });
        }

        // Find all unlisted bookings for this user and event
        const activeBookings = await Booking.find({ 
            userId: ownerId, 
            eventId: targetEventId, 
            isListedForResale: false, 
            status: "Booked" 
        });

        let totalAvailableTickets = 0;
        let totalPaid = 0;
        for (const b of activeBookings) {
            totalAvailableTickets += b.ticketCount;
            totalPaid += b.totalAmount;
        }

        if (sellQuantity > totalAvailableTickets) {
             return res.status(400).json({ message: `You only have ${totalAvailableTickets} unlisted tickets available for this event.` });
        }

        // We will create exactly one new booking to represent the resale listing
        // Average price per ticket calculation:
        const avgPricePerTicket = totalAvailableTickets > 0 ? (totalPaid / totalAvailableTickets) : 0;

        const resaleBooking = await Booking.create({
            userId: ownerId,
            eventId: targetEventId,
            ticketCount: sellQuantity,
            totalAmount: avgPricePerTicket * sellQuantity,
            status: "Booked",
            isListedForResale: true
        });

        // Now, deduct 'sellQuantity' from existing bookings
        let remainingToDeduct = sellQuantity;
        for (const b of activeBookings) {
            if (remainingToDeduct <= 0) break;

            if (b.ticketCount <= remainingToDeduct) {
                // Consume this entire booking
                remainingToDeduct -= b.ticketCount;
                await Booking.findByIdAndDelete(b._id);
            } else {
                // Need to partially consume this booking
                b.ticketCount -= remainingToDeduct;
                b.totalAmount -= (avgPricePerTicket * remainingToDeduct);
                remainingToDeduct = 0;
                await b.save();
            }
        }

        // Create the auction!
        const listing = await ResaleList.create({
            ticketId: resaleBooking._id,
            ownerId,
            basePrice,
            highestBid: 0, // Starts at 0 until someone bids
            status: "active"
        });

        return res.status(201).json({
            message: "Ticket successfully listed for auction!",
            listing
        });

    } catch (error) {
        console.error("Create Listing Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// 2. Place a bid on an active listing
export const placeBid = async (req, res) => {
    try {
        const { listingId } = req.params; // We will pass this in the URL
        const { bidAmount } = req.body;
        const bidderId = req.user._id;

        if (!bidAmount || bidAmount <= 0) {
            return res.status(400).json({ message: "Please provide a valid bid amount." });
        }

        // Find the listing
        const listing = await ResaleList.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found." });
        }

        // Rule 1: The auction must be active
        if (listing.status !== "active") {
            return res.status(400).json({ message: "This auction is closed or already sold." });
        }

        // Rule 2: Owners cannot bid on their own tickets to artificially inflate the price
        if (listing.ownerId.toString() === bidderId.toString()) {
            return res.status(403).json({ message: "You cannot bid on your own ticket." });
        }

        // Rule 3: The bid must beat the base price AND the current highest bid
        const minimumRequiredBid = Math.max(listing.basePrice, listing.highestBid);
        if (bidAmount <= minimumRequiredBid) {
            return res.status(400).json({ 
                message: `Your bid must be higher than ${minimumRequiredBid}` 
            });
        }

        // Add the bid to the array and update the highestBid record
        listing.bids.push({
            userId: bidderId,
            amount: bidAmount
        });
        
        listing.highestBid = bidAmount;

        // Save the updated listing to the database
        await listing.save();

        try {
            // Find the owner of the ticket being sold
            const owner = await User.findById(listing.ownerId);
            
            if (owner && owner.fcmToken) {
                const title = "New Bid Received! 💰";
                const body = `Someone just bid ₹${bidAmount} on your ticket!`;
                
                // Send it in the background to the SELLER
                sendNotification(owner.fcmToken, title, body);
            }
        } catch (notifyError) {
            console.error("Non-fatal: Notification failed", notifyError);
        }

        return res.status(200).json({
            message: "Bid placed successfully!",
            currentHighestBid: listing.highestBid
        });

    } catch (error) {
        console.error("Place Bid Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 3. View the Marketplace (See all active auctions)
export const getMarketplace = async (req, res) => {
    try {
        // Find all active listings. 
        // We use nested populate to get the Ticket info, AND the Event info inside that ticket!
        const listings = await ResaleList.find({ status: "active" })
            .populate({
                path: "ticketId",
                select: "eventId ticketCount", // Grab the booking details
                populate: { path: "eventId", select: "title date location image price" } // Grab the event details
            })
            .populate("ownerId", "fullname email")
            .populate("bids.userId", "fullname")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Marketplace fetched successfully",
            count: listings.length,
            listings
        });
    } catch (error) {
        console.error("Marketplace Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// 4. Accept the Highest Bid & Transfer Ownership
export const acceptBid = async (req, res) => {
    try {
        const { listingId } = req.params;
        const ownerId = req.user._id;

        // 1. Find the auction
        const listing = await ResaleList.findById(listingId);
        
        if (!listing) return res.status(404).json({ message: "Listing not found." });
        if (listing.status !== "active") return res.status(400).json({ message: "This auction is already closed." });
        
        // 2. Security: Only the owner can accept the bid!
        if (listing.ownerId.toString() !== ownerId.toString()) {
            return res.status(403).json({ message: "Only the owner can accept bids." });
        }

        // 3. Make sure there are actually bids to accept
        if (listing.bids.length === 0) {
            return res.status(400).json({ message: "No one has bid on this ticket yet." });
        }

        // 4. Find the winning bid (Sort the array highest to lowest and grab the first one)
        const sortedBids = [...listing.bids].sort((a, b) => b.amount - a.amount);
        const winningBid = sortedBids[0];

        // Extract the new owner's ID as a proper ObjectId
        const newOwnerId = new mongoose.Types.ObjectId(winningBid.userId.toString());

        // 5. Find the original Booking receipt
        const booking = await Booking.findById(listing.ticketId.toString());
        if (!booking) return res.status(404).json({ message: "Original ticket not found." });

        // --- THE MAGIC SWAP ---
        // 6. Transfer the ticket to the winning bidder by updating userId on the booking
        booking.userId = newOwnerId;
        await booking.save();

        // 7. Close the auction, update ownerId, and clear the isListedForResale flag
        listing.status = "sold";
        listing.ownerId = newOwnerId;
        await listing.save();

        // Clear the listing flag on the booking (now owned by new user)
        booking.isListedForResale = false;
        await booking.save();

        console.log(` Ticket ${listing.ticketId} transferred from ${ownerId} to ${newOwnerId} for ₹${winningBid.amount}`);

        return res.status(200).json({
            message: "Auction closed! Ticket successfully transferred to the new owner.",
            soldPrice: winningBid.amount,
            newOwnerId: newOwnerId
        });

    } catch (error) {
        console.error("Accept Bid Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 5. Get a single listing by ID
export const getListingById = async (req, res) => {
    try {
        const { listingId } = req.params;
        
        const listing = await ResaleList.findById(listingId)
            .populate({
                path: "ticketId",
                select: "eventId ticketCount",
                populate: { path: "eventId", select: "title date location image price" }
            })
            .populate("ownerId", "fullname email")
            .populate("bids.userId", "fullname");

        if (!listing) {
            return res.status(404).json({ message: "Listing not found." });
        }

        return res.status(200).json({
            message: "Listing fetched successfully",
            listing
        });

    } catch (error) {
        console.error("Get Listing Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 6. Cancel / Revoke a listing (owner only)
export const cancelListing = async (req, res) => {
    try {
        const { listingId } = req.params;
        const ownerId = req.user._id;

        const listing = await ResaleList.findById(listingId);
        if (!listing) return res.status(404).json({ message: "Listing not found." });
        if (listing.status !== "active") return res.status(400).json({ message: "This listing is already closed." });
        if (listing.ownerId.toString() !== ownerId.toString()) {
            return res.status(403).json({ message: "Only the owner can cancel this listing." });
        }

        // Mark the listing as cancelled
        listing.status = "cancelled";
        await listing.save();

        // Reset the booking's isListedForResale flag so it can be relisted
        await Booking.findByIdAndUpdate(listing.ticketId, { isListedForResale: false });

        return res.status(200).json({ message: "Listing cancelled. Your ticket has been removed from the marketplace." });

    } catch (error) {
        console.error("Cancel Listing Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};