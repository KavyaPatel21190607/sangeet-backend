import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profilePicture: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=10b981&color=fff'
  },
  userType: {
    type: String,
    enum: ['regular', 'premium'],
    default: 'regular'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  likedTracks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  }],
  playlists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  followedArtists: [{
    type: String
  }],
  listeningStats: {
    totalSongsPlayed: {
      type: Number,
      default: 0
    },
    totalHoursListened: {
      type: Number,
      default: 0
    },
    favoriteGenre: {
      type: String,
      default: 'Not set'
    }
  },
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled'],
      default: 'inactive'
    },
    startDate: Date,
    endDate: Date,
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    }
  },
  settings: {
    crossfade: {
      type: Boolean,
      default: false
    },
    gaplessPlayback: {
      type: Boolean,
      default: true
    },
    normalizeVolume: {
      type: Boolean,
      default: false
    },
    streamingQuality: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    downloadQuality: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    autoDownload: {
      type: Boolean,
      default: false
    },
    wifiOnly: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'English'
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full display name
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Remove sensitive data from JSON response
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
