import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { requestForToken } from "../services/firebase"


export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [resaleCount, setResaleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [sellingTicketId, setSellingTicketId] = useState(null);
  const [basePrice, setBasePrice] = useState("");
  const [sellMessage, setSellMessage] = useState("");



  useEffect(() => {
    const fetchUserAndSetupNotifications = async () => {
      try {
        // Fetch User Profile
        const res = await api.get("/users/profile");
        setUser(res.data.user);

        // 2. THE HANDSHAKE: Ask for permission and grab the token
        const token = await requestForToken();
        
        if (token) {
          // 3. Send the token to your brand new backend route!
          await api.patch("/users/fcm-token", { fcmToken: token });
          console.log("FCM Token synced with database!");
        }

      } catch (error) {
        console.error("Dashboard Error:", error);
      }
    };

    fetchUserAndSetupNotifications();
  }, []);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const profileRes = await api.get("/users/profile");
        setUser(profileRes.data.user);
        const bookingsRes = await api.get("/booking/my-tickets");
        const bookings = bookingsRes.data.bookings || [];

        // Group bookings by event so same-event tickets appear as one row
        const groupedByEvent = {};
        bookings.forEach((b) => {
          const eventId = b.eventId?._id;
          if (!eventId) return;
          if (groupedByEvent[eventId]) {
            groupedByEvent[eventId].ticketCount += b.ticketCount;
            groupedByEvent[eventId].bookingIds.push(b._id);
            // If any booking for this event is listed for resale, keep that info
            if (b.isListedForResale) {
              groupedByEvent[eventId].isListedForResale = true;
              groupedByEvent[eventId].listingId = b.listingId;
            }
          } else {
            groupedByEvent[eventId] = {
              ...b,
              bookingIds: [b._id],
            };
          }
        });
        setUpcomingEvents(Object.values(groupedByEvent));

        // Fetch resale count from marketplace (filtered by current user)
        const resaleRes = await api.get("/resale");
        const myListings = (resaleRes.data.listings || []).filter(
          (l) => l.ownerId?._id === profileRes.data.user._id
        );
        setResaleCount(myListings.length);
      } catch (error) {
        console.error("Not authenticated:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleSellClick = (ticketId) => {
    setSellingTicketId(ticketId);
    setSellMessage("");
    setBasePrice("");
  };

  const handleSellSubmit = async (e, ticketId, maxQty) => {
    e.preventDefault();
    const quantity = e.target.elements.quantity.value;
    try {
      await api.post("/resale/list", { ticketId, basePrice: Number(basePrice), quantity: Number(quantity) });
      setSellMessage("success");
      setTimeout(() => {
        setSellingTicketId(null);
        window.location.reload(); // Quick refresh to update the list of split tickets
      }, 1500);
    } catch (err) {
      setSellMessage(err.response?.data?.message || "Failed to list ticket.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.fullname?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your tickets.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Profile Card */}
        <div className="sm:col-span-2 bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
            {user?.fullname?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user?.fullname}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
              ✓ Verified
            </span>
          </div>
        </div>

        {/* Resale Card */}
        <div className="bg-blue-600 border border-blue-700 rounded-xl p-5 text-white flex flex-col justify-between">
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Active Resales</p>
          <div>
            <p className="text-4xl font-bold mt-2">{resaleCount}</p>
            <Link to="/marketplace" className="text-xs text-blue-200 hover:text-white transition mt-1 inline-block">
              View marketplace →
            </Link>
          </div>
        </div>
      </div>

      {/* Tickets Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Your Tickets</h2>
          <Link to="/events" className="text-sm text-blue-600 hover:underline font-medium">
            Browse events →
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="text-4xl mb-3">🎟️</div>
            <p className="font-medium text-gray-600">No tickets yet</p>
            <p className="text-sm mt-1">Browse upcoming events to book your first ticket!</p>
            <Link to="/events" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingEvents.map((booking) => (
              <div key={booking.eventId?._id || booking._id}>
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{booking.eventId?.title || "Event Ticket"}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      🎟️ {booking.ticketCount} ticket{booking.ticketCount > 1 ? 's' : ''}
                      <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        booking.status === 'Booked' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {booking.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {booking.status === "Booked" && (
                      booking.isListedForResale ? (
                        <Link
                          to={`/marketplace/${booking.listingId}`}
                          className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
                        >
                          🏷️ On Marketplace →
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleSellClick(booking._id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          Sell
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Sell Form */}
                {sellingTicketId === booking._id && (
                  <div className="mx-5 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-gray-800 mb-3">List on Marketplace</p>
                    {sellMessage === "success" ? (
                      <p className="text-sm font-semibold text-green-600">✓ Ticket listed successfully!</p>
                    ) : (
                      <>
                        {sellMessage && <p className="text-sm text-red-600 mb-2">{sellMessage}</p>}
                        <form onSubmit={(e) => handleSellSubmit(e, booking._id, booking.ticketCount)} className="flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            placeholder="Qty (Max: "
                            title={`Max: ${booking.ticketCount}`}
                            className="px-3 py-2 w-24 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min="1"
                            max={booking.ticketCount}
                            defaultValue={booking.ticketCount}
                            name="quantity"
                          />
                          <input
                            type="number"
                            placeholder="Base price (₹)"
                            value={basePrice}
                            onChange={e => setBasePrice(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min="0"
                          />
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
                            Confirm
                          </button>
                          <button type="button" onClick={() => setSellingTicketId(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                            Cancel
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}