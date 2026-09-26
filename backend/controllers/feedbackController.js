const feedbackService = require('../services/feedbackService');

// Public, unauthenticated endpoint — a visitor rating the homepage. Kept
// deliberately minimal (rating + optional short comment), same honeypot
// pattern used by the public registration form.
module.exports = {
  async submit(req, res) {
    try {
      const { rating, comment, page, website } = req.body;

      // Honeypot: bots fill hidden "website" field.
      if (website) return res.status(400).json({ error: 'Spam detected' });

      const ratingNum = Number(rating);
      if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5' });
      }
      if (comment && String(comment).length > 500) {
        return res.status(400).json({ error: 'Comment is too long (max 500 characters)' });
      }

      await feedbackService.submit({
        rating: ratingNum,
        comment: comment ? String(comment).trim().slice(0, 500) : null,
        page: page ? String(page).trim().slice(0, 60) : 'homepage',
      });
      res.json({ message: 'Thanks for your feedback!' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
