# SANGEET Backend API

Production-grade REST API for the SANGEET music streaming platform.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role management (Admin/User)
- **User Management**: Profile, settings, subscriptions, listening stats
- **Track Management**: CRUD operations, play tracking, likes
- **Playlist Management**: Create, update, share playlists
- **Spotify Integration**: Search and import tracks from Spotify API
- **File Upload**: Supabase Storage integration for audio and images
- **Admin Panel**: Complete admin dashboard with statistics and content management
- **Security**: Helmet, rate limiting, input sanitization, XSS protection
- **Performance**: Compression, MongoDB indexing, efficient queries

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Supabase account (optional, for file storage)
- Spotify Developer account (optional, for Spotify features)

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values in `.env`:
     ```
     MONGODB_URI=mongodb://localhost:27017/sangeet
     JWT_SECRET=your_secret_key
     SPOTIFY_CLIENT_ID=your_spotify_id
     SPOTIFY_CLIENT_SECRET=your_spotify_secret
     SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_KEY=your_supabase_key
     ```

3. **Start MongoDB** (if using local):
   ```bash
   mongod
   ```

4. **Seed the database** (optional but recommended):
   ```bash
   npm run seed
   ```

5. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

Server will run on `http://localhost:5000`

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/admin-login` | Admin login | Public |
| GET | `/api/auth/me` | Get current user | Private |
| POST | `/api/auth/logout` | Logout user | Private |
| PUT | `/api/auth/change-password` | Change password | Private |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users/profile` | Get user profile | Private |
| PUT | `/api/users/profile` | Update profile | Private |
| PUT | `/api/users/settings` | Update settings | Private |
| POST | `/api/users/like-track/:trackId` | Like/unlike track | Private |
| GET | `/api/users/liked-tracks` | Get liked tracks | Private |
| POST | `/api/users/play-track/:trackId` | Record track play | Private |
| PUT | `/api/users/upgrade-premium` | Upgrade to premium | Private |

### Tracks

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tracks` | Get all tracks (with filters) | Public |
| GET | `/api/tracks/:id` | Get single track | Public |
| POST | `/api/tracks` | Create track | Admin |
| PUT | `/api/tracks/:id` | Update track | Admin |
| DELETE | `/api/tracks/:id` | Delete track | Admin |
| GET | `/api/tracks/trending/top` | Get trending tracks | Public |
| GET | `/api/tracks/recent/added` | Get recent tracks | Public |

### Playlists

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/playlists` | Get playlists | Private |
| GET | `/api/playlists/my` | Get user's playlists | Private |
| GET | `/api/playlists/:id` | Get single playlist | Private |
| POST | `/api/playlists` | Create playlist | Private |
| PUT | `/api/playlists/:id` | Update playlist | Private |
| DELETE | `/api/playlists/:id` | Delete playlist | Private |
| POST | `/api/playlists/:id/tracks/:trackId` | Add track to playlist | Private |
| DELETE | `/api/playlists/:id/tracks/:trackId` | Remove track | Private |

### Admin

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/stats` | Get dashboard stats | Admin |
| GET | `/api/admin/users` | Get all users | Admin |
| GET | `/api/admin/users/:id` | Get user details | Admin |
| PUT | `/api/admin/users/:id` | Update user | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |
| GET | `/api/admin/tracks` | Get all tracks | Admin |
| GET | `/api/admin/activity` | Get recent activity | Admin |
| GET | `/api/admin/top-content` | Get top content | Admin |

### Spotify

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/spotify/search` | Search Spotify tracks | Private |
| GET | `/api/spotify/track/:id` | Get Spotify track | Private |
| POST | `/api/spotify/tracks` | Get multiple tracks | Private |
| GET | `/api/spotify/new-releases` | Get new releases | Private |
| GET | `/api/spotify/featured-playlists` | Get featured playlists | Private |
| POST | `/api/spotify/recommendations` | Get recommendations | Private |

### Upload

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/upload/audio` | Upload audio file | Admin |
| POST | `/api/upload/image` | Upload image file | Private |
| POST | `/api/upload/track` | Upload track (audio + image) | Admin |
| DELETE | `/api/upload/file` | Delete file | Admin |

## 🔐 Authentication

All authenticated requests must include JWT token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Token is also automatically included in httpOnly cookies.

## 🎯 Test Credentials

After seeding the database:

**Admin Account:**
- Email: `admin@sangeet.com`
- Password: `Admin@123456`

**Test User:**
- Email: `kavya@example.com`
- Password: `password123`

## 🏗️ Project Structure

```
backend/
├── config/
│   ├── database.js        # MongoDB connection
│   └── supabase.js        # Supabase client
├── models/
│   ├── User.js            # User model
│   ├── Track.js           # Track model
│   └── Playlist.js        # Playlist model
├── routes/
│   ├── authRoutes.js      # Auth endpoints
│   ├── userRoutes.js      # User endpoints
│   ├── trackRoutes.js     # Track endpoints
│   ├── playlistRoutes.js  # Playlist endpoints
│   ├── adminRoutes.js     # Admin endpoints
│   ├── spotifyRoutes.js   # Spotify endpoints
│   └── uploadRoutes.js    # Upload endpoints
├── middleware/
│   ├── auth.js            # JWT auth middleware
│   ├── errorHandler.js    # Global error handler
│   └── rateLimiter.js     # Rate limiting
├── services/
│   ├── spotifyService.js  # Spotify API service
│   └── supabaseStorage.js # File upload service
├── utils/
│   ├── validation.js      # Joi validation schemas
│   └── seedDatabase.js    # Database seeder
├── server.js              # Express app & server
├── package.json
└── .env
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `JWT_EXPIRE` | JWT expiration time | Yes |
| `SUPABASE_URL` | Supabase project URL | No |
| `SUPABASE_SERVICE_KEY` | Supabase service key | No |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | No |
| `SPOTIFY_CLIENT_SECRET` | Spotify app secret | No |

## 🚦 Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Upload endpoints: 20 uploads per hour

## 🛡️ Security Features

- Helmet.js for HTTP headers
- CORS configuration
- JWT authentication
- Password hashing (bcrypt)
- Input validation (Joi)
- SQL/NoSQL injection protection
- XSS protection
- Rate limiting
- HTTP Parameter Pollution prevention

## 📊 Database Indexes

Optimized queries with indexes on:
- User: email, role, createdAt
- Track: text search, category, plays, uploadedBy, spotifyId
- Playlist: owner, isPublic, createdAt

## 🐛 Error Handling

All errors are caught and returned in consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

## 📝 License

MIT

## 👨‍💻 Author

Patel Kavya
