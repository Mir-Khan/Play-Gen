"use strict";

var _require = require("express"),
    response = _require.response;
/** GET TOP ARTISTS, TOP GENRES, AND QUERY PARAMETERS, */


var express = require("express"),
    session = require("express-session"),
    passport = require("passport"),
    SpotifyStrategy = require("passport-spotify").Strategy,
    consolidate = require("consolidate"),
    mongoose = require('mongoose'),
    axios = require('axios'),
    querystring = require('querystring'),
    underscore = require('underscore');

require("dotenv").config();

var port = 8888;
var authCallbackPath = "/auth/spotify/callback"; //setting up database connection

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
var user = mongoose.model('user', userSchema);
var recSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  genres: {
    type: Array,
    required: true
  }
});
var recs = mongoose.model('rec', recSchema); //axios function setup

function axiosGetCall(url, header) {
  var response;
  return regeneratorRuntime.async(function axiosGetCall$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(axios({
            url: url,
            headers: header
          }).then(function (res) {
            return res.data;
          })["catch"](function (error) {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              // The request was made but no response was received
              // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
              // http.ClientRequest in node.js
              console.log(error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.log('Error', error.message);
            }

            console.log(error.config);
          }));

        case 2:
          response = _context.sent;
          return _context.abrupt("return", response);

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
}

function newPlaylistCreation(url, header, data) {
  var response;
  return regeneratorRuntime.async(function newPlaylistCreation$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(axios({
            method: 'post',
            url: url,
            data: data,
            dataType: 'json',
            headers: header
          }).then(function (res) {
            return res.data.id;
          })["catch"](function (error) {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              // The request was made but no response was received
              // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
              // http.ClientRequest in node.js
              console.log(error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.log('Error', error.message);
            }

            console.log(error.config);
          }));

        case 2:
          response = _context2.sent;
          return _context2.abrupt("return", response);

        case 4:
        case "end":
          return _context2.stop();
      }
    }
  });
}

function addPlaylistItems(url, header) {
  var response;
  return regeneratorRuntime.async(function addPlaylistItems$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(axios({
            method: 'post',
            url: url,
            headers: header
          }).then(function (res) {
            console.log(res.data.snapshot_id);
          })["catch"](function (error) {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              // The request was made but no response was received
              // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
              // http.ClientRequest in node.js
              console.log(error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.log('Error', error.message);
            }

            console.log(error.config);
          }));

        case 2:
          response = _context3.sent;
          return _context3.abrupt("return", response);

        case 4:
        case "end":
          return _context3.stop();
      }
    }
  });
} // Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete spotify profile is serialized
//   and deserialized.


passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
var currentUser; // Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, expires_in
//   and spotify profile), and invoke a callback with a user object.

passport.use(new SpotifyStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:" + port + authCallbackPath
}, function (accessToken, refreshToken, expires_in, profile, done) {
  process.nextTick(function _callee() {
    var userExist, newUser;
    return regeneratorRuntime.async(function _callee$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            // To keep the example simple, the user's spotify profile is returned to
            // represent the logged-in user. In a typical application, you would want
            // to associate the spotify account with a user record in your database,
            // and return that user instead.
            currentUser = profile.id;
            _context4.next = 3;
            return regeneratorRuntime.awrap(user.exists({
              _id: profile.id
            }));

          case 3:
            userExist = _context4.sent;

            if (!userExist) {
              _context4.next = 9;
              break;
            }

            _context4.next = 7;
            return regeneratorRuntime.awrap(user.findOneAndUpdate({
              _id: currentUser
            }, {
              accessToken: accessToken,
              refreshToken: refreshToken
            }));

          case 7:
            _context4.next = 11;
            break;

          case 9:
            newUser = new user({
              _id: currentUser,
              accessToken: accessToken,
              refreshToken: refreshToken
            });
            newUser.save();

          case 11:
            return _context4.abrupt("return", done(null, profile));

          case 12:
          case "end":
            return _context4.stop();
        }
      }
    });
  });
}));
var app = express(); // configure Express

app.set("views", __dirname + "/views");
app.set("view engine", "html");
app.use(express.json());
app.use(session({
  secret: "keyboard cat",
  resave: true,
  saveUninitialized: true
})); // Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).

app.use(passport.initialize());
app.use(passport.session());
app.use(express["static"](__dirname + "/public"));
app.engine("html", consolidate.nunjucks);
app.get("/", function (req, res) {
  res.render("index.html", {
    user: req.user
  });
});
app.get("/account", ensureAuthenticated, function (req, res) {
  res.render("account.html", {
    user: req.user
  });
});
app.get("/login", function (req, res) {
  res.render("login.html", {
    user: req.user
  });
}); // GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback

app.get("/auth/spotify", passport.authenticate("spotify", {
  scope: ["user-read-email", "user-read-private", "user-top-read", "playlist-modify-public", "playlist-modify-private", "playlist-read-private"],
  showDialog: true
})); // GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.

app.get(authCallbackPath, passport.authenticate("spotify", {
  failureRedirect: "/"
}), function (req, res) {
  res.redirect("/");
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

function recUrlCreator(baseUrl, queryParameter, items) {
  baseUrl += '&' + queryParameter + '=';
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      k = _step.value;
      baseUrl += k;

      if (k !== items[items.length - 1]) {
        baseUrl += '%2C';
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return baseUrl;
}

function addPlaylistItemUrl(baseUrl, playlistId, uris) {
  baseUrl += playlistId + '/tracks?uris=';
  var globalExp = /:/g;
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = uris[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      item = _step2.value;
      baseUrl += item.replace(globalExp, '%3A');

      if (item !== uris[uris.length - 1]) {
        baseUrl += '%2C';
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
        _iterator2["return"]();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return baseUrl;
}

app.get("/rec", function _callee2(req, res) {
  return regeneratorRuntime.async(function _callee2$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          // // I get the user that's logged in and take their logged access token for the call to spotify's api
          // let foundUser = await user.find({ _id: currentUser });
          // objectCallHeaders = { 'Authorization': 'Bearer ' + foundUser[0].accessToken };
          // // I then create the urls with the query parameters desired
          // let artistsUrl = 'https://api.spotify.com/v1/me/top/artists?' + querystring.stringify({ limit: '30' });
          // let tracksUrl = 'https://api.spotify.com/v1/me/top/tracks?' + querystring.stringify({ limit: '30' });
          // // Then 3 GET requests get the required data we need to make reccomendations using spotify's api
          // let artistsObject = await axiosGetCall(artistsUrl, objectCallHeaders);
          // let tracksObject = await axiosGetCall(tracksUrl, objectCallHeaders);
          // let genreObject = await axiosGetCall('https://api.spotify.com/v1/recommendations/available-genre-seeds', objectCallHeaders);
          // // The reccommended genres are a bit different, we get 50 of them in alphabetical order, 
          // // for this reason sampling using underscore's functions would be a good way to get a 
          // // random seed of reccommendations
          // let genres = underscore.sample(genreObject.genres, 2);
          // // Now we need to get the ids of the objects we have received
          // let artistsIds = [];
          // let tracksIds = [];
          // for (i of artistsObject.items){
          //   artistsIds.push(i.id);
          // }
          // for (j of tracksObject.items){
          //   tracksIds.push(j.id);
          // }
          // let artists = underscore.sample(artistsIds, 2);
          // let tracks = underscore.sample(tracksIds, 1);
          // // Finally we must create the string for the query we want to send to the spotify api
          // let recUrl = 'https://api.spotify.com/v1/recommendations?limit=10';
          // recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
          // recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
          // recUrl = recUrlCreator(recUrl, 'seed_tracks', tracks);
          // // the header is slightly different for the reccomendation call, as it includes content-type and accept
          // let recCallHeaders = {'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + foundUser[0].accessToken };
          // let recommendations = await axiosGetCall(recUrl, recCallHeaders);
          // let recomTrackUris = [];
          // for (item of recommendations.tracks){
          //   recomTrackUris.push(item.uri);
          // }
          // let newPlaylistDetails = {name: 'Test', public: 'false'};
          // let newPlaylistUrl = 'https://api.spotify.com/v1/users/' + currentUser + '/playlists';
          // let newPlaylistId = await newPlaylistCreation(newPlaylistUrl, recCallHeaders, newPlaylistDetails);
          // let addPlaylistUrl = addPlaylistItemUrl('https://api.spotify.com/v1/playlists/', newPlaylistId, recomTrackUris);
          // await addPlaylistItems(addPlaylistUrl, recCallHeaders);
          console.log(req.query);
          res.redirect("/");

        case 2:
        case "end":
          return _context5.stop();
      }
    }
  });
});
app.listen(port, function () {
  console.log("App is listening on port " + port);
}); // Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}