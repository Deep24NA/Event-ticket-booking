import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ResaleDetails() {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingRes, profileRes] = await Promise.all([
          api.get(`/resale/${listingId}`),
          api.get("/users/profile"),
        ]);
        setListing(listingRes.data.listing);
        setCurrentUserId(profileRes.data.user._id);
      } catch (err) {
        setFeedback({
          message: err.response?.data?.message || "Failed to load listing.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [listingId]);

  const refreshListing = async () => {
    try {
      const res = await api.get(`/resale/${listingId}`);
      setListing(res.data.listing);
    } catch {
      // silently ignore refresh errors
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ message: "", type: "" });

    const minBid = listing.highestBid > 0 ? listing.highestBid : listing.basePrice;
    if (Number(bidAmount) <= minBid) {
      return setFeedback({ message: `Your bid must be higher than ₹${minBid}`, type: "error" });
    }

    try {
      await api.post(`/resale/${listingId}/bid`, { bidAmount: Number(bidAmount) });
      setFeedback({ message: "Bid placed successfully!", type: "success" });
      setBidAmount("");
      await refreshListing();
    } catch (err) {
      setFeedback({ message: err.response?.data?.message || "Something went wrong.", type: "error" });
    }
  };

  const handleAcceptDeal = async () => {
    const topBid = listing?.bids?.length
      ? [...listing.bids].sort((a, b) => b.amount - a.amount)[0]
      : null;
    if (!topBid) return;

    const bidderName = topBid.userId?.fullname || "the highest bidder";
    if (!window.confirm(`Fix the deal with ${bidderName} for ₹${topBid.amount}?\n\nThis will transfer the ticket and close the auction.`)) return;

    setAcceptLoading(true);
    setFeedback({ message: "", type: "" });
    try {
      const res = await api.post(`/resale/${listingId}/accept`);
      setFeedback({ message: res.data.message || "Deal fixed! Ticket transferred.", type: "success" });
      setTimeout(() => navigate("/marketplace"), 2000);
    } catch (err) {
      setFeedback({ message: err.response?.data?.message || "Failed to accept bid.", type: "error" });
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleCancelListing = async () => {
    if (!window.confirm("Are you sure you want to remove this ticket from the marketplace?\n\nAll bids will be cancelled and the ticket will return to your dashboard.")) return;
    setCancelLoading(true);
    setFeedback({ message: "", type: "" });
    try {
      const res = await api.delete(`/resale/${listingId}/cancel`);
      setFeedback({ message: res.data.message || "Listing cancelled.", type: "success" });
      // Update local state so all UI reflects cancelled immediately
      setListing(prev => ({ ...prev, status: "cancelled" }));
    } catch (err) {
      setFeedback({ message: err.response?.data?.message || "Failed to cancel listing.", type: "error" });
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const event = listing?.ticketId?.eventId;
  const seller = listing?.ownerId;
  const currentHighestBid = listing?.highestBid > 0 ? listing?.highestBid : listing?.basePrice;
  const isOwner = currentUserId && seller?._id === currentUserId;
  const isCancelled = listing?.status === "cancelled";
  const isSold = listing?.status === "sold";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium mb-5">
        ← Back to Marketplace
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Event Info Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 mb-1 flex items-center flex-wrap gap-2">
                <span>{event?.title || "Event"}</span>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  🎟️ {listing?.ticketId?.ticketCount} ticket{listing?.ticketId?.ticketCount > 1 ? 's' : ''}
                </span>
              </h1>
              <div className="flex flex-col gap-0.5 text-sm text-gray-500">
                <span>👤 Seller: <span className="font-medium text-gray-700">{seller?.fullname || "Anonymous"}</span>
                  {isOwner && <span className="ml-1 text-xs text-blue-600 font-semibold">(You)</span>}
                </span>
                <span>📅 {new Date(event?.date).toLocaleString()}</span>
                <span>📍 {event?.location}</span>
              </div>
            </div>
            <div className="shrink-0 text-right bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-500 font-semibold uppercase mb-1">Highest Bid</p>
              <p className="text-3xl font-bold text-blue-700">₹{currentHighestBid}</p>
              <p className="text-xs text-gray-400 mt-1">Base: ₹{listing?.basePrice}</p>
            </div>
          </div>
        </div>

        {/* Bid History */}
        <div className={`p-5 ${isOwner ? '' : 'border-b border-gray-100'}`}>
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">
            Bid History
            {listing?.bids?.length > 0 && (
              <span className="ml-2 text-xs text-gray-400 font-normal">({listing.bids.length} bid{listing.bids.length > 1 ? 's' : ''})</span>
            )}
          </h2>
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {!listing?.bids || listing.bids.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 italic text-center">
                {isOwner ? "No bids on your listing yet." : "No bids yet. Be the first!"}
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {[...listing.bids].reverse().map((bid, index) => (
                  <div key={bid._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{bid.userId?.fullname || "User"}</p>
                      <p className="text-xs text-gray-400">{new Date(bid.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`text-sm font-bold ${index === 0 ? "text-green-600" : "text-gray-500"}`}>
                      ₹{bid.amount}
                      {index === 0 && <span className="ml-1 text-xs text-green-500">↑ Top</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cancelled / Sold Banner - shown to everyone when not active */}
        {(isCancelled || isSold) && (
          <div className={`p-5 text-center border-t ${
            isCancelled ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"
          }`}>
            <p className="text-2xl mb-2">{isCancelled ? "🚫" : "✅"}</p>
            <p className={`font-bold text-lg ${
              isCancelled ? "text-red-700" : "text-green-700"
            }`}>
              {isCancelled ? "Listing Cancelled" : "Auction Closed — Ticket Sold"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isCancelled
                ? "The seller has removed this ticket from the marketplace. This auction is no longer available."
                : "The seller has accepted a bid and transferred the ticket to the buyer."}
            </p>
            <Link
              to="/marketplace"
              className="mt-4 inline-block px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition"
            >
              Browse Other Listings
            </Link>
          </div>
        )}

        {/* Place Bid / Owner Panel — only show when active */}
        {!isCancelled && !isSold && (
          isOwner ? (
            <div className="p-5 bg-gray-50 border-t border-gray-200">
              {feedback.message && (
                <div className={`mb-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  feedback.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {feedback.type === "success" ? "✓ " : "⚠ "}{feedback.message}
                </div>
              )}

              {listing?.bids?.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Top bidder: <span className="font-semibold text-gray-900">
                      {[...listing.bids].sort((a, b) => b.amount - a.amount)[0]?.userId?.fullname || "User"}
                    </span></span>
                    <span className="font-bold text-green-600">
                      ₹{[...listing.bids].sort((a, b) => b.amount - a.amount)[0]?.amount}
                    </span>
                  </div>
                  <button
                    onClick={handleAcceptDeal}
                    disabled={acceptLoading || cancelLoading}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-60 active:scale-[0.98]"
                  >
                    {acceptLoading ? "Processing..." : "🤝 Fix the Deal"}
                  </button>
                  <p className="text-xs text-gray-400 text-center">Accepting will transfer the ticket to the highest bidder and close this auction.</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center font-medium">
                  📋 No bids yet — once someone bids, you can fix the deal here.
                </p>
              )}

              {/* Revoke Listing Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelListing}
                  disabled={cancelLoading || acceptLoading}
                  className="w-full py-2.5 bg-white border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60 active:scale-[0.98]"
                >
                  {cancelLoading ? "Cancelling..." : "🗑 Revoke Listing"}
                </button>
                <p className="text-xs text-gray-400 text-center mt-1">This will remove the ticket from the marketplace and cancel all bids.</p>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-blue-600">
              <h2 className="font-semibold text-white mb-1">Place Your Bid</h2>
              <p className="text-blue-100 text-xs mb-4">Must be higher than ₹{currentHighestBid}</p>

              {feedback.message && (
                <div className={`mb-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  feedback.type === "success"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}>
                  {feedback.type === "success" ? "✓ " : "⚠ "}{feedback.message}
                </div>
              )}

              <form onSubmit={handleBidSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">₹</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-3 py-2 text-sm text-gray-900 font-medium bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition active:scale-95"
                >
                  Submit Bid
                </button>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
}