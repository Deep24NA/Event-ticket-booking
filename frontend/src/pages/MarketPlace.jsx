import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const [showSellModal, setShowSellModal] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [sellLoading, setSellLoading] = useState(false);
  const [sellMessage, setSellMessage] = useState({ text: "", type: "" });

  const fetchMarketplace = async () => {
    try {
      const [res, profileRes] = await Promise.all([
        api.get("/resale"),
        api.get("/users/profile"),
      ]);
      setListings(res.data.listings || []);
      setCurrentUserId(profileRes.data.user._id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load marketplace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const openSellModal = async () => {
    setShowSellModal(true);
    setSellLoading(true);
    setSellMessage({ text: "", type: "" });
    setSelectedTicketId(""); // This will now hold an eventId instead of ticketId string
    setBasePrice("");

    try {
      const res = await api.get("/booking/my-tickets");
      const bookings = res.data.bookings || [];

      // Group bookings by event
      const groupedByEvent = {};
      bookings.forEach((b) => {
        const eventId = b.eventId?._id;
        if (!eventId) return;
        if (b.isListedForResale) return; // Don't list tickets already on resale

        if (groupedByEvent[eventId]) {
          groupedByEvent[eventId].ticketCount += b.ticketCount;
        } else {
          groupedByEvent[eventId] = { ...b, eventId: eventId, eventObj: b.eventId };
        }
      });
      setMyTickets(Object.values(groupedByEvent));
    } catch {
      setSellMessage({ text: "Failed to load your tickets.", type: "error" });
    } finally {
      setSellLoading(false);
    }
  };

  const handleSellConfirm = async (e) => {
    e.preventDefault();
    if (!selectedTicketId || !basePrice) return;
    
    const quantity = e.target.elements.quantity.value;

    setSellLoading(true);
    try {
      // selectedTicketId is an event._id string
      await api.post("/resale/list", { eventId: selectedTicketId, basePrice: Number(basePrice), quantity: Number(quantity) });
      setSellMessage({ text: "Ticket listed successfully!", type: "success" });
      setTimeout(() => {
        setShowSellModal(false);
        fetchMarketplace();
      }, 1500);
    } catch (err) {
      setSellMessage({ text: err.response?.data?.message || "Failed to list ticket.", type: "error" });
    } finally {
      setSellLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Ticket Auctions</h1>
          <p className="text-gray-500 text-sm mt-1">Bid on sold-out events or list your own ticket.</p>
        </div>
        <button
          onClick={openSellModal}
          className="shrink-0 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          + Sell My Ticket
        </button>
      </div>

      {/* Sell Modal */}
      {showSellModal && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">List a Ticket for Sale</h2>
            <button onClick={() => setShowSellModal(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>

          <div className="px-5 py-4">
            {sellMessage.text && (
              <div className={`mb-4 px-3 py-2 rounded-lg text-sm font-medium ${
                sellMessage.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {sellMessage.text}
              </div>
            )}

            {sellLoading && !myTickets.length && !sellMessage.text ? (
              <p className="text-sm text-gray-500 animate-pulse">Loading your tickets...</p>
            ) : myTickets.length === 0 && !sellMessage.text ? (
              <p className="text-sm text-gray-500 italic">You don't have any valid unlisted tickets to sell.</p>
            ) : (
              <form onSubmit={handleSellConfirm} className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-48">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Select Event</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedTicketId}
                    onChange={(e) => setSelectedTicketId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Choose an event...</option>
                    {myTickets.map(ticket => (
                      <option key={ticket.eventId} value={ticket.eventId}>
                        {ticket.eventObj?.title || "Event"} — {ticket.ticketCount} ticket(s) total
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max={myTickets.find(t => t.eventId === selectedTicketId)?.ticketCount || 1}
                    defaultValue="1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!selectedTicketId}
                  />
                </div>

                <div className="w-40">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sellLoading}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition disabled:opacity-60"
                >
                  {sellLoading ? "Listing..." : "Confirm Listing"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Listing Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 font-medium">{error}</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="font-medium text-gray-600">No listings yet</p>
          <p className="text-sm mt-1">Be the first to list a ticket!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((item) => {
            const event = item.ticketId?.eventId;
            const highestBid = item.highestBid > 0 ? item.highestBid : item.basePrice;
            const isOwn = currentUserId && item.ownerId?._id === currentUserId;
            return (
              <div key={item._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <img
                  src={event?.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80"}
                  alt={event?.title || "Event"}
                  className="w-full h-32 object-cover"
                />

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                      {event?.title || "Event Tickets"} <span className="text-gray-500 font-normal">({item.ticketId?.ticketCount} ticket{item.ticketId?.ticketCount > 1 ? 's' : ''})</span>
                    </h3>
                    <span className="shrink-0 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded animate-pulse">
                      LIVE
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-3">
                    Seller: {item.ownerId?.fullname || "Anonymous"}
                    {isOwn && <span className="ml-1 text-blue-600 font-semibold">(You)</span>}
                  </p>

                  <div className="flex items-end justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase">Base</p>
                      <p className="text-sm font-semibold text-gray-700">₹{item.basePrice}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-500 font-medium uppercase">Highest Bid</p>
                      <p className="text-xl font-bold text-blue-700">₹{highestBid}</p>
                    </div>
                  </div>

                  <Link
                    to={`/marketplace/${item._id}`}
                    className={`w-full text-center py-2 text-sm font-semibold rounded-lg transition-colors ${
                      isOwn
                        ? "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isOwn ? "View Bids" : "View & Place Bid"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}