# Live Polling System

A real-time live polling system built with React, Node.js, Socket.IO, and MongoDB.

## Features

### 👩‍🏫 Teacher Features
- Create and manage live polling sessions
- Send real-time questions (MCQ,true/False, Short Text)
- Set custom time limits for questions
- View live student responses and results
- Real-time chat with students
- Session history and analytics

### 🧑‍🎓 Student Features
- Join sessions with unique names
- Answer questions in real-time
- View live results after submission
- Real-time chat with teacher and other students
- Session history tracking

### 💬 Chat Features
- Real-time messaging between teachers and students
- Minimizable chat window
- Message history persistence
- Typing indicators

## Architecture

### Global Session Model
- **Single Session**: Only one active session at a time (global session)
- **No Session Codes**: Students join directly by entering their name
- **Real-time**: All communication via Socket.IO
- **Persistent**: Session data stored in MongoDB

## Tech Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **Vite** for development and building

### Backend
- **Node.js** with Express
- **Socket.IO** for WebSocket communication
- **MongoDB** with Mongoose for data persistence
- **UUID** for unique identifiers

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### 1ne and Setup Frontend

```bash
# Install frontend dependencies
npm install
```

### 2Setup Backend

```bash
# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3. Configure Environment Variables

#### Backend (.env in server directory):
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:2717/live-polling
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/live-polling

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:300```

#### Frontend (.env in root directory):
```env
VITE_SOCKET_URL=http://localhost:3001
```

### 4etup MongoDB

#### Option A: Local MongoDB
1ll MongoDB locally
2. Start MongoDB service3 connection string: `mongodb://localhost:27017ive-polling`

#### Option B: MongoDB Atlas (Cloud)1 Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster3 connection string and update MONGODB_URI in .env4 Whitelist your IP address

### 5. Run the Application

#### Start Backend Server:
```bash
cd server
npm run dev
# Server will run on http://localhost:301

#### Start Frontend (in new terminal):
```bash
# From root directory
npm run dev
# Frontend will run on http://localhost:5173``

## Usage Guide

### For Teachers:
1. Open the application and select Im a Teacher"
2. A global session will be automatically created/joined
3. Create questions using the "Create New Question" button
4 student responses in real-time
5. Use chat to communicate with students

### For Students:
1. Open the application and select I'm a Student"
2. Enter your unique name
3. You'll automatically join the global session
4. Wait for teacher to send questions
5. Answer questions within the time limit
6. View results after submission
7t to ask questions or give feedback

## API Endpoints

### REST Endpoints
- `GET /health` - Health check
- `GET /api/session/global` - Get global session information

### Socket.IO Events

#### Teacher Events:
- `teacher:create-session` - Create/join global session
- `teacher:send-question` - Send question to students
- `teacher:get-results` - Get question results
- `teacher:end-question` - Manually end current question

#### Student Events:
- `student:join-session` - Join global session
- `student:submit-answer` - Submit answer to question

#### Chat Events:
- `chat:send-message` - Send chat message
- `chat:new-message` - Receive new message
- `chat:typing` - Typing indicator

## Database Schema

### Collections:
- **sessions** - Store global session information and current state
- **questions** - Store all questions with metadata
- **answers** - Store student responses
- **chatmessages** - Store chat history

## Development

### Backend Development:
```bash
cd server
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development:
```bash
npm run dev  # Uses Vite dev server with HMR
```

### Production Build:
```bash
# Frontend
npm run build

# Backend
cd server
npm start
```

## Troubleshooting

### Common Issues:

1. **Connection Failed**: Check if backend server is running on port3001MongoDB Connection Error**: Verify MongoDB is running and connection string is correct
3. **CORS Issues**: Ensure frontend URL is in CORS_ORIGINS environment variable
4. **Socket Connection Issues**: Check firewall settings and network connectivity

### Debug Mode:
Enable debug logging by setting `DEBUG=socket.io*` environment variable

## Contributing

1. Fork the repository2ate feature branch (`git checkout -b feature/amazing-feature`)3 Commit changes (`git commit -m 'Add amazing feature'`)4 Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.