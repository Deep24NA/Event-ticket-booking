import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketCount, setTicketCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${eventId}`);
        setEvent(res.data.event);
      } catch (error) {
        console.error("Failed to fetch event:", error);
        alert("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleBook = async () => {
    if (ticketCount <= 0) return alert("Please enter a valid ticket count.");
    if (ticketCount > event.availableSeats) return alert(`Only ${event.availableSeats} seats available.`);

    setBookingLoading(true);
    try {
      await api.post("/booking", { eventId: event._id, ticketCount });
      alert("🎟️ Ticket booked successfully!");
      navigate("/events", { state: { tab: "myEvents" } });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to book ticket");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-lg font-bold text-gray-700">Event not found</p>
        <Link to="/events" className="text-blue-600 text-sm hover:underline">← Back to Events</Link>
      </div>
    );
  }

  const totalPrice = event.price * ticketCount;
  const soldOut = event.availableSeats === 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link to="/events" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium mb-5">
        ← Back to Events
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="md:flex">
          {/* Image */}
          <div className="md:w-2/5 bg-gray-100 shrink-0">
            <img
              src={event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"}
              alt={event.title}
              className="w-full h-56 md:h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>

              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📅</span>
                  <span className="font-medium text-gray-800">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📍</span>
                  <span className="font-medium text-gray-800">{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🎟️</span>
                  <span className="font-medium text-gray-800">{event.availableSeats} seats available</span>
                </div>
              </div>

              {event.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4 bg-gray-50 border border-gray-100 rounded-lg p-3">
                  {event.description}
                </p>
              )}

              <p className="text-2xl font-bold text-blue-600 mb-1">
                ₹{event.price} <span className="text-sm font-normal text-gray-400">/ ticket</span>
              </p>
            </div>

            {/* Booking Widget */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Select Tickets</p>
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => ticketCount > 1 && setTicketCount(t => t - 1)}
                  disabled={ticketCount <= 1}
                  className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 font-bold hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 transition"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-900 w-8 text-center">{ticketCount}</span>
                <button
                  onClick={() => ticketCount < event.availableSeats && setTicketCount(t => t + 1)}
                  disabled={ticketCount >= event.availableSeats}
                  className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 font-bold hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 transition"
                >
                  +
                </button>
                <span className="text-sm text-gray-500 ml-2">
                  Total: <span className="font-bold text-gray-900">₹{totalPrice}</span>
                </span>
              </div>

              <button
                onClick={handleBook}
                disabled={bookingLoading || soldOut}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-60 text-sm"
              >
                {bookingLoading
                  ? "Booking..."
                  : soldOut
                  ? "Sold Out"
                  : `Confirm Booking • ₹${totalPrice}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
