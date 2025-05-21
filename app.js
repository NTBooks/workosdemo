require('dotenv').config();
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const { WorkOS } = require('@workos-inc/node');

const app = express();
const PORT = process.env.PORT || 3000;

const cookieParser = require('cookie-parser');


const workos = new WorkOS(process.env.WORKOS_API_KEY, {
    clientId: process.env.WORKOS_CLIENT_ID,
});


// Handlebars setup
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// This `/login` endpoint should be registered as the initiate login URL
// on the "Redirects" page of the WorkOS Dashboard.
app.get('/login', (req, res) => {
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
        // Specify that we'd like AuthKit to handle the authentication flow
        provider: 'authkit',

        // The callback endpoint that WorkOS will redirect to after a user authenticates
        redirectUri: 'http://localhost:3000/callback',
        clientId: process.env.WORKOS_CLIENT_ID,
    });

    // Redirect the user to the AuthKit sign-in page
    res.redirect(authorizationUrl);
});

app.use(cookieParser());

app.get('/callback', async (req, res) => {
    // The authorization code returned by AuthKit
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        const authenticateResponse =
            await workos.userManagement.authenticateWithCode({
                clientId: process.env.WORKOS_CLIENT_ID,
                code,
                session: {
                    sealSession: true,
                    cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
                },
            });

        const { user, sealedSession } = authenticateResponse;

        // Store the session in a cookie
        res.cookie('wos-session', sealedSession, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
        });

        // Redirect the user to the homepage
        return res.redirect('/');
    } catch (error) {
        return res.redirect('/login');
    }
});

// Auth middleware function
async function withAuth(req, res, next) {
    const session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies['wos-session'],
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
    });

    const { authenticated, reason } = await session.authenticate();

    if (authenticated) {
        return next();
    }

    // If the cookie is missing, redirect to login
    if (!authenticated && reason === 'no_session_cookie_provided') {
        return res.redirect('/login');
    }

    // If the session is invalid, attempt to refresh
    try {
        const { authenticated, sealedSession } = await session.refresh();

        if (!authenticated) {
            return res.redirect('/login');
        }

        // update the cookie
        res.cookie('wos-session', sealedSession, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
        });

        // Redirect to the same route to ensure the updated cookie is used
        return res.redirect(req.originalUrl);
    } catch (e) {
        // Failed to refresh access token, redirect user to login page
        // after deleting the cookie
        res.clearCookie('wos-session');
        res.redirect('/login');
    }
}




// Routes
app.get('/', async (req, res) => {
    let isAuthenticated = false;
    try {
        const session = workos.userManagement.loadSealedSession({
            sessionData: req.cookies['wos-session'],
            cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
        });
        const { authenticated } = await session.authenticate();
        isAuthenticated = authenticated;
    } catch (error) {
        isAuthenticated = false;
    }

    res.render('home', {
        title: 'Home',
        data: {
            message: '',
            authenticated: isAuthenticated
        }
    });
});

app.get('/public', async (req, res) => {
    let isAuthenticated = false;
    try {
        const session = workos.userManagement.loadSealedSession({
            sessionData: req.cookies['wos-session'],
            cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
        });
        const { authenticated } = await session.authenticate();
        isAuthenticated = authenticated;
    } catch (error) {
        isAuthenticated = false;
    }

    res.render('public', {
        title: 'Public Page',
        data: {
            message: 'This is public data',
            authenticated: isAuthenticated
        }
    });
});

app.get('/secret', withAuth, (req, res) => {
    res.render('secret', {
        title: 'Secret Page',
        data: {
            message: 'This is secret data',
            authenticated: true
        }
    });
});

app.get('/logout', async (req, res) => {
    const session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies['wos-session'],
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
    });

    const url = await session.getLogoutUrl();

    res.clearCookie('wos-session');
    res.redirect(url + "&return_to=http://localhost:3000/");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 