const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { verifyConfigPermission, verifyBiddingPermission, verifySuperAdmin } = require('../middlewares/authMiddleware');

// Debug logging
console.log('Loading auction routes...');
console.log('Controller methods:', Object.keys(auctionController));

// Public routes
router.get('/data', auctionController.getAuctionData);

// Configuration routes (admin/super-admin only)
router.post('/settings', verifyConfigPermission, auctionController.saveSettings);
router.post('/start', verifyConfigPermission, auctionController.startAuction);
router.post('/stop', verifyConfigPermission, auctionController.stopAuction);
router.post('/finish', verifyConfigPermission, auctionController.finishAuction);
router.post('/reset', verifyConfigPermission, auctionController.resetAuction);

// Fast track routes (admin/super-admin only)
router.post('/fast-track/start', verifyConfigPermission, auctionController.startFastTrack);
router.post('/fast-track/end', verifyConfigPermission, auctionController.endFastTrack);

// Bidding routes (all admin roles including sub-admin)
router.post('/bidding/start/:playerId', verifyBiddingPermission, auctionController.startBidding);
router.post('/bidding/place', verifyBiddingPermission, auctionController.placeBid);
router.post('/bidding/sell', verifyBiddingPermission, auctionController.sellPlayer);
router.post('/bidding/unsold', verifyBiddingPermission, auctionController.markUnsold);
router.post('/bidding/cancel', verifyBiddingPermission, auctionController.cancelBidding);

// NEW: Undo functionality (super-admin only)
router.post('/undo/sale', verifySuperAdmin, auctionController.undoLastSale);
router.post('/undo/bid', verifySuperAdmin, auctionController.undoCurrentBid);
router.get('/history', verifySuperAdmin, auctionController.getActionHistory);

console.log('Auction routes loaded successfully');
module.exports = router;
