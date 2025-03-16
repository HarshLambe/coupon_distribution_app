# Round-Robin Coupon Distribution System

A full-stack web application for distributing coupons to users in a round-robin manner with an admin panel for management.

## Features

### User Side
- Claim coupons without login (guest access)
- Round-robin distribution of coupons
- Protection against multiple claims from same IP/browser
- Cooldown period between claims
- User-friendly feedback messages

### Admin Panel
- Secure admin login
- Dashboard with statistics
- Manage coupons (add, edit, delete, toggle active status)
- View claim history
- Track user claims by IP and browser fingerprint

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Rate limiting and IP tracking

### Frontend
- React
- React Router for navigation
- Context API for state management
- Axios for API requests
- React Toastify for notifications

## Project Structure

```
coupon-distribution/
├── backend/             # Backend server code
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Main server file
│   └── .env             # Environment variables
│
└── frontend/            # React frontend code
    ├── public/          # Static files
    └── src/             # Source code
        ├── components/  # Reusable components
        ├── pages/       # Page components
        ├── context/     # Context providers
        ├── services/    # API services
        └── App.js       # Main App component
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/coupon-distribution.git
cd coupon-distribution
```

2. Install backend dependencies
```
cd backend
npm install
```

3. Install frontend dependencies
```
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coupon-distribution
JWT_SECRET=your_jwt_secret_key_change_in_production
FRONTEND_URL=http://localhost:3000
```

### Running the Application

1. Start the backend server
```
cd backend
npm run dev
```

2. Start the frontend development server
```
cd frontend
npm start
```

3. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Initial Setup

1. Create an admin account by visiting:
   http://localhost:3000/admin/setup

2. Add coupons through the admin panel

## License

This project is licensed under the MIT License. 