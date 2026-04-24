import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo';

export function setupSession(app) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Trust reverse proxy (Railway/Render/Heroku) — required for secure cookies
    app.set('trust proxy', 1);

    // Session store: use MongoDB in production (persists across restarts)
    const store = process.env.MONGODB_URI
        ? MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: 'sessions',
            ttl: 7 * 24 * 60 * 60, // 7 days (in seconds)
            autoRemove: 'native',
            touchAfter: 24 * 60 * 60 // Update session once per day (reduces DB writes)
          })
        : undefined; // MemoryStore fallback for local dev

    app.use(session({
        secret: process.env.SESSION_SECRET || 'xyrox-dev-secret-change-in-production',
        resave: false,
        saveUninitialized: false,
        store,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (in milliseconds)
            secure: isProduction, // HTTPS only in production
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'lax' // 'none' allows cross-origin (Vercel → Railway)
        },
        name: 'xyrox.sid' // Custom cookie name
    }));

    app.use(passport.initialize());
    app.use(passport.session());
}
