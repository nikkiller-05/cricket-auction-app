# Supabase Integration Guide

## ✅ What's Implemented

Your auction app now has **flexible image storage** with Supabase integration!

### Features:
- ✅ Upload player images via API
- ✅ Store images in Supabase Storage (1GB free)
- ✅ Switch between storage backends easily
- ✅ Database abstraction layer for future flexibility

---

## 🔧 Configuration

### Environment Variables (.env)

```env
# Storage Configuration
DATABASE_TYPE=memory    # Options: memory, supabase

# Supabase Credentials (only needed when DATABASE_TYPE=supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Switch Storage Backends:

**Local Development (Memory):**
```env
DATABASE_TYPE=memory
```
- Fast, no internet needed
- Images tracked in memory
- Good for testing

**Production (Supabase):**
```env
DATABASE_TYPE=supabase
```
- Cloud storage (1GB free)
- Public image URLs
- Persistent across restarts

---

## 📡 API Endpoints

### Upload Player Image

```http
POST /api/players/upload-image/:playerId
Content-Type: multipart/form-data

Body:
  playerFile: [image file]
```

**Example with cURL:**
```bash
curl -X POST http://localhost:5000/api/players/upload-image/player-123 \
  -F "playerFile=@/path/to/image.jpg"
```

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://khrkkxcdkknwyawjgsno.supabase.co/storage/v1/object/public/player-images/player-123.jpg",
  "playerId": "player-123"
}
```

**Supported Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

**Max File Size:** 10MB

---

## 🧪 Testing

### Test Connection:
```bash
cd backend
node test-upload.js
```

Expected output:
```
📦 Using Supabase Storage for images
Storage Available: ✅ YES
✅ Supabase connection successful!
```

### Test with Postman/Thunder Client:

1. **Start backend server:**
   ```bash
   npm start
   ```

2. **Create POST request:**
   - URL: `http://localhost:5000/api/players/upload-image/test-player-1`
   - Body: Form-data
     - Key: `playerFile`
     - Type: File
     - Value: Select an image

3. **Send request** → You'll get back the image URL!

---

## 📁 Project Structure

```
backend/
  config/
    supabase.js          # Supabase client configuration
    storage.js           # Storage selector (memory/supabase)
  services/
    imageStorageService.js                # Storage interface
    implementations/
      supabaseStorage.js                  # Supabase implementation
      memoryStorage.js                    # In-memory implementation
  controllers/
    playerController.js  # Added uploadPlayerImage method
  routes/
    playerRoutes.js      # Added /upload-image/:playerId endpoint
  .env                   # Environment configuration
```

---

## 🔄 How to Switch Databases Later

Want to move to AWS S3, Cloudinary, or another storage?

1. **Create new implementation:**
   ```javascript
   // services/implementations/awsS3Storage.js
   class AwsS3Storage {
     async uploadPlayerImage(buffer, playerId, mimetype) {
       // Upload to S3
       return imageUrl;
     }
   }
   ```

2. **Update storage config:**
   ```javascript
   // config/storage.js
   case 's3':
     storageImplementation = new AwsS3Storage();
     break;
   ```

3. **Change .env:**
   ```env
   DATABASE_TYPE=s3
   ```

**That's it!** No changes to controllers or routes needed. ✅

---

## 💡 Usage in Frontend

Once image is uploaded, the `imageUrl` is stored with the player:

```javascript
// Player object now has:
{
  id: "player-123",
  name: "Virat Kohli",
  imageUrl: "https://...supabase.co/.../player-123.jpg",
  role: "Batter",
  ...
}

// Display in React:
<img src={player.imageUrl} alt={player.name} />
```

---

## 📊 Supabase Storage Info

**Your Bucket:** `player-images`  
**URL:** https://khrkkxcdkknwyawjgsno.supabase.co  
**Free Tier:** 1 GB storage (~2000 player images)

**Policies Set:**
- ✅ Public read access (anyone can view images)
- ✅ Public upload access (authenticated users can upload)

---

## 🚨 Troubleshooting

### "Storage not available"
- Check SUPABASE_URL and SUPABASE_ANON_KEY in .env
- Verify bucket `player-images` exists in Supabase dashboard
- Check bucket policies are set (read + insert)

### "Module not found"
- Run: `npm install`
- Packages: @supabase/supabase-js, dotenv

### Images not displaying
- Check imageUrl in player object
- Verify URL is publicly accessible (open in browser)
- Check bucket is set to "public"

---

## 🎯 Next Steps

1. **Test locally with memory storage**
2. **Switch to supabase for production**
3. **Integrate image upload in frontend UI**
4. **Display images during live bidding**

---

## 📝 Notes

- Auction data (players, teams, bids) still uses in-memory storage
- Only images are stored in Supabase currently
- Can migrate auction data to Supabase database later if needed
- Current abstraction layer supports easy database migration

Enjoy your cloud-powered image storage! 🎉


---

## CricHeroes stats cache (added)

Backend now caches CricHeroes player stats in Supabase to avoid repeated scraping
and to bypass Cloudflare blocks on Render's datacenter IPs.

### One-time SQL setup

Run in **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS cricheroes_stats (
  player_id    text PRIMARY KEY,
  stats        jsonb NOT NULL,
  fetched_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cricheroes_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role full access"
  ON cricheroes_stats FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
```

### Required environment variables (Render + local .env)

| Var | Purpose |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) - required for cache writes |
| `SCRAPER_API_KEY` | ScraperAPI free-tier key (https://www.scraperapi.com/) for Cloudflare bypass |

### How it works

For each player upload, the backend:

1. **Cache lookup** in `cricheroes_stats` keyed by CricHeroes player ID. If found and < 30 days old, use it (zero API calls).
2. **Direct fetch** from cricheroes.com. Works locally; usually 403 on Render.
3. **ScraperAPI fallback** if direct returned 403 or empty. Uses 1 of your monthly quota.
4. **Write to cache** on any successful fetch so re-uploads skip the network entirely.

If `SCRAPER_API_KEY` is unset, step 3 is skipped (development-friendly).
If Supabase is unreachable, cache silently no-ops and live fetches still run.
