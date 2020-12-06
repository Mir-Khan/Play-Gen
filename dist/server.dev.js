"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require("body-parser"),
    json = _require.json;

var _require2 = require("express"),
    response = _require2.response;

var _require3 = require("inspector"),
    url = _require3.url; // modified from the passport-spotify example


var express = require("express"),
    session = require("express-session"),
    passport = require("passport"),
    SpotifyStrategy = require("passport-spotify").Strategy,
    consolidate = require("consolidate"),
    mongoose = require('mongoose'),
    helmet = require("helmet"),
    csp = require("helmet-csp"),
    apiFuncs = require("./app");

require("dotenv").config();

var authCallbackPath = "/auth/spotify/callback",
    authUserCallbackPath = "/auth/spotify/callback/user"; //setting up database connection

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function () {
  console.log("connected!");
});
mongoose.set('useFindAndModify', false); //making the user schema and model to be used

var userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  }
});
var user = mongoose.model('user', userSchema); // Taken from the passport-spotify example

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
}); // used for some of the Spotify API

var currentUserId; // let cbUrl = 'https://play-gen.herokuapp.com' + authCallbackPath; //deployed environment

var cbUrl = 'http://localhost:' + process.env.PORT + authCallbackPath; //local testing

passport.use(new SpotifyStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: cbUrl
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function _callee() {
    var userExist, newUser;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            currentUserId = profile.id;
            _context.next = 3;
            return regeneratorRuntime.awrap(user.exists({
              _id: profile.id
            }));

          case 3:
            userExist = _context.sent;

            if (!userExist) {
              _context.next = 9;
              break;
            }

            _context.next = 7;
            return regeneratorRuntime.awrap(user.findOneAndUpdate({
              _id: currentUserId
            }, {
              accessToken: accessToken,
              refreshToken: refreshToken
            }));

          case 7:
            _context.next = 11;
            break;

          case 9:
            newUser = new user({
              _id: currentUserId,
              accessToken: accessToken,
              refreshToken: refreshToken
            });
            newUser.save();

          case 11:
            return _context.abrupt("return", done(null, profile));

          case 12:
          case "end":
            return _context.stop();
        }
      }
    });
  });
}));
var app = express(); // configure Express

app.set("views", __dirname + "/views");
app.set("view engine", "html");
app.use(express.json()); // security

app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.contentSecurityPolicy({
  directives: _objectSpread({}, csp.getDefaultDirectives(), {
    "default-src": ["'self'", "https://ka-f.fontawesome.com/releases/v5.15.1/css/free.min.css", "https://ka-f.fontawesome.com/releases/v5.15.1/css/free-v4-shims.min.css", "https://ka-f.fontawesome.com/releases/v5.15.1/css/free-v4-font-face.min.css"],
    "script-src": ["'self'", "https://kit.fontawesome.com/63ada23c4f.js", "https://code.jquery.com/jquery-3.5.1.slim.min.js", "https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js", "'unsafe-inline'"]
  })
}));
app.use(session({
  secret: "keyboard cat",
  resave: true,
  saveUninitialized: true
})); //initializing passport

app.use(passport.initialize());
app.use(passport.session());
app.use(express["static"](__dirname + "/views/public"));
app.engine("html", consolidate.nunjucks);
app.get("/", function (req, res) {
  res.render("index.html", {
    user: req.user
  });
});
app.get('/user-input', function (req, res) {
  res.render("user-input.html", {
    user: req.user
  });
});
app.get('/404', function (req, res) {
  res.render("error.html");
});
app.get('/choose', function (req, res) {
  res.render("choose.html", {
    user: req.user
  });
});
app.get('/rec', function (req, res) {
  res.render("rec.html", {
    user: req.user
  });
});
app.get('/404', function (req, res) {
  res.render("error.html", {
    user: req.user
  });
}); // authorizing the user and passing the scopes

app.get("/auth/spotify", passport.authenticate("spotify", {
  scope: ["user-top-read", "playlist-modify-public", "playlist-modify-private", "playlist-read-private"],
  showDialog: true
})); // redirecting back to the website after a successful redirect

app.get(authCallbackPath, passport.authenticate("spotify", {
  failureRedirect: "/404"
}), function (req, res) {
  res.redirect("/choose");
});
app.get(authUserCallbackPath, passport.authenticate("spotify", {
  failureRedirect: "/404"
}), function (req, res) {
  res.redirect("/user-input");
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
app.get("/new", function _callee2(req, res) {
  var foundUser, jsonHeaders, uris, publicState, newPlaylistDetails, newPlaylistUrl, newPlaylistId;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context2.sent;
          jsonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          }; // getting track uris

          _context2.next = 6;
          return regeneratorRuntime.awrap(apiFuncs.newPlaylistTracks(Number(req.query.num_songs).toString(), foundUser));

        case 6:
          uris = _context2.sent;

          if (req.query.private_checkbox === undefined) {
            publicState = 'true';
          } else {
            publicState = 'false';
          } // the details needed in order to create a new playlist


          newPlaylistDetails = {
            name: req.query.new_playlist_name,
            "public": publicState,
            description: "Created on " + apiFuncs.getDate()
          };
          newPlaylistUrl = 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists'; // the axios call will return the new playlist's id while also creating the playlist

          _context2.next = 12;
          return regeneratorRuntime.awrap(apiFuncs.axiosCall({
            method: 'post',
            url: newPlaylistUrl,
            headers: jsonHeaders,
            data: newPlaylistDetails,
            dataType: 'json'
          }, 'new'));

        case 12:
          newPlaylistId = _context2.sent;
          _context2.next = 15;
          return regeneratorRuntime.awrap(apiFuncs.addSongsToNewPlaylist(uris, newPlaylistId, req.query.num_songs, jsonHeaders));

        case 15:
          res.redirect("/rec");

        case 16:
        case "end":
          return _context2.stop();
      }
    }
  });
});
app.get('/mod', function _callee3(req, res) {
  var foundUser, result;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context3.sent;
          _context3.next = 5;
          return regeneratorRuntime.awrap(apiFuncs.addToExisting(req.query.mod_playlist_name, req.query.add_songs, foundUser, currentUserId));

        case 5:
          result = _context3.sent;
          res.redirect("/rec");

        case 7:
        case "end":
          return _context3.stop();
      }
    }
  });
});
app.get('/user-new', function _callee4(req, res) {
  var foundUser, result;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context4.sent;
          _context4.next = 5;
          return regeneratorRuntime.awrap(apiFuncs.newUserTracks(req.query, foundUser, currentUserId));

        case 5:
          result = _context4.sent;

          if (result === 'error') {
            res.json({
              status: 401,
              error: "Error: The track wasn't found. Please go back and enter another one."
            });
          } else {
            res.redirect('/user-input');
          }

        case 7:
        case "end":
          return _context4.stop();
      }
    }
  });
});
app.get('/user-mod', function _callee5(req, res) {
  var foundUser;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context5.sent;
          _context5.next = 5;
          return regeneratorRuntime.awrap(apiFuncs.userMod(req.query, foundUser, currentUserId));

        case 5:
          res.redirect('/user-input');

        case 6:
        case "end":
          return _context5.stop();
      }
    }
  });
});
var port = process.env.PORT;

if (port == null || port == "") {
  port = 8000;
}

app.listen(port);