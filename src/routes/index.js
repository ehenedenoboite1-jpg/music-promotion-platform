// Routes
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as artistController from '../controllers/artistController.js';
import * as uploadController from '../controllers/uploadController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as billingController from '../controllers/billingController.js';

const router = express.Router();

// AUTH ROUTES
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getCurrentUser);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.post('/auth/change-password', authenticate, authController.changePassword);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/logout', authenticate, authController.logout);

// ARTIST PROFILE ROUTES
router.get('/artist/me', authenticate, artistController.getMyProfile);
router.put('/artist/me', authenticate, artistController.updateProfile);
router.get('/artist/:profileLink', artistController.getPublicProfile);
router.get('/artist/id/:artistId', artistController.getArtistById);
router.get('/artists/search', artistController.searchArtists);
router.get('/artists/top', artistController.getTopArtists);
router.get('/artists/trending', artistController.getTrendingArtists);
router.post('/artist/collaborators', authenticate, artistController.addCollaborator);

// TRACK UPLOAD ROUTES
router.post('/tracks', authenticate, uploadController.uploadTrack);
router.get('/tracks', authenticate, uploadController.getUserTracks);
router.get('/tracks/:trackId', authenticate, uploadController.getTrack);
router.put('/tracks/:trackId', authenticate, uploadController.updateTrack);
router.post('/tracks/:trackId/publish', authenticate, uploadController.publishTrack);
router.delete('/tracks/:trackId', authenticate, uploadController.deleteTrack);
router.get('/public/tracks/:trackId', uploadController.getPublicTrack);
router.get('/public/popular-tracks', uploadController.getPopularTracks);

// ANALYTICS ROUTES
router.get('/analytics', authenticate, analyticsController.getAnalytics);
router.get('/analytics/track/:trackId', authenticate, analyticsController.getTrackAnalytics);
router.get('/analytics/platforms', authenticate, analyticsController.getPlatformBreakdown);
router.get('/analytics/demographics', authenticate, analyticsController.getDemographics);
router.get('/analytics/revenue', authenticate, analyticsController.getRevenueReport);
router.get('/analytics/trending', authenticate, analyticsController.getTrendingTracks);

// BILLING ROUTES
router.get('/billing/plans', billingController.getSubscriptionPlans);
router.get('/billing/subscription', authenticate, billingController.getCurrentSubscription);
router.post('/billing/upgrade', authenticate, billingController.upgradePlan);
router.post('/billing/downgrade', authenticate, billingController.downgradePlan);
router.post('/billing/cancel', authenticate, billingController.cancelSubscription);
router.get('/billing/history', authenticate, billingController.getBillingHistory);
router.post('/billing/payment-method', authenticate, billingController.updatePaymentMethod);
router.get('/billing/invoices', authenticate, billingController.getInvoices);

export default router;
