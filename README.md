# WhatsApp Web Clone

This is a full-stack, feature-rich clone of WhatsApp Web, built using the MERN stack (MongoDB, Express.js, React, Node.js) and Socket.IO for advanced real-time communication.

## Advanced Features

### 1. Group Messaging Subsystem
- **Create Groups:** Seamlessly create group chats with multiple members.
- **Real-Time Sync:** Instant message broadcasting to all group members using Socket rooms.
- **Group Notifications:** Unread message badges for groups in the sidebar.
- **Typing Awareness:** See who is typing in a group in real-time.
- **Attribution:** Messages in groups clearly show the sender's username.

### 2. Voice Notes (Push-to-Talk)
- **Native Recording:** Record high-quality voice notes directly in the browser using the MediaRecorder API.
- **Themed Player:** Sleek, integrated audio player within message bubbles.
- **Real-Time Delivery:** Voice notes are broadcast instantly to recipients.

### 3. Real-Time Engine (Socket.IO)
- **Status Ticks:** Authentic WhatsApp-style read receipts:
    - **✓** (Sent)
    - **✓✓** (Delivered)
    - **✓✓** (Seen - Blue Ticks)
- **Multi-Device Sync:** Data stays synchronized across multiple tabs and devices in real-time.
- **Online Presence:** Live "Online/Offline" status indicators for contacts.
- **Reactions:** React to any message with emojis (👍, ❤️, 😂, etc.) with real-time updates.

### 4. Premium UI/UX
- **WhatsApp Mobile Design:** Sidebar redesign inspired by the WhatsApp mobile app.
- **A-Z Contact Sorting:** Contacts are automatically grouped by letter for easy navigation.
- **Search:** Instant search for contacts and groups.
- **Smooth Animations:** Glassmorphism effects, sliding sidebars, and polished transitions.

### 5. Media Support
- **Images & Video:** Upload and view images and videos directly in the chat.
- **MIME Detection:** Intelligent backend detection for different media types (image/video/audio).

### 6. Security & Stability
- **JWT Authentication:** Secure sessions using JSON Web Tokens and HTTP-only cookies.
- **Protected Routes:** Backend APIs are secured; users can only access their own chats and groups.
- **Auto-Retry & Reconnect:** Socket.IO handles intermittent network issues gracefully.

## Technology Stack

- **Frontend:** React.js (Vite), React Router, Socket.IO Client, Vanilla CSS (Glassmorphism)
- **Backend:** Node.js, Express.js, Socket.IO, Mongoose, Multer (Media Uploads)
- **Database:** MongoDB
- **Auth:** JWT, Cookie-Parser

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
PORT=5000
CLIENT_URL=http://localhost:5173
```
Start the server:
```bash
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
Start the app:
```bash
npm run dev
```

## Usage
1. Open `http://localhost:5173`.
2. Register/Login with a username and email.
3. Use the **"+" icon** to start a new chat or create a group.
4. Use the **Microphone** to send voice notes.
5. Click **📎** to share images or videos.
