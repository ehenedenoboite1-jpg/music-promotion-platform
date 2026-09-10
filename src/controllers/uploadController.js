// Track Upload Controller
import Track from '../models/Track.js';
import Subscription from '../models/Subscription.js';
import Analytics from '../models/Analytics.js';

// Upload track
export const uploadTrack = async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      isExplicit,
      copyright,
      credits,
      releaseDate,
      tags,
      lyrics,
      visibility,
    } = req.body;

    // Check subscription limit
    const subscription = await Subscription.findOne({ userId: req.user.id });

    if (!subscription || !subscription.isActive()) {
      return res.status(403).json({
        success: false,
        message: 'Invalid subscription',
      });
    }

    if (!subscription.canUpload()) {
      return res.status(403).json({
        success: false,
        message: `Upload limit reached. Upgrade to ${subscription.plan} plan`,
      });
    }

    // TODO: Handle file uploads to S3
    // For now, we'll assume files are uploaded via multipart

    const track = new Track({
      userId: req.user.id,
      title,
      description,
      genre,
      isExplicit,
      copyright,
      credits,
      releaseDate,
      tags,
      lyrics,
      visibility,
      status: 'draft',
    });

    await track.save();

    // Update usage
    subscription.usageStats.uploadsThisMonth += 1;
    await subscription.save();

    res.status(201).json({
      success: true,
      message: 'Track uploaded successfully',
      track,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user's tracks
export const getUserTracks = async (req, res) => {
  try {
    const { status = 'published', limit = 20, page = 1 } = req.query;

    const filter = { userId: req.user.id };
    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const tracks = await Track.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Track.countDocuments(filter);

    res.json({
      success: true,
      tracks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get track details
export const getTrack = async (req, res) => {
  try {
    const { trackId } = req.params;

    const track = await Track.findById(trackId);

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found',
      });
    }

    res.json({
      success: true,
      track,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update track
export const updateTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const updates = req.body;

    const track = await Track.findOne({ _id: trackId, userId: req.user.id });

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found',
      });
    }

    Object.assign(track, updates);
    await track.save();

    res.json({
      success: true,
      message: 'Track updated successfully',
      track,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Publish track
export const publishTrack = async (req, res) => {
  try {
    const { trackId } = req.params;

    const track = await Track.findOne({ _id: trackId, userId: req.user.id });

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found',
      });
    }

    if (!track.audioFile?.url) {
      return res.status(400).json({
        success: false,
        message: 'Audio file required to publish',
      });
    }

    track.status = 'published';
    track.releaseDate = new Date();
    await track.save();

    // TODO: Distribute to platforms

    res.json({
      success: true,
      message: 'Track published successfully',
      track,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete track
export const deleteTrack = async (req, res) => {
  try {
    const { trackId } = req.params;

    const track = await Track.findOneAndDelete({ _id: trackId, userId: req.user.id });

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found',
      });
    }

    res.json({
      success: true,
      message: 'Track deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get public track
export const getPublicTrack = async (req, res) => {
  try {
    const { trackId } = req.params;

    const track = await Track.findOne({
      _id: trackId,
      status: 'published',
      visibility: { $in: ['public', 'unlisted'] },
    });

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found',
      });
    }

    res.json({
      success: true,
      track,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get popular tracks
export const getPopularTracks = async (req, res) => {
  try {
    const { limit = 20, genre } = req.query;

    const filter = { status: 'published', visibility: 'public' };

    if (genre) {
      filter.genre = genre;
    }

    const tracks = await Track.find(filter)
      .sort({ 'metrics.streams': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      tracks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
