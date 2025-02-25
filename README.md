
# GoalBridgeAI - Career Goal Tracking Platform

GoalBridgeAI is a full-stack TypeScript application that helps users track their career goals and get AI-powered guidance. Built with React, Express.

## Features

- 🔐 User authentication
- 📊 Skill tracking with progress indicators
- 🎯 Career goal management
- 🤖 AI-generated project roadmaps
- 💬 Chat interface for guidance

## Demo Credentials

```
Username: demo
Password: demo123
```

## Prerequisites

- Node.js 20.x or later
- OpenAI API key for AI features

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/             # Source files
│   └── index.html       # HTML entry point
├── server/              # Backend Express server
│   ├── auth.ts         # Authentication logic
│   ├── chat.ts         # AI chat functionality
│   ├── routes.ts       # API routes
│   └── storage.ts      # Database operations
└── shared/             # Shared TypeScript types
```

## API Routes

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/user` - Get current user
- `GET /api/skills` - Get user skills
- `GET /api/goals` - Get career goals
- `POST /api/chat` - AI chat endpoint


## Local Development

### Prerequisites
- Node.js 20.x
- PostgreSQL 16.x
- Git

### Setup Steps

1. Clone the repository:
```bash
git clone <your-repo-url>
cd goalbridge-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables in `.env`:
```
SESSION_SECRET=your_session_secret
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://username:password@localhost:5432/goalbridge -- I dont think we need this
```

4. Start PostgreSQL and create database:
```bash 
createdb goalbridge
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at http://0.0.0.0:5000

Note: For the best experience, we recommend using [Replit](https://replit.com) which provides a pre-configured environment.

## Testing

1. Start the development server
2. Visit the application URL
3. Log in with demo credentials
4. Test features:
   - Add/edit skills
   - Create career goals
   - Chat with AI assistant
   - View project roadmaps

## Deployment

Deploy directly through Replit:

1. Click "Deploy" in the Replit interface
2. Configure deployment settings
3. Your app will be available at the provided URL

## Environment Variables (Using REPLIT)

Create the following secrets in Replit's Secrets panel:

```
SESSION_SECRET=your_session_secret
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://username:password@host:5432/dbname
```

## Local Development

1. Clone the repository in Replit
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at port 5000.
