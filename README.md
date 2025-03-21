# Auction API

A NestJS-based RESTful API with WebSocket support for real-time auction updates. This API provides functionality for managing auctions, bids, and user authentication.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [API Endpoints](#api-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Database Schema](#database-schema)
7. [Environment Variables](#environment-variables)
8. [Development](#development)
9. [Production](#production)

## Overview

The Auction API is built with NestJS and provides a robust backend for auction management systems. It features:

- RESTful API endpoints for auctions and bids
- Real-time updates using WebSocket
- JWT-based authentication
- PostgreSQL database with Prisma ORM
- Docker support for easy deployment

## Prerequisites

- Node.js 20.x
- Docker and Docker Compose
- PostgreSQL (if running locally)

## Getting Started

### Running with Docker

1. Clone the repository:

```bash
git clone https://github.com/UsmanKhalil25/auction-api.git
cd auction-api
```

2. Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/auction_db?schema=public

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=1d

# CORS
CORS_ORIGIN=http://localhost:3000
APP_LOCALHOST_URL=http://localhost:3000
APP_FRONTEND_URL=http://localhost:3000

# Node
NODE_ENV=development
```

3. Start the application:

```bash
docker-compose up --build
```

The API will be available at `http://localhost:3001`

### Running Locally

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Run database migrations:

```bash
npx prisma migrate deploy
```

4. Start the development server:

```bash
npm run start:dev
```

## API Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Auctions

#### Create Auction

```http
POST /auctions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Vintage Watch",
  "description": "A beautiful vintage watch",
  "startingPrice": 1000,
  "endTime": "2024-12-31T23:59:59Z",
  "status": "ACTIVE"
}
```

#### Get All Auctions

```http
GET /auctions
```

#### Get Auction by ID

```http
GET /auctions/:id
```

#### Update Auction

```http
PATCH /auctions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated Description",
  "status": "COMPLETED"
}
```

#### Delete Auction

```http
DELETE /auctions/:id
Authorization: Bearer <token>
```

### Bids

#### Place Bid

```http
POST /bids
Authorization: Bearer <token>
Content-Type: application/json

{
  "auctionId": "auction-id",
  "amount": 1100
}
```

#### Get Bids for Auction

```http
GET /bids/auction/:auctionId
```

#### Get User's Bids

```http
GET /bids/user
Authorization: Bearer <token>
```

## WebSocket Events

### Connection

```typescript
// Connect to WebSocket
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token',
  },
});
```

### Events

#### Join Auction Room

```typescript
socket.emit('joinAuction', auctionId);
```

#### Leave Auction Room

```typescript
socket.emit('leaveAuction', auctionId);
```

#### Auction Updates

```typescript
socket.on('auctionUpdate', (data) => {
  console.log('Auction updated:', data);
  // data contains: { currentPrice, highestBid }
});
```

## Database Schema

### User

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String?
  password  String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  auctions  Auction[]
  bids      Bid[]
}
```

### Auction

```prisma
model Auction {
  id           String    @id @default(uuid())
  title        String
  description  String?
  startPrice   Int       @default(0)
  currentPrice Int?      @default(0)
  startDate    DateTime  @default(now())
  endDate      DateTime
  status       AuctionStatus @default(ACTIVE)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  userId       String
  version      Int       @default(1)
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  bids         Bid[]

  @@index([status])
  @@index([endDate])
}
```

### Bid

```prisma
model Bid {
  id        String   @id @default(uuid())
  amount    Int
  auctionId String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  auction   Auction  @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([auctionId])
  @@index([userId])
}
```

## Environment Variables

| Variable          | Description               | Default                                           |
| ----------------- | ------------------------- | ------------------------------------------------- |
| DATABASE_URL      | PostgreSQL connection URL | postgresql://postgres:postgres@db:5432/auction_db |
| JWT_SECRET        | Secret key for JWT tokens | your-super-secret-key                             |
| JWT_EXPIRATION    | JWT token expiration time | 1d                                                |
| CORS_ORIGIN       | CORS allowed origin       | http://localhost:3000                             |
| APP_LOCALHOST_URL | Local development URL     | http://localhost:3000                             |
| APP_FRONTEND_URL  | Frontend application URL  | http://localhost:3000                             |
| NODE_ENV          | Node environment          | development                                       |

## Development

### Project Structure

```
src/
├── auth/           # Authentication module
├── auctions/       # Auctions module
├── bids/          # Bids module
├── common/        # Common utilities and decorators
├── prisma/        # Prisma schema and migrations
└── websocket/     # WebSocket module
```

### Development Commands

```bash
# Start development server
npm run start:dev

# Build the application
npm run build

# Run tests
npm test

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### Docker Development

```bash
# Start development environment
docker-compose up --build

# Stop development environment
docker-compose down

# View logs
docker-compose logs -f api
```

## Production

### Building for Production

```bash
# Build the application
docker-compose -f docker-compose.prod.yml up --build
```

### Production Considerations

1. Set appropriate environment variables
2. Use secure JWT secrets
3. Configure CORS properly
4. Set up proper database backups
5. Monitor application logs
6. Set up proper error tracking

### Security Best Practices

1. Use HTTPS in production
2. Implement rate limiting
3. Validate all input data
4. Use secure headers
5. Implement proper error handling
6. Regular security audits

## License

This project is licensed under the MIT License - see the LICENSE file for details.
