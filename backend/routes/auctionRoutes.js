const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { requireAuctionAccess } = require('../middlewares/authMiddleware');

// Debug logging
console.log('Loading auction routes...');
console.log('Controller methods:', Object.keys(auctionController));

// Public routes
router.get('/data', auctionController.getAuctionData);
router.get('/access', auctionController.getAccess);

// Configuration routes (admin/super-admin on main auction; owner-organizer/super on event auctions)
router.post('/settings', requireAuctionAccess('config'), auctionController.saveSettings);
router.get('/config', requireAuctionAccess('config'), auctionController.getConfig);
router.put('/config', requireAuctionAccess('config'), auctionController.updateConfig);
router.post('/features', requireAuctionAccess('config'), auctionController.updateFeatures);
router.post('/start', requireAuctionAccess('config'), auctionController.startAuction);
router.post('/stop', requireAuctionAccess('config'), auctionController.stopAuction);
router.post('/finish', requireAuctionAccess('config'), auctionController.finishAuction);
router.post('/reset', requireAuctionAccess('config'), auctionController.resetAuction);

// Fast track routes
router.post('/fast-track/start', requireAuctionAccess('config'), auctionController.startFastTrack);
router.post('/fast-track/end', requireAuctionAccess('config'), auctionController.endFastTrack);

// Smart Random selection / mystery-reveal flow
router.post('/selection/pick', requireAuctionAccess('bid'), auctionController.pickPlayer);
router.post('/selection/reveal', requireAuctionAccess('bid'), auctionController.revealPlayer);
router.post('/selection/cancel', requireAuctionAccess('bid'), auctionController.cancelSelection);

// Bidding routes
router.post('/bidding/start/:playerId', requireAuctionAccess('bid'), auctionController.startBidding);
router.post('/bidding/place', requireAuctionAccess('bid'), auctionController.placeBid);
router.post('/bidding/sell', requireAuctionAccess('bid'), auctionController.sellPlayer);
router.post('/bidding/unsold', requireAuctionAccess('bid'), auctionController.markUnsold);
router.post('/bidding/cancel', requireAuctionAccess('bid'), auctionController.cancelBidding);

// Correct a sold player's price
router.post('/edit-sale-price', requireAuctionAccess('config'), auctionController.editSalePrice);

// Undo functionality (super-admin on main auction; owner-organizer/super on event auctions)
router.post('/undo/sale', requireAuctionAccess('undo'), auctionController.undoLastSale);
router.post('/undo/bid', requireAuctionAccess('undo'), auctionController.undoCurrentBid);
router.get('/history', requireAuctionAccess('undo'), auctionController.getActionHistory);

console.log('Auction routes loaded successfully');
module.exports = router;
