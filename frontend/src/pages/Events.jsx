import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const tabs = [
  { key: "upcoming", label: "Upcoming" },
  { key: "trending", label: "🔥 Trending" },
  { key: "myEvents", label: "My Tickets" },
  { key: "history", label: "History" },
];

export default function Events() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [eventHistory, setEventHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const trendingEvents = [];

  // "View Ticket" panel state
  const [expandedEventId, setExpandedEventId] = useState(null);


  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const eventsRes = await api.get("/events");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setUpcomingEvents(
        (eventsRes.data.events || []).filter((e) => new Date(e.date) >= today)
      );

      const bookingsRes = await api.get("/booking/my-tickets");

      // Group active bookings by event ID, summing ticket counts
      const bookingsByEvent = {};
      (bookingsRes.data.bookings || []).forEach((b) => {
        const eventId = b.eventId?._id;
        if (!eventId) return;
        if (bookingsByEvent[eventId]) {
          bookingsByEvent[eventId].ticketCount += b.ticketCount;
          bookingsByEvent[eventId].bookingIds.push(b._id);
        } else {
          bookingsByEvent[eventId] = {
            ...b.eventId,
            bookingId: b._id,
            bookingIds: [b._id],
            ticketCount: b.ticketCount,
            status: b.status,
          };
        }
      });
      setMyEvents(Object.values(bookingsByEvent));

      setEventHistory(
        (bookingsRes.data.history || []).map((b) => ({
          ...b.eventId,
          bookingId: b._id,
          ticketCount: b.ticketCount,
          status: b.status,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
  };

  const getActiveData = () => {
    switch (activeTab) {
      case "upcoming": return upcomingEvents;
      case "trending": return trendingEvents;
      case "myEvents": return myEvents;
      case "history": return eventHistory;
      default: return upcomingEvents;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const data = getActiveData();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discover Events</h1>
        <p className="text-gray-500 text-sm mt-1">Find and book tickets for events near you.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setExpandedEventId(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium text-gray-600">No events found</p>
          <p className="text-sm mt-1">Check back later for more events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((event) => {
            const cardKey = event.bookingId || event._id;
            const isExpanded = expandedEventId === cardKey;

            return (
              <div
                key={cardKey}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Event Image (Upcoming / Trending only) */}
                {(activeTab === "upcoming" || activeTab === "trending") && (
                  <img
                    src={event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80"}
                    alt={event.title}
                    className="w-full h-36 object-cover"
                  />
                )}

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{event.title}</h3>
                  <p className="text-xs text-gray-500 mb-0.5">📅 {new Date(event.date).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500 truncate">📍 {event.location}</p>

                  <div className="mt-2 flex items-center justify-between">
                    {event.price !== undefined && (
                      <span className="text-blue-600 font-bold text-sm">₹{event.price}</span>
                    )}
                    {event.ticketCount && (
                      <span className="text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        {event.ticketCount} owned
                      </span>
                    )}
                  </div>

                  {activeTab === "myEvents" ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        onClick={() => toggleExpand(cardKey)}
                        className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {isExpanded ? "Hide Details" : "View Ticket"}
                      </button>

                      {/* Expanded Ticket Details Panel */}
                      {isExpanded && (
                        <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-left">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ticket Details</p>
                          <div className="flex flex-col gap-1.5 text-sm text-gray-700">
                            <p><span className="font-medium">Event:</span> {event.title}</p>
                            <p><span className="font-medium">Date:</span> {new Date(event.date).toLocaleString()}</p>
                            <p><span className="font-medium">Venue:</span> {event.location}</p>
                            <p><span className="font-medium">Tickets:</span> {event.ticketCount}</p>
                            <p><span className="font-medium">Price/ticket:</span> ₹{event.price}</p>
                            <p><span className="font-medium">Total Paid:</span> ₹{event.price * event.ticketCount}</p>
                            <p><span className="font-medium">Status:</span>{" "}
                              <span className="text-green-600 font-semibold">{event.status}</span>
                            </p>
                            {event.description && (
                              <p className="mt-1 text-gray-500 text-xs leading-relaxed border-t border-gray-200 pt-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Upcoming / History / Trending ── */
                    <button
                      onClick={() => {
                        if (activeTab === "upcoming") navigate(`/events/${event._id}`);
                      }}
                      className={`mt-3 w-full py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                        activeTab === "history"
                          ? "bg-gray-500 hover:bg-gray-600"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {activeTab === "history" ? "Leave a Review" : "Book Now"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}