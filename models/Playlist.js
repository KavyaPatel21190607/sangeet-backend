import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a playlist name'],
    trim: true,
    maxlength: [100, 'Playlist name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  coverImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1644855640845-ab57a047320e?w=400'
  },
  tracks: [{
    track: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Track'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isCollaborative: {
    type: Boolean,
    default: false
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: String,
    default: '0:00'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: false },  // Disable virtuals to prevent errors in nested docs
  toObject: { virtuals: false }
});

// Indexes
playlistSchema.index({ owner: 1 });
playlistSchema.index({ name: 'text', description: 'text' });
playlistSchema.index({ isPublic: 1 });
playlistSchema.index({ createdAt: -1 });

// Virtual for track count
playlistSchema.virtual('trackCount').get(function () {
  // Handle undefined/null tracks
  return this.tracks ? this.tracks.length : 0;
});

// Method to add track
playlistSchema.methods.addTrack = async function (trackId) {
  const exists = this.tracks.some(t => t.track.toString() === trackId.toString());
  if (!exists) {
    this.tracks.push({ track: trackId });
    await this.save();
  }
  return this;
};

// Method to remove track
playlistSchema.methods.removeTrack = async function (trackId) {
  this.tracks = this.tracks.filter(t => t.track.toString() !== trackId.toString());
  await this.save();
  return this;
};

// Calculate total duration before saving
playlistSchema.pre('save', async function (next) {
  if (this.isModified('tracks') && this.tracks.length > 0) {
    try {
      const Track = mongoose.model('Track');
      const trackIds = this.tracks.map(t => t.track);
      const tracks = await Track.find({ _id: { $in: trackIds } });

      let totalSeconds = tracks.reduce((sum, track) => {
        return sum + (track.durationInSeconds || 0);
      }, 0);

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      if (hours > 0) {
        this.totalDuration = `${hours}h ${minutes}m`;
      } else {
        this.totalDuration = `${minutes}m`;
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
    }
  }
  next();
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
