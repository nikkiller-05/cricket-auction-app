// Per-request "which auction are we operating on" context.
//
// Uses AsyncLocalStorage so an auctionId set at the start of a request flows
// through all the awaits of that request without every dataService method (or
// controller) having to pass it explicitly. dataService.S() reads currentAuctionId().
//
// GOTCHA: deferred work that runs AFTER the request ends (setTimeout, socket
// event handlers) is OUTSIDE this context — those call sites must capture their
// auctionId and re-enter via runWithAuction(id, fn).
const { AsyncLocalStorage } = require('async_hooks');

const DEFAULT_AUCTION_ID = 'default';
const als = new AsyncLocalStorage();

// Run fn (and everything it awaits) with the given auction as the active one.
function runWithAuction(auctionId, fn) {
  return als.run({ auctionId: auctionId || DEFAULT_AUCTION_ID }, fn);
}

// The active auction id for the current async context, or null if none is set
// (startup, or a deferred callback that didn't re-enter the context).
function currentAuctionId() {
  const store = als.getStore();
  return store ? store.auctionId : null;
}

// Express middleware: derive the auction id and run the rest of the request in
// its context. Defaults to DEFAULT_AUCTION_ID so existing single-auction
// clients keep working unchanged.
function auctionContextMiddleware(req, res, next) {
  const auctionId =
    req.headers['x-auction-id'] ||
    req.query.auctionId ||
    req.params.auctionId ||
    DEFAULT_AUCTION_ID;
  runWithAuction(auctionId, next);
}

module.exports = {
  DEFAULT_AUCTION_ID,
  runWithAuction,
  currentAuctionId,
  auctionContextMiddleware,
};
