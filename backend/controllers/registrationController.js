const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const registrationService = require('../services/registrationService');
const dataService = require('../services/dataService');
const socketService = require('../services/socketService');
const { calculateStats } = require('../utils/biddingRules');

// In-memory multipart handling; files are streamed to Supabase Storage.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 } });

const ALLOWED_ROLES = ['Batter', 'Bowler', 'WK', 'Batting AR', 'Bowling AR'];
const ROLE_TO_CATEGORY = {
  Batter: 'batter',
  Bowler: 'bowler',
  WK: 'wicket-keeper',
  'Batting AR': 'allrounder',
  'Bowling AR': 'allrounder',
};

const slugify = (name) =>
  name.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'event';

// Only the fields a public visitor is allowed to see.
const publicEvent = (e) => ({
  slug: e.slug,
  name: e.name,
  registration_open: e.registration_open,
  payment_required: e.payment_required,
  reg_fee: e.reg_fee,
  upi_id: e.payment_required ? e.upi_id : null,
  upi_qr_url: e.payment_required ? e.upi_qr_url : null,
});

const registrationController = {
  uploadFields: upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'screenshot', maxCount: 1 },
  ]),
  uploadQr: upload.single('qr'),

  // ---------- Events (super-admin) ----------
  async listEvents(req, res) {
    try {
      let events = await registrationService.listEvents();
      // Organizers only see the events assigned to them.
      if (req.user?.role === 'organizer') {
        events = events.filter((e) => e.organizer_id === req.user.id);
      }
      // Attach organizer display name for the admin view.
      const organizers = await registrationService.listOrganizers();
      const nameById = new Map(organizers.map((o) => [o.id, o.name || o.username]));
      events = events.map((e) => ({ ...e, organizer_name: e.organizer_id ? nameById.get(e.organizer_id) || null : null }));
      res.json({ events });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async createEvent(req, res) {
    try {
      const { name, organizerId, paymentRequired, regFee, upiId } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Event name is required' });

      let slug = slugify(name);
      // Ensure uniqueness by suffixing if needed.
      if (await registrationService.getEventBySlug(slug)) slug = `${slug}-${uuidv4().slice(0, 4)}`;

      let upi_qr_url = null;
      if (req.file) {
        upi_qr_url = await registrationService.uploadImage(req.file.buffer, req.file.mimetype, `qr/${slug}`);
      }

      // Organizers can only create events under their own id; higher roles may assign anyone.
      const isOrganizer = req.user?.role === 'organizer';
      const organizer_id = isOrganizer ? req.user.id : (organizerId ? parseInt(organizerId, 10) : null);

      const event = await registrationService.createEvent({
        slug,
        name: name.trim(),
        organizer_id,
        payment_required: paymentRequired === 'false' ? false : paymentRequired !== undefined ? !!paymentRequired : true,
        reg_fee: regFee ? Number(regFee) : 0,
        upi_id: upiId || null,
        upi_qr_url,
        registration_open: true,
        created_by: req.user?.username || 'super-admin',
      });
      res.json({ event });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const isOrganizer = req.user?.role === 'organizer';
      if (isOrganizer) {
        const ev = await registrationService.getEventById(id);
        if (!ev || ev.organizer_id !== req.user.id) {
          return res.status(403).json({ error: 'Not authorized for this event' });
        }
      }
      const body = req.body || {};
      const payload = {};
      if (body.name !== undefined) payload.name = body.name;
      if (body.upiId !== undefined) payload.upi_id = body.upiId || null;
      // Only higher roles may reassign an event's organizer.
      if (!isOrganizer && body.organizerId !== undefined) payload.organizer_id = body.organizerId ? parseInt(body.organizerId, 10) : null;
      if (body.paymentRequired !== undefined) payload.payment_required = body.paymentRequired === 'false' ? false : !!body.paymentRequired;
      if (body.regFee !== undefined) payload.reg_fee = Number(body.regFee) || 0;
      if (body.registrationOpen !== undefined) payload.registration_open = body.registrationOpen === 'false' ? false : !!body.registrationOpen;
      if (req.file) payload.upi_qr_url = await registrationService.uploadImage(req.file.buffer, req.file.mimetype, `qr/${id}`);

      res.json({ event: await registrationService.updateEvent(id, payload) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async deleteEvent(req, res) {
    try {
      const isOrganizer = req.user?.role === 'organizer';
      if (isOrganizer) {
        const ev = await registrationService.getEventById(req.params.id);
        if (!ev || ev.organizer_id !== req.user.id) {
          return res.status(403).json({ error: 'Not authorized for this event' });
        }
      }
      await registrationService.deleteEvent(req.params.id);
      res.json({ message: 'Event deleted' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ---------- Public registration ----------
  async getPublicEvent(req, res) {
    try {
      const event = await registrationService.getEventBySlug(req.params.slug);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.json({ event: publicEvent(event) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async submitRegistration(req, res) {
    try {
      const event = await registrationService.getEventBySlug(req.params.slug);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      if (!event.registration_open) return res.status(400).json({ error: 'Registration is closed for this event' });

      const { name, mobile, role, profileLink, matches, runs, wickets, paymentTxnId, website } = req.body;

      // Honeypot: bots fill hidden "website" field.
      if (website) return res.status(400).json({ error: 'Spam detected' });
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
      if (!mobile || !/^[0-9]{10}$/.test(mobile.trim())) return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
      if (!role || !ALLOWED_ROLES.includes(role)) return res.status(400).json({ error: 'Please select a valid role' });

      const files = req.files || {};
      const photoFile = files.photo?.[0];
      const screenshotFile = files.screenshot?.[0];

      if (!photoFile) return res.status(400).json({ error: 'Profile photo is required' });
      if (event.payment_required) {
        if (!paymentTxnId || !paymentTxnId.trim()) return res.status(400).json({ error: 'Payment reference (UTR) is required' });
        if (!screenshotFile) return res.status(400).json({ error: 'Payment screenshot is required' });
      }

      let profile_pic_url = null;
      let payment_screenshot_url = null;
      if (photoFile) profile_pic_url = await registrationService.uploadImage(photoFile.buffer, photoFile.mimetype, event.slug);
      if (screenshotFile) payment_screenshot_url = await registrationService.uploadImage(screenshotFile.buffer, screenshotFile.mimetype, `${event.slug}/proof`);

      const row = {
        event_id: event.id,
        name: name.trim(),
        mobile: mobile.trim(),
        role,
        profile_pic_url,
        profile_link: profileLink?.trim() || null,
        matches: matches?.toString().trim() || null,
        runs: runs?.toString().trim() || null,
        wickets: wickets?.toString().trim() || null,
        payment_txn_id: paymentTxnId?.trim() || null,
        payment_screenshot_url,
        payment_status: event.payment_required ? 'pending' : 'not_required',
      };

      try {
        const reg = await registrationService.createRegistration(row);
        res.json({ message: 'Registration submitted successfully', registrationId: reg.id });
      } catch (err) {
        if (err.code === '23505') {
          return res.status(409).json({ error: 'You have already registered for this event (mobile or profile link already used).' });
        }
        throw err;
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ---------- Review / approve (admin + organizer) ----------
  async listRegistrations(req, res) {
    try {
      const { eventId } = req.params;
      const { status } = req.query;
      // Organizers may only view events assigned to them.
      if (req.user?.role === 'organizer') {
        const ev = await registrationService.getEventById(eventId);
        if (!ev || ev.organizer_id !== req.user.id) {
          return res.status(403).json({ error: 'Not authorized for this event' });
        }
      }
      res.json({ registrations: await registrationService.listRegistrations(eventId, status) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async setRegistrationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'verified' | 'rejected' | 'pending'
      if (!['verified', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

      const reg = await registrationService.getRegistration(id);
      if (!reg) return res.status(404).json({ error: 'Registration not found' });
      if (req.user?.role === 'organizer') {
        const ev = await registrationService.getEventById(reg.event_id);
        if (!ev || ev.organizer_id !== req.user.id) {
          return res.status(403).json({ error: 'Not authorized for this event' });
        }
      }

      const updated = await registrationService.updateRegistration(id, {
        payment_status: status,
        verified_by: status === 'pending' ? null : (req.user?.username || null),
        verified_at: status === 'pending' ? null : new Date().toISOString(),
      });
      res.json({ registration: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async deleteRegistration(req, res) {
    try {
      await registrationService.deleteRegistration(req.params.id);
      res.json({ message: 'Registration deleted' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ---------- Export registrations to Excel ----------
  async exportRegistrations(req, res) {
    try {
      const { eventId } = req.params;
      const event = await registrationService.getEventById(eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      if (req.user?.role === 'organizer' && event.organizer_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized for this event' });
      }

      const rows = await registrationService.listRegistrations(eventId, req.query.status);

      const ExcelJS = require('exceljs');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Registrations');
      ws.columns = [
        { header: 'Name', key: 'name', width: 24 },
        { header: 'Mobile', key: 'mobile', width: 14 },
        { header: 'Role', key: 'role', width: 14 },
        { header: 'Status', key: 'payment_status', width: 12 },
        { header: 'Profile Link', key: 'profile_link', width: 40 },
        { header: 'Matches', key: 'matches', width: 10 },
        { header: 'Runs', key: 'runs', width: 10 },
        { header: 'Wickets', key: 'wickets', width: 10 },
        { header: 'Payment UTR', key: 'payment_txn_id', width: 20 },
        { header: 'Payment Screenshot', key: 'payment_screenshot_url', width: 40 },
        { header: 'Photo', key: 'profile_pic_url', width: 40 },
        { header: 'Registered At', key: 'created_at', width: 22 },
      ];
      ws.getRow(1).font = { bold: true };
      rows.forEach((r) => ws.addRow(r));

      const safe = (event.slug || 'event').replace(/[^a-z0-9-]/gi, '-');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${safe}-registrations.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ---------- Import verified registrations into the live auction ----------
  async importToAuction(req, res) {
    try {
      const { eventId } = req.params;
      const verified = await registrationService.getVerifiedRegistrations(eventId);
      if (verified.length === 0) return res.status(400).json({ error: 'No verified players to import for this event' });

      const players = dataService.getPlayers();
      const existingKeys = new Set(
        players.map((p) => (p.cricHeroesLink || '').trim().toLowerCase() || (p.mobile || '').trim())
      );

      let imported = 0;
      verified.forEach((r) => {
        const key = (r.profile_link || '').trim().toLowerCase() || (r.mobile || '').trim();
        if (key && existingKeys.has(key)) return; // dedupe
        existingKeys.add(key);
        players.push({
          id: uuidv4(),
          slNo: players.length + 1,
          name: r.name,
          role: r.role,
          category: ROLE_TO_CATEGORY[r.role] || 'other',
          cricHeroesLink: r.profile_link || '',
          manualId: '',
          imageUrl: r.profile_pic_url || '',
          mobile: r.mobile || '',
          matches: r.matches || '',
          runs: r.runs || '',
          battingAvg: '',
          highestScore: '',
          wickets: r.wickets || '',
          economy: '',
          bestBowling: '',
          strikeRate: '',
          status: 'available',
          currentBid: 0,
          finalBid: 0,
          team: null,
          biddingTeam: null,
        });
        imported++;
      });

      dataService.setPlayers(players);
      const stats = calculateStats(players);
      dataService.updateStats(stats);
      socketService.emit('playersUpdated', players);
      socketService.emit('statsUpdated', stats);

      res.json({ message: `Imported ${imported} player(s)`, imported, skipped: verified.length - imported });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};

module.exports = registrationController;
