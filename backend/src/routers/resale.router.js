import { Router } from "express";
import { createListing, placeBid, getMarketplace, acceptBid } from "../controllers/resale.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Route: GET /api/resale (Anyone logged in can view the marketplace)
router.get("/", verifyJWT, getMarketplace);

// Route: POST /api/resale/list (Put a ticket up for auction)
router.post("/list", verifyJWT, createListing);

// Route: POST /api/resale/:listingId/bid (Bid on a ticket)
router.post("/:listingId/bid", verifyJWT, placeBid);

// Route: POST /api/resale/:listingId/accept (Owner closes auction)
router.post("/:listingId/accept", verifyJWT, acceptBid);

export default router;