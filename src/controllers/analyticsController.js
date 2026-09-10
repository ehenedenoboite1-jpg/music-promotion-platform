// Analytics Controller
import Analytics from '../models/Analytics.js';
import Track from '../models/Track.js';
import Subscription from '../models/Subscription.js';

// Get overall analytics
export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const analytics = await Analytics.find(filter).sort({ date: 1 });

    // Calculate summary
    const summary = {
      totalStreams: 0,
      totalDownloads: 0,
      totalShares: 0,
      totalEarnings: 0,
      topCountries: [],
      platformBreakdown: {},
    };

    analytics.forEach((record) => {
      summary.totalStreams += record.metrics.streams;
      summary.totalDownloads += record.metrics.downloads;
      summary.totalShares += record.metrics.shares;
      summary.totalEarnings += record.revenue.total;
    });

    res.json({
      success: true,
      summary,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get track analytics
export const getTrackAnalytics = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { startDate, endDate, period = 'daily' } = req.query;

    // Verify user owns track
    const track = await Track.findOne({ _id: trackId, userId: req.user.id });
    if (!track) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const filter = { trackId, userId: req.user.id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const analytics = await Analytics.find(filter).sort({ date: 1 });

    res.json({
      success: true,
      trackId,
      analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get platform breakdown
export const getPlatformBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const analytics = await Analytics.find(filter);

    const breakdown = {
      spotify: { streams: 0, revenue: 0 },
      appleMusic: { streams: 0, revenue: 0 },
      youtube: { streams: 0, revenue: 0 },
      amazonMusic: { streams: 0, revenue: 0 },
      tidal: { streams: 0, revenue: 0 },
      soundcloud: { streams: 0, revenue: 0 },
    };

    analytics.forEach((record) => {
      Object.entries(record.platformBreakdown).forEach(([platform, streams]) => {
        if (breakdown[platform]) {
          breakdown[platform].streams += streams;
        }
      });

      Object.entries(record.revenue.byPlatform).forEach(([platform, revenue]) => {
        if (breakdown[platform]) {
          breakdown[platform].revenue += revenue;
        }
      });
    });

    res.json({
      success: true,
      breakdown,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get demographics
export const getDemographics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const analytics = await Analytics.find(filter);

    const demographics = {
      age: {
        '13-17': 0,
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45+': 0,
      },
      gender: {
        male: 0,
        female: 0,
        other: 0,
      },
      topCountries: {},
      topCities: {},
    };

    analytics.forEach((record) => {
      Object.entries(record.demographics.age).forEach(([age, count]) => {
        demographics.age[age] += count;
      });

      Object.entries(record.demographics.gender).forEach(([gender, count]) => {
        demographics.gender[gender] += count;
      });

      record.demographics.topCountries.forEach(({ country, streams }) => {
        demographics.topCountries[country] = (demographics.topCountries[country] || 0) + streams;
      });

      record.demographics.topCities.forEach(({ city, country, streams }) => {
        const key = `${city}, ${country}`;
        demographics.topCities[key] = (demographics.topCities[key] || 0) + streams;
      });
    });

    res.json({
      success: true,
      demographics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get revenue report
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, currency = 'USD' } = req.query;

    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const analytics = await Analytics.find(filter).sort({ date: 1 });

    const subscription = await Subscription.findOne({ userId: req.user.id });

    const revenue = {
      total: 0,
      byPlatform: {},
      byTrack: {},
      daily: [],
    };

    analytics.forEach((record) => {
      revenue.total += record.revenue.total;

      Object.entries(record.revenue.byPlatform).forEach(([platform, amount]) => {
        revenue.byPlatform[platform] = (revenue.byPlatform[platform] || 0) + amount;
      });

      if (record.trackId) {
        revenue.byTrack[record.trackId] = (revenue.byTrack[record.trackId] || 0) + record.revenue.total;
      }

      revenue.daily.push({
        date: record.date,
        amount: record.revenue.total,
      });
    });

    res.json({
      success: true,
      revenue,
      subscription: {
        plan: subscription?.plan,
        nextPaymentDate: subscription?.currentPeriodEnd,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get trending tracks
export const getTrendingTracks = async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const analytics = await Analytics.aggregate([
      {
        $match: {
          userId: req.user.id,
          trackId: { $ne: null },
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$trackId',
          totalStreams: { $sum: '$metrics.streams' },
          totalDownloads: { $sum: '$metrics.downloads' },
          totalRevenue: { $sum: '$revenue.total' },
        },
      },
      {
        $sort: { totalStreams: -1 },
      },
      {
        $limit: parseInt(limit),
      },
      {
        $lookup: {
          from: 'tracks',
          localField: '_id',
          foreignField: '_id',
          as: 'track',
        },
      },
    ]);

    res.json({
      success: true,
      trendingTracks: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
