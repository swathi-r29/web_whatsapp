# WhatsApp Web Clone
This is a full-stack clone of WhatsApp Web focusing on core chat functionality, built using the MERN stack (MongoDB, Express.js, React, Node.js) and Socket.IO for real-time capabilities.

## Features Implemented

1. **User Setup**
   - Simple authentication using a unique username.
   - Users are distinguishable and can chat with any other registered user.

2. **Chat Interface**
   - Two-panel layout featuring a sidebar (chat list) and a main chat window.
   - Active chat highlighting.
   - Distinct visual styles for sent and received messages.
   - Automatic scroll to the latest message.
   - Read receipts (sent, delivered, seen) and typing indicators.

3. **Messaging Functionality**
   - Send and receive text messages in real-time.
   - Messages are stored persistently in MongoDB and fetched chronologically.
   - Support for emojis in messages.

4. **Backend APIs**
   - RESTful API endpoints for user management (`/api/users`) and message handling (`/api/messages`).
   - Proper HTTP status codes and error handling for invalid/empty requests.

5. **Real-Time Updates**
   - Instant message updates, typing indicators, and read receipts powered by Socket.IO.
   - Live rendering of messages without page refresh.

6. **Application Structure**
   - Separation of concerns: distinct `frontend` and `backend` directories.
   - Modular frontend with reusable React components (`ChatWindow`, `Sidebar`, `MessageBubble`).
   - Clean backend structure with separate routes, controllers, models, and socket event handlers.

## Technology Stack

- **Frontend:** React.js (Vite), React Router, Axios, Socket.IO Client, CSS
- **Backend:** Node.js, Express.js, Socket.IO, Mongoose
- **Database:** MongoDB

## Local Development Setup

Follow these instructions to run both the frontend and backend locally.

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB account (for MongoDB URI) or local MongoDB server

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```
   *(Note: Replace `your_mongodb_connection_string` with your actual MongoDB connection string. Ensure the `CLIENT_URL` matches your frontend development server URL.)*

4. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

### 3. Usage
- Open your browser and navigate to `http://localhost:5173`.
- Enter a username to log in or create a new user.
- To test the chat functionality, open an incognito window or a different browser, log in with a different username, and start chatting!

## Submission Notes
- To submit this task as a public GitHub repository, initialize git in the root folder (`git init`), commit the code, and push it to your newly created public repository on GitHub.
