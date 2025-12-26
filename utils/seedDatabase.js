import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Track from '../models/Track.js';
import Playlist from '../models/Playlist.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Track.deleteMany({});
    await Playlist.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@sangeet.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      userType: 'premium',
      profilePicture: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff',
      isEmailVerified: true
    });

    // Create regular users
    const users = await User.create([
      {
        name: 'Kavya Patel',
        email: 'kavya@example.com',
        password: 'password123',
        userType: 'premium',
        profilePicture: 'https://ui-avatars.com/api/?name=Kavya&background=10b981&color=fff',
        listeningStats: {
          totalSongsPlayed: 342,
          totalHoursListened: 89.5,
          favoriteGenre: 'Electronic'
        }
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        userType: 'regular',
        profilePicture: 'https://ui-avatars.com/api/?name=John&background=3b82f6&color=fff'
      },
      {
        name: 'Sarah Smith',
        email: 'sarah@example.com',
        password: 'password123',
        userType: 'regular',
        profilePicture: 'https://ui-avatars.com/api/?name=Sarah&background=8b5cf6&color=fff'
      }
    ]);

    console.log('✅ Created users');

    // Create tracks
    const tracks = await Track.create([
      {
        title: 'Neon Dreams',
        artist: 'Electric Pulse',
        album: 'Future Sounds',
        coverImage: 'https://images.unsplash.com/photo-1644855640845-ab57a047320e?w=400',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        duration: '3:45',
        durationInSeconds: 225,
        category: 'song',
        genre: 'Electronic',
        plays: 2400000,
        likes: 156000,
        uploadedBy: admin._id
      },
      {
        title: 'Midnight Waves',
        artist: 'Luna Echo',
        album: 'Nocturnal',
        coverImage: 'https://images.unsplash.com/photo-1557005752-592fcc30bcfa?w=400',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        duration: '4:12',
        durationInSeconds: 252,
        category: 'song',
        genre: 'Ambient',
        plays: 1800000,
        likes: 98000,
        uploadedBy: admin._id
      },
      {
        title: 'Tech Talk: AI Revolution',
        artist: 'Future Cast',
        album: 'Tech Insights',
        coverImage: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        duration: '42:15',
        durationInSeconds: 2535,
        category: 'podcast',
        genre: 'Technology',
        plays: 950000,
        likes: 45000,
        uploadedBy: admin._id
      },
      {
        title: 'Cyber Pulse',
        artist: 'Digital Dreams',
        album: 'Synthwave 2025',
        coverImage: 'https://images.unsplash.com/photo-1634717037148-4dc76c09a328?w=400',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        duration: '3:28',
        durationInSeconds: 208,
        category: 'song',
        genre: 'Synthwave',
        plays: 3200000,
        likes: 178000,
        uploadedBy: admin._id
      },
      {
        title: 'Quantum Beats',
        artist: 'Nova Sound',
        album: 'Electronic Frontier',
        coverImage: 'https://images.unsplash.com/photo-1563841930606-67e2bce48b78?w=400',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        duration: '5:03',
        durationInSeconds: 303,
        category: 'song',
        genre: 'House',
        plays: 1500000,
        likes: 89000,
        uploadedBy: admin._id
      },
      {
        title: 'The Creative Process',
        artist: 'Art & Soul',
        album: 'Inspiration Daily',
        coverImage: 'https://images.unsplash.com/photo-1644855640845-ab57a047320e?w=400',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        duration: '35:22',
        durationInSeconds: 2122,
        category: 'podcast',
        genre: 'Arts',
        plays: 780000,
        likes: 34000,
        uploadedBy: admin._id
      },
      {
        title: 'Stellar Journey',
        artist: 'Cosmic Vibes',
        album: 'Space Odyssey',
        coverImage: 'https://images.unsplash.com/photo-1563841930606-67e2bce48b78?w=400',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
        duration: '4:45',
        durationInSeconds: 285,
        category: 'song',
        genre: 'Ambient',
        plays: 2100000,
        likes: 112000,
        uploadedBy: admin._id
      },
      {
        title: 'Morning Meditation',
        artist: 'Zen Masters',
        album: 'Mindful Moments',
        coverImage: 'https://images.unsplash.com/photo-1557005752-592fcc30bcfa?w=400',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        duration: '28:30',
        durationInSeconds: 1710,
        category: 'podcast',
        genre: 'Wellness',
        plays: 1200000,
        likes: 67000,
        uploadedBy: admin._id
      }
    ]);

    console.log('✅ Created tracks');

    // Add liked tracks to users
    users[0].likedTracks = [tracks[0]._id, tracks[2]._id, tracks[4]._id];
    await users[0].save();

    // Create playlists
    const playlists = await Playlist.create([
      {
        name: 'Chill Vibes',
        description: 'Perfect mix for relaxing evenings',
        coverImage: 'https://images.unsplash.com/photo-1557005752-592fcc30bcfa?w=400',
        owner: users[0]._id,
        tracks: [
          { track: tracks[1]._id },
          { track: tracks[6]._id }
        ],
        isPublic: true
      },
      {
        name: 'Workout Energy',
        description: 'High energy tracks to power your workout',
        coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        owner: users[0]._id,
        tracks: [
          { track: tracks[0]._id },
          { track: tracks[3]._id },
          { track: tracks[4]._id }
        ],
        isPublic: true
      },
      {
        name: 'Tech Podcasts',
        description: 'Latest in technology and innovation',
        coverImage: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400',
        owner: admin._id,
        tracks: [
          { track: tracks[2]._id }
        ],
        isPublic: true
      }
    ]);

    // Add playlists to users
    users[0].playlists = [playlists[0]._id, playlists[1]._id];
    await users[0].save();

    admin.playlists = [playlists[2]._id];
    await admin.save();

    console.log('✅ Created playlists');

    console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║        🌱  Database Seeded Successfully  🌱   ║
║                                               ║
║  Admin Account:                               ║
║  Email: ${admin.email}                        ║
║  Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}                     ║
║                                               ║
║  Test User:                                   ║
║  Email: kavya@example.com                     ║
║  Password: password123                        ║
║                                               ║
║  Created:                                     ║
║  - ${users.length + 1} Users                              ║
║  - ${tracks.length} Tracks                            ║
║  - ${playlists.length} Playlists                          ║
║                                               ║
╚═══════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
