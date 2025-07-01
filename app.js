const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();

app.use(express.urlencoded({ extended: true }));

// For JSON data (if applicable)
app.use(express.json());

// Session middleware
app.use(session({
  secret: 'CookingBlogSecretSession',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set secure: true if you're using HTTPS
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(expressLayouts);

app.use(cookieParser('CookingBlogSecure'));
app.use(flash());
app.use(fileUpload());

// Middleware to set res.locals.isAuthenticated
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn || false;  // Default to false if not logged in
  next();
});

app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Routes
const routes = require('./server/routes/recipeRoutes.js');
app.use('/', routes);

app.listen(port, () => console.log(`Listening to port ${port}`));
