import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo';

export function setupSession(app) {
    const isProduction = process.env.NODE_ENV === 'production';

    console.log('🔧 Setting up session middleware');
    console.log('🌍 Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('🗄️ MongoDB URI:', process.env.MONGODB_URI ? 'SET ✅' : 'NOT SET ❌');
    console.log('🔑 Session Secret:', process.env.SESSION_SECRET ? 'SET ✅' : 'USING FALLBACK ⚠️');

    // Trust Railway/Render reverse proxy — required for secure cookies behind proxy
    app.set('trust proxy', 1);

    // Use MongoDB-backed session store in production (no memory leak, survives restarts)
    const store = process.env.MONGODB_URI
        ? MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: 'sessions',
            ttl: 7 * 24 * 60 * 60, // 7 days in seconds
            autoRemove: 'native',
            touchAfter: 24 * 3600 // lazy session update
          })
        : undefined; // Falls back to MemoryStore in local dev without MongoDB

    if (store) {
        console.log('✅ Using MongoDB session store');
    } else {
        console.log('⚠️ Using MemoryStore (sessions will not persist across restarts)');
    }

    const sessionConfig = {
        secret: process.env.SESSION_SECRET || 'xyrox-fallback-secret-change-this',
        resave: false,
        saveUninitialized: false,
        store,
        name: 'xyrox.sid', // Custom cookie name
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
            secure: isProduction,   // HTTPS only in production
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin cookies
            domain: isProduction ? undefined : undefined, // Let browser handle domain
            path: '/'
        }
    };

    console.log('🍪 Cookie config:', {
        secure: sessionConfig.cookie.secure,
        sameSite: sessionConfig.cookie.sameSite,
        httpOnly: sessionConfig.cookie.httpOnly,
        maxAge: sessionConfig.cookie.maxAge + 'ms'
    });

    app.use(session(sessionConfig));

    app.use(passport.initialize());
    app.use(passport.session());

    console.log('✅ Session middleware initialized');
}
