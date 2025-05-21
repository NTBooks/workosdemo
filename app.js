require('dotenv').config();
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Handlebars setup
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
};

// Routes
app.get('/', (req, res) => {
    res.render('home', {
        title: 'Home',
        authenticated: req.session.authenticated
    });
});

app.get('/public', (req, res) => {
    res.render('public', {
        title: 'Public Page',
        data: { message: 'This is public data' },
        authenticated: req.session.authenticated
    });
});

app.get('/secret', requireAuth, (req, res) => {
    res.render('secret', {
        title: 'Secret Page',
        data: { message: 'This is secret data' },
        authenticated: req.session.authenticated
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Simple authentication for demo purposes
    if (username === 'admin' && password === 'password') {
        req.session.authenticated = true;
        res.status(200).json({ status: 'success', message: 'Login successful' });
    } else {
        res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 