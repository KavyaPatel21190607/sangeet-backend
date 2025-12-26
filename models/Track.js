import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a track title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  artist: {
    type: String,
    required: [true, 'Please provide an artist name'],
    trim: true
  },
  album: {
    type: String,
    trim: true,
    default: 'Single'
  },
  coverImage: {
    type: String,
    required: [true, 'Please provide a cover image'],
    default: 'https://images.unsplash.com/photo-1644855640845-ab57a047320e?w=400'
  },
  audioUrl: {
    type: String,
    required: [true, 'Please provide an audio URL']
  },
  duration: {
    type: String,
    required: [true, 'Please provide track duration'],
    default: '0:00'
  },
  durationInSeconds: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['song', 'podcast'],
    required: [true, 'Please specify category'],
    default: 'song'
  },
  genre: {
    type: String,
    trim: true,
    default: 'General'
  },
  plays: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  spotifyId: {
    type: String,
    unique: true,
    sparse: true
  },
  spotifyData: {
    externalUrl: String,
    previewUrl: String,
    popularity: Number,
    explicit: Boolean
  },
  metadata: {
    bitrate: String,
    format: String,
    size: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: false },  // Disable virtuals to prevent errors in nested docs
  toObject: { virtuals: false }
});

// Indexes for performance
trackSchema.index({ title: 'text', artist: 'text', album: 'text' });
trackSchema.index({ category: 1, isPublished: 1 });
trackSchema.index({ plays: -1 });
trackSchema.index({ uploadedBy: 1 });
trackSchema.index({ createdAt: -1 });

// Virtual for formatted plays count
trackSchema.virtual('formattedPlays').get(function () {
  // Handle undefined/null plays
  const plays = this.plays || 0;

  if (plays >= 1000000) {
    return `${(plays / 1000000).toFixed(1)}M`;
  } else if (plays >= 1000) {
    return `${(plays / 1000).toFixed(1)}K`;
  }
  return plays.toString();
});

// Method to increment plays
trackSchema.methods.incrementPlays = async function () {
  this.plays += 1;
  await this.save();
};

// Method to increment likes
trackSchema.methods.incrementLikes = async function () {
  this.likes += 1;
  await this.save();
};

// Method to decrement likes
trackSchema.methods.decrementLikes = async function () {
  if (this.likes > 0) {
    this.likes -= 1;
    await this.save();
  }
};

const Track = mongoose.model('Track', trackSchema);

export default Track;
