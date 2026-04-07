import ResaleList from "../models/resale.model.js";
import Booking from "../models/booking.model.js";

// 1. Create a new auction listing
export const createListing = async (req, res) => {
    try {
        const { ticketId, basePrice } = req.body;
        const ownerId = req.user._id;

        if (!ticketId || basePrice === undefined || basePrice < 0) {
            return res.status(400).json({ message: "Valid ticket ID and base price are required." });
        }

        // Check if the user actually owns this booking
        const booking = await Booking.findById(ticketId);
        if (!booking) {
            return res.status(404).json({ message: "Ticket not found." });
        }

        if (booking.userId.toString() !== ownerId.toString()) {
            return res.status(403).json({ message: "You can only sell your own tickets." });
        }

        // Check if this ticket is ALREADY listed for sale
        const existingListing = await ResaleList.findOne({ ticketId, status: "active" });
        if (existingListing) {
            return res.status(400).json({ message: "This ticket is already listed on the marketplace." });
        }

        // Create the auction!
        const listing = await ResaleList.create({
            ticketId,
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
                populate: { path: "eventId", select: "title date location" } // Grab the event details
            })
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
        const winningBid = listing.bids.sort((a, b) => b.amount - a.amount)[0];

        // 5. Find the original Booking receipt
        const booking = await Booking.findById(listing.ticketId);
        if (!booking) return res.status(404).json({ message: "Original ticket not found." });

        // --- THE MAGIC SWAP ---
        // 6. Transfer the ticket to the winning bidder
        booking.userId = winningBid.userId;
        await booking.save();

        // 7. Close the auction
        listing.status = "sold";
        await listing.save();

        return res.status(200).json({
            message: "Auction closed! Ticket successfully transferred to the new owner.",
            soldPrice: winningBid.amount,
            newOwnerId: winningBid.userId
        });

    } catch (error) {
        console.error("Accept Bid Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};