import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Navbar from './components/Navbar';
import Dashboard from './pages/DashBoard';
import Events from './pages/Events';
import Marketplace from './pages/MarketPlace';
import ResaleDetails from './pages/ResaleDetails';
import EventDetails from './pages/EventDetails';
import React from 'react';

const mapper = [
  { id: 0, path: "/", comp: <Auth /> },
  { id: 1, path: "/dashboard", comp: <Dashboard /> },
  { id: 2, path: "/marketplace", comp: <Marketplace /> },
  { id: 3, path: "/marketplace/:listingId", comp: <ResaleDetails /> },
  { id: 4, path: "/events", comp: <Events /> },
  { id: 5, path: "/events/:eventId", comp: <EventDetails /> },
];

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            {mapper.map((item) => (
              <Route key={item.id} path={item.path} element={item.comp} />
            ))}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;