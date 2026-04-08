# EventTix: Event Booking & Resale Marketplace 🎟️✨

EventTix is a full-stack, highly secure event ticketing and secondary marketplace platform. It goes beyond standard event booking by offering a fully integrated resale engine where users can auction their tickets, place bids on sold-out events, and receive real-time push notifications for all major account activities.

### 🌟 Features

* **Smart Booking Engine:** Browse upcoming events, book tickets, and let the system automatically manage live seat availability and calculate total amounts.
* **Secondary Resale Marketplace:** A secure auction system where users can list their booked tickets for resale.
* **Real-Time Bidding System:** Place competitive bids on tickets listed in the marketplace, with deep data validation to ensure bids are higher than base prices or current highest bids.
* **Live Push Notifications:** Integrated with Firebase Cloud Messaging (FCM) to instantly alert users when their ticket is successfully booked or when someone places a new bid on their listed ticket.
* **Secure Authentication:** Full JWT-based user authentication, protected routes, and strict ownership validation for ticket resale and cancellations.

### 🏗️ Software Architecture

The application follows a decoupled Client-Server architecture, utilizing the MERN stack alongside Google's Firebase cloud infrastructure for real-time engagement.

**Architecture Breakdown**

* **Presentation Layer (Frontend):** Built with React and Vite. State and navigation are managed via React Router. The UI utilizes Tailwind CSS for a clean, responsive, and modern aesthetic.
* **Business Logic Layer (Backend):** A Node.js/Express.js RESTful API. It handles user authentication, booking validation, marketplace logic (like verifying ticket ownership), and dynamic seat deduction.
* **Notification Proxy Layer:** The backend securely utilizes the Firebase Admin SDK to push real-time background and foreground messages directly to the user's browser whenever critical database actions occur (Bookings/Bids).
* **Data Access Layer:** MongoDB Atlas is accessed via Mongoose ODM, utilizing highly structured schemas for `Users`, `Events`, `Bookings`, and `ResaleLists`, including advanced "Deep Population" queries to connect Marketplace listings back to original Event details.

### 🛠️ Tech Stack

**Frontend**
* **Framework:** React powered by Vite
* **Routing:** React Router v7
* **Styling:** Tailwind CSS
* **Push Notifications:** Firebase Client SDK (Web Push)
* **HTTP Client:** Axios

**Backend**
* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js
* **Database:** MongoDB via Mongoose
* **Notifications:** Firebase Admin SDK
* **Security:** jsonwebtoken (JWT), bcryptjs, cors

---

### 🚀 Getting Started

**Prerequisites**

Make sure you have the following installed on your machine:
* Node.js (v18 or higher recommended)
* MongoDB (Local instance or MongoDB Atlas URI)
* A Firebase Project with Cloud Messaging enabled

**1. Clone the Repository**
```bash
git clone [https://github.com/Deep24NA/Event-ticket-booking.git](https://github.com/Deep24NA/Event-ticket-booking.git)
cd Event-ticket-booking
```

**2. Backend Setup**
Navigate to the backend directory, install dependencies, and set up your environment variables.
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` root and add the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=30d
```
*Note: You will also need to place your Firebase `serviceAccount.json` file inside the `backend/src/services/` folder.*

Start the backend development server:
```bash
npm run dev
```

**3. Frontend Setup**
Open a new terminal window, navigate to the frontend directory, and install dependencies.
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` root and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*Note: Ensure you update your `firebase-messaging-sw.js` and `firebase.js` with your specific Firebase config and VAPID key.*

Start the frontend Vite development server:
```bash
npm run dev
```

---

### 📂 Project Structure

```text
eventtix/
├── backend/                # Express.js backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers (auth, events, booking, resale)
│   │   ├── middleware/     # Custom middleware (JWT auth verification)
│   │   ├── models/         # Mongoose schemas (User, Event, Booking, ResaleList)
│   │   ├── routes/         # Express API routes
│   │   ├── services/       # Firebase service account JSON
│   │   └── utils/          # Notification utility functions
│   └── package.json
└── frontend/               # React (Vite) frontend
    ├── public/             
    │   └── firebase-messaging-sw.js # Firebase Background Service Worker
    ├── src/
    │   ├── api/            # Axios instance setup
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Full page components (Events, Marketplace, Dashboard)
    │   └── firebase.js     # Firebase client initialization & Token request
    └── package.json
```

---

### 📝 Scripts

**Backend (/backend)**
* `npm run dev`: Starts the server in development mode using Nodemon.

**Frontend (/frontend)**
* `npm run dev`: Starts the Vite development server.
* `npm run build`: Builds the app for production to the `dist` folder.
* `npm run lint`: Runs ESLint to check for code quality.

---

### 📄 License

This project is licensed under the ISC License.

### 👤 Author

Developed by **Deep**
