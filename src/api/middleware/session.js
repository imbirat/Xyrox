import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo';

export function setupSession(app) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Trust Railway/Render reverse proxy — required for secure cookies behind proxy
    app.set('trust proxy', 1);

    // Use MongoDB-backed session store in production (no memory leak, survives restarts)
    const store = process.env.MONGODB_URI
        ? MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: 'sessions',
            ttl: 7 * 24 * 60 * 60, // 7 days in seconds
            autoRemove: 'native'
          })
        : undefined; // Falls back to MemoryStore in local dev without MongoDB

    app.use(session({
        secret: process.env.SESSION_SECRET || 'xyrox-fallback-secret-change-this',
        resave: false,
        saveUninitialized: false,
        store,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
            secure: isProduction,   // HTTPS only in production
            httpOnly: true,
            // 'none' required for cross-origin cookies (Vercel → Railway)
            sameSite: isProduction ? 'none' : 'lax'
        }
    }));

    app.use(passport.initialize());
    app.use(passport.session());
}
