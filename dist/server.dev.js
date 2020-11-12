"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require("body-parser"),
    json = _require.json;

var _require2 = require("express"),
    response = _require2.response;

var _require3 = require("inspector"),
    url = _require3.url;

var express = require("express"),
    session = require("express-session"),
    passport = require("passport"),
    SpotifyStrategy = require("passport-spotify").Strategy,
    consolidate = require("consolidate"),
    mongoose = require('mongoose'),
    axios = require('axios'),
    querystring = require('querystring'),
    underscore = require('underscore'),
    helmet = require("helmet"),
    csp = require("helmet-csp");

require("dotenv").config();

var authCallbackPath = "https://play-gen.herokuapp.com/callback/"; //setting up database connection

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
var user = mongoose.model('user', userSchema); //axios different functions
// this function is used for get calls, time is initialized to undefined for get calls that don't need to use time-ranges

function axiosGetCall(url, header) {
  var time,
      _response,
      _response2,
      _args = arguments;

  return regeneratorRuntime.async(function axiosGetCall$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          time = _args.length > 2 && _args[2] !== undefined ? _args[2] : undefined;

          if (!(time === undefined)) {
            _context.next = 8;
            break;
          }

          _context.next = 4;
          return regeneratorRuntime.awrap(axios({
            url: url,
            headers: header
          }).then(function (res) {
            return res.data;
          })["catch"](function (error) {
            if (error.response) {
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              console.log(error.request);
            } else {
              console.log('Error', error.message);
            }

            console.log(error.config);
          }));

        case 4:
          _response = _context.sent;
          return _context.abrupt("return", _response);

        case 8:
          _context.next = 10;
          return regeneratorRuntime.awrap(axios({
            url: url,
            headers: header,
            time_range: time
          }).then(function (res) {
            return res.data;
          })["catch"](function (error) {
            if (error.response) {
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              console.log(error.request);
            } else {
              console.log('Error', error.message);
            }

            console.log(error.config);
          }));

        case 10:
          _response2 = _context.sent;
          return _context.abrupt("return", _response2);

        case 12:
        case "end":
          return _context.stop();
      }
    }
  });
} // this function creates a new playlist for a user


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
            //we want the id to return so we can add things to the playlist
            return res.data.id;
          })["catch"](function (error) {
            if (error.response) {
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              console.log(error.request);
            } else {
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
} // this function adds items to a playlist for a user


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
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              console.log(error.request);
            } else {
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
} // Taken from the passport-spotify example


passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
var currentUserId; // Taken from the passport-spotify example

passport.use(new SpotifyStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'https://play-gen.herokuapp.com/callback/'
}, function (accessToken, refreshToken, expires_in, profile, done) {
  process.nextTick(function _callee() {
    var userExist, newUser;
    return regeneratorRuntime.async(function _callee$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            currentUserId = profile.id;
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
              _id: currentUserId
            }, {
              accessToken: accessToken,
              refreshToken: refreshToken
            }));

          case 7:
            _context4.next = 11;
            break;

          case 9:
            newUser = new user({
              _id: currentUserId,
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
app.get("/how-to", function (req, res) {
  res.render("how-to.html");
}); // authorizing the user and passing the scopes

app.get("/auth/spotify", passport.authenticate("spotify", {
  scope: ["user-top-read", "playlist-modify-public", "playlist-modify-private", "playlist-read-private"],
  showDialog: true
})); // redirecting back to the website after a successful redirect

app.get(authCallbackPath, passport.authenticate("spotify", {
  failureRedirect: "/"
}), function (req, res) {
  res.redirect("/");
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
}); // these two functions create urls for the call
// this one creates the url used to create a playlist

function playlistUrlCreator(baseUrl, playlistId, uris) {
  baseUrl += playlistId + '/tracks?uris=';
  var globalExp = /:/g;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = uris[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      item = _step.value;
      baseUrl += item.replace(globalExp, '%3A');

      if (item !== uris[uris.length - 1]) {
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
} // this one creates a url to get recommendations from the web api


function recUrlCreator(baseUrl, queryParameter, items) {
  baseUrl += '&' + queryParameter + '=';
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = items[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      k = _step2.value;
      baseUrl += k;

      if (k !== items[items.length - 1]) {
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
} // this function gets recommended tracks


function newPlaylistTracks(num_songs) {
  var foundUser, nonJsonHeaders, jsonHeaders, artistsUrl, tracksUrl, artistsObject, tracksObject, genresFound, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7, ids, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, genres, artists, tracks, recUrl, recommendations, recomTrackUris, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6;

  return regeneratorRuntime.async(function newPlaylistTracks$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context5.sent;
          nonJsonHeaders = {
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          };
          jsonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          }; // I then create the urls with the query parameters desired
          // I decided on taking a sample later on from a population of 50 recommended artists and 100 recommended tracks, 
          //since this might help diversify the pool a bit 
          // Also, the time range was set to medium term to get a bit more accurate picture of the user's
          // recent listening habits

          artistsUrl = 'https://api.spotify.com/v1/me/top/artists?' + querystring.stringify({
            limit: '100',
            time_range: 'medium_term'
          });
          tracksUrl = 'https://api.spotify.com/v1/me/top/tracks?' + querystring.stringify({
            limit: '100',
            time_range: 'medium_term'
          }); // Then 2 GET requests get the required data we need to make reccomendations using spotify's api

          _context5.next = 9;
          return regeneratorRuntime.awrap(axiosGetCall(artistsUrl, nonJsonHeaders));

        case 9:
          artistsObject = _context5.sent;
          _context5.next = 12;
          return regeneratorRuntime.awrap(axiosGetCall(tracksUrl, nonJsonHeaders));

        case 12:
          tracksObject = _context5.sent;
          // To get the genres, I decided on finding the unique genres found in the top artists listened to by the user
          genresFound = [];
          _iteratorNormalCompletion3 = true;
          _didIteratorError3 = false;
          _iteratorError3 = undefined;
          _context5.prev = 17;
          _iterator3 = artistsObject.items[Symbol.iterator]();

        case 19:
          if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
            _context5.next = 43;
            break;
          }

          artist = _step3.value;
          _iteratorNormalCompletion7 = true;
          _didIteratorError7 = false;
          _iteratorError7 = undefined;
          _context5.prev = 24;

          for (_iterator7 = artist.genres[Symbol.iterator](); !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            genre = _step7.value;

            if (genresFound.indexOf(genre) === -1) {
              genresFound.push(genre);
            }
          }

          _context5.next = 32;
          break;

        case 28:
          _context5.prev = 28;
          _context5.t0 = _context5["catch"](24);
          _didIteratorError7 = true;
          _iteratorError7 = _context5.t0;

        case 32:
          _context5.prev = 32;
          _context5.prev = 33;

          if (!_iteratorNormalCompletion7 && _iterator7["return"] != null) {
            _iterator7["return"]();
          }

        case 35:
          _context5.prev = 35;

          if (!_didIteratorError7) {
            _context5.next = 38;
            break;
          }

          throw _iteratorError7;

        case 38:
          return _context5.finish(35);

        case 39:
          return _context5.finish(32);

        case 40:
          _iteratorNormalCompletion3 = true;
          _context5.next = 19;
          break;

        case 43:
          _context5.next = 49;
          break;

        case 45:
          _context5.prev = 45;
          _context5.t1 = _context5["catch"](17);
          _didIteratorError3 = true;
          _iteratorError3 = _context5.t1;

        case 49:
          _context5.prev = 49;
          _context5.prev = 50;

          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }

        case 52:
          _context5.prev = 52;

          if (!_didIteratorError3) {
            _context5.next = 55;
            break;
          }

          throw _iteratorError3;

        case 55:
          return _context5.finish(52);

        case 56:
          return _context5.finish(49);

        case 57:
          // Now we need to get the ids of the artsts and tracks we have received
          ids = {
            artists: [],
            tracks: []
          };
          _iteratorNormalCompletion4 = true;
          _didIteratorError4 = false;
          _iteratorError4 = undefined;
          _context5.prev = 61;

          for (_iterator4 = artistsObject.items[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            i = _step4.value;
            ids.artists.push(i.id);
          }

          _context5.next = 69;
          break;

        case 65:
          _context5.prev = 65;
          _context5.t2 = _context5["catch"](61);
          _didIteratorError4 = true;
          _iteratorError4 = _context5.t2;

        case 69:
          _context5.prev = 69;
          _context5.prev = 70;

          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }

        case 72:
          _context5.prev = 72;

          if (!_didIteratorError4) {
            _context5.next = 75;
            break;
          }

          throw _iteratorError4;

        case 75:
          return _context5.finish(72);

        case 76:
          return _context5.finish(69);

        case 77:
          _iteratorNormalCompletion5 = true;
          _didIteratorError5 = false;
          _iteratorError5 = undefined;
          _context5.prev = 80;

          for (_iterator5 = tracksObject.items[Symbol.iterator](); !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            j = _step5.value;
            ids.tracks.push(j.id);
          } // Now we sample the lists we have created to get a total of 5 seeds for the recommendation path of the web api


          _context5.next = 88;
          break;

        case 84:
          _context5.prev = 84;
          _context5.t3 = _context5["catch"](80);
          _didIteratorError5 = true;
          _iteratorError5 = _context5.t3;

        case 88:
          _context5.prev = 88;
          _context5.prev = 89;

          if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
            _iterator5["return"]();
          }

        case 91:
          _context5.prev = 91;

          if (!_didIteratorError5) {
            _context5.next = 94;
            break;
          }

          throw _iteratorError5;

        case 94:
          return _context5.finish(91);

        case 95:
          return _context5.finish(88);

        case 96:
          genres = underscore.sample(genresFound, 2);
          artists = underscore.sample(ids.artists, 2);
          tracks = underscore.sample(ids.tracks, 1); // Finally we must create the string for the query we want to send to the spotify api
          // Notice how the user's number of songs was implemented

          recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + num_songs;
          recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
          recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
          recUrl = recUrlCreator(recUrl, 'seed_tracks', tracks); // now the recommended tracks are requested from Spotify

          _context5.next = 105;
          return regeneratorRuntime.awrap(axiosGetCall(recUrl, jsonHeaders));

        case 105:
          recommendations = _context5.sent;
          // the tracks are then put into an array that is returned
          recomTrackUris = [];
          _iteratorNormalCompletion6 = true;
          _didIteratorError6 = false;
          _iteratorError6 = undefined;
          _context5.prev = 110;

          for (_iterator6 = recommendations.tracks[Symbol.iterator](); !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            item = _step6.value;
            recomTrackUris.push(item.uri);
          }

          _context5.next = 118;
          break;

        case 114:
          _context5.prev = 114;
          _context5.t4 = _context5["catch"](110);
          _didIteratorError6 = true;
          _iteratorError6 = _context5.t4;

        case 118:
          _context5.prev = 118;
          _context5.prev = 119;

          if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
            _iterator6["return"]();
          }

        case 121:
          _context5.prev = 121;

          if (!_didIteratorError6) {
            _context5.next = 124;
            break;
          }

          throw _iteratorError6;

        case 124:
          return _context5.finish(121);

        case 125:
          return _context5.finish(118);

        case 126:
          return _context5.abrupt("return", recomTrackUris);

        case 127:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[17, 45, 49, 57], [24, 28, 32, 40], [33,, 35, 39], [50,, 52, 56], [61, 65, 69, 77], [70,, 72, 76], [80, 84, 88, 96], [89,, 91, 95], [110, 114, 118, 126], [119,, 121, 125]]);
} //function to get the current date, gotten from stackoverflow


function getDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

  var yyyy = today.getFullYear();
  return mm + '/' + dd + '/' + yyyy;
}

app.get("/new", function _callee2(req, res) {
  var foundUser, jsonHeaders, publicState, uris, newPlaylistDetails, newPlaylistUrl, newPlaylistId, addPlaylistUrl;
  return regeneratorRuntime.async(function _callee2$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context6.sent;
          jsonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          }; // getting whether or not the user wanted a public or private playlist

          if (req.query.private_checkbox === undefined) {
            publicState = 'true';
          } else {
            publicState = 'false';
          } // getting track uris


          _context6.next = 7;
          return regeneratorRuntime.awrap(newPlaylistTracks(Number(req.query.num_songs).toString()));

        case 7:
          uris = _context6.sent;
          // the details needed in order to create a new playlist
          newPlaylistDetails = {
            name: req.query.playlist_name,
            "public": publicState,
            description: "Created on " + getDate()
          };
          newPlaylistUrl = 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists'; // the axios call will return the new playlist's id while also creating the playlist

          _context6.next = 12;
          return regeneratorRuntime.awrap(newPlaylistCreation(newPlaylistUrl, jsonHeaders, newPlaylistDetails));

        case 12:
          newPlaylistId = _context6.sent;
          // I used the id returned from the creation in order to create the url, while also adding the track uris to the url
          addPlaylistUrl = playlistUrlCreator('https://api.spotify.com/v1/playlists/', newPlaylistId, uris);
          _context6.next = 16;
          return regeneratorRuntime.awrap(addPlaylistItems(addPlaylistUrl, jsonHeaders));

        case 16:
          res.json("Success!");
          res.redirect("/");

        case 18:
        case "end":
          return _context6.stop();
      }
    }
  });
});

function multipleArtistUrl(artists) {
  var returnUrl = 'https://api.spotify.com/v1/artists?ids=';
  var _iteratorNormalCompletion8 = true;
  var _didIteratorError8 = false;
  var _iteratorError8 = undefined;

  try {
    for (var _iterator8 = artists[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
      artist = _step8.value;
      returnUrl += artist;

      if (artist !== artists[artists.length - 1]) {
        returnUrl += '%2C';
      }
    }
  } catch (err) {
    _didIteratorError8 = true;
    _iteratorError8 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion8 && _iterator8["return"] != null) {
        _iterator8["return"]();
      }
    } finally {
      if (_didIteratorError8) {
        throw _iteratorError8;
      }
    }
  }

  return returnUrl;
}

function modifyPlaylist(name, num_songs) {
  var foundUser, jsonHeaders, playlists, match, matchedId, tracksUrl, _iteratorNormalCompletion9, _didIteratorError9, _iteratorError9, _iterator9, _step9, foundPlaylist, trackIds, empty, _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, artists, genres, _iteratorNormalCompletion11, _didIteratorError11, _iteratorError11, _iterator11, _step11, sampledArtists, artistUrl, severalArtists, _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, _iteratorNormalCompletion14, _didIteratorError14, _iteratorError14, _iterator14, _step14, seedArtists, seedGenres, seedTracks, recUrl, recommendations, uris, _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13, postUrl;

  return regeneratorRuntime.async(function modifyPlaylist$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context7.sent;
          jsonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          };
          _context7.next = 6;
          return regeneratorRuntime.awrap(axiosGetCall('https://api.spotify.com/v1/users/' + currentUserId + '/playlists', jsonHeaders));

        case 6:
          playlists = _context7.sent;
          // if the inputted name doesn't exist, then the match variable should be false and I notify the user
          match = false;
          _iteratorNormalCompletion9 = true;
          _didIteratorError9 = false;
          _iteratorError9 = undefined;
          _context7.prev = 11;
          _iterator9 = playlists.items[Symbol.iterator]();

        case 13:
          if (_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done) {
            _context7.next = 23;
            break;
          }

          playlist = _step9.value;

          if (!(playlist.name.toLowerCase() === name.toLowerCase())) {
            _context7.next = 20;
            break;
          }

          match = true; // I use these later on

          matchedId = playlist.id;
          tracksUrl = playlist.tracks.href; // no need to continue the loop, hopefully the user knows the name of their playlist

          return _context7.abrupt("break", 23);

        case 20:
          _iteratorNormalCompletion9 = true;
          _context7.next = 13;
          break;

        case 23:
          _context7.next = 29;
          break;

        case 25:
          _context7.prev = 25;
          _context7.t0 = _context7["catch"](11);
          _didIteratorError9 = true;
          _iteratorError9 = _context7.t0;

        case 29:
          _context7.prev = 29;
          _context7.prev = 30;

          if (!_iteratorNormalCompletion9 && _iterator9["return"] != null) {
            _iterator9["return"]();
          }

        case 32:
          _context7.prev = 32;

          if (!_didIteratorError9) {
            _context7.next = 35;
            break;
          }

          throw _iteratorError9;

        case 35:
          return _context7.finish(32);

        case 36:
          return _context7.finish(29);

        case 37:
          if (!match) {
            _context7.next = 170;
            break;
          }

          _context7.next = 40;
          return regeneratorRuntime.awrap(axiosGetCall('https://api.spotify.com/v1/playlists/' + matchedId, jsonHeaders));

        case 40:
          foundPlaylist = _context7.sent;
          // trackIds are only really gonna be used for the recommendation part of the api and to check if there are existing tracks in the playlist
          trackIds = []; // if for some reason the user gave an empty playlist, I need to check for this otherwise there is no point
          // and they should create a new playlist instead using the other path that's set up

          empty = false;
          _iteratorNormalCompletion10 = true;
          _didIteratorError10 = false;
          _iteratorError10 = undefined;
          _context7.prev = 46;

          for (_iterator10 = foundPlaylist.tracks.items[Symbol.iterator](); !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
            item = _step10.value;
            trackIds.push(item.track.id);
          }

          _context7.next = 54;
          break;

        case 50:
          _context7.prev = 50;
          _context7.t1 = _context7["catch"](46);
          _didIteratorError10 = true;
          _iteratorError10 = _context7.t1;

        case 54:
          _context7.prev = 54;
          _context7.prev = 55;

          if (!_iteratorNormalCompletion10 && _iterator10["return"] != null) {
            _iterator10["return"]();
          }

        case 57:
          _context7.prev = 57;

          if (!_didIteratorError10) {
            _context7.next = 60;
            break;
          }

          throw _iteratorError10;

        case 60:
          return _context7.finish(57);

        case 61:
          return _context7.finish(54);

        case 62:
          if (trackIds.length === 0) {
            empty = true;
          }

          if (empty) {
            _context7.next = 167;
            break;
          }

          artists = [];
          genres = []; // I opted to only get the main artist's id since it'd be easier to code for, as there are many
          // collaborations of artists from differing genres and a playlist is bound to have repeats of artists

          _iteratorNormalCompletion11 = true;
          _didIteratorError11 = false;
          _iteratorError11 = undefined;
          _context7.prev = 69;

          for (_iterator11 = foundPlaylist.tracks.items[Symbol.iterator](); !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
            item = _step11.value;

            if (artists.indexOf(item.track.artists[0].id) === -1) {
              artists.push(item.track.artists[0].id);
            }

            ;
          } // the get multiple artists part of the Artist API only allows up to 50 artists to be queried
          // if there are less than 50 artists in a playlist, no biggie as it just gets all of the artists
          // I just did this instead of trying to get all artists because if a playlist has 500 unique artists
          // then I'd have to end up doing 10 calls to the get multiple artist part of the Artist API and this 
          // would slow everything down


          _context7.next = 77;
          break;

        case 73:
          _context7.prev = 73;
          _context7.t2 = _context7["catch"](69);
          _didIteratorError11 = true;
          _iteratorError11 = _context7.t2;

        case 77:
          _context7.prev = 77;
          _context7.prev = 78;

          if (!_iteratorNormalCompletion11 && _iterator11["return"] != null) {
            _iterator11["return"]();
          }

        case 80:
          _context7.prev = 80;

          if (!_didIteratorError11) {
            _context7.next = 83;
            break;
          }

          throw _iteratorError11;

        case 83:
          return _context7.finish(80);

        case 84:
          return _context7.finish(77);

        case 85:
          sampledArtists = underscore.sample(artists, 50);
          artistUrl = multipleArtistUrl(sampledArtists); // now the artists object will be returned here from the API

          _context7.next = 89;
          return regeneratorRuntime.awrap(axiosGetCall(artistUrl, jsonHeaders));

        case 89:
          severalArtists = _context7.sent;
          // Why did I do all that? The track objects do not have the genres, so getting the artist objects is
          // the only way to get the genre associated with the track. This isn't 100% but it's the best
          // way I could think of getting the genres in a playlist.
          // I did the same thing I did for artists here, getting only the unique genres 
          _iteratorNormalCompletion12 = true;
          _didIteratorError12 = false;
          _iteratorError12 = undefined;
          _context7.prev = 93;
          _iterator12 = severalArtists.artists[Symbol.iterator]();

        case 95:
          if (_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done) {
            _context7.next = 119;
            break;
          }

          artist = _step12.value;
          _iteratorNormalCompletion14 = true;
          _didIteratorError14 = false;
          _iteratorError14 = undefined;
          _context7.prev = 100;

          for (_iterator14 = artist.genres[Symbol.iterator](); !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
            genre = _step14.value;

            if (genres.indexOf(genre) === -1) {
              genres.push(genre);
            }
          }

          _context7.next = 108;
          break;

        case 104:
          _context7.prev = 104;
          _context7.t3 = _context7["catch"](100);
          _didIteratorError14 = true;
          _iteratorError14 = _context7.t3;

        case 108:
          _context7.prev = 108;
          _context7.prev = 109;

          if (!_iteratorNormalCompletion14 && _iterator14["return"] != null) {
            _iterator14["return"]();
          }

        case 111:
          _context7.prev = 111;

          if (!_didIteratorError14) {
            _context7.next = 114;
            break;
          }

          throw _iteratorError14;

        case 114:
          return _context7.finish(111);

        case 115:
          return _context7.finish(108);

        case 116:
          _iteratorNormalCompletion12 = true;
          _context7.next = 95;
          break;

        case 119:
          _context7.next = 125;
          break;

        case 121:
          _context7.prev = 121;
          _context7.t4 = _context7["catch"](93);
          _didIteratorError12 = true;
          _iteratorError12 = _context7.t4;

        case 125:
          _context7.prev = 125;
          _context7.prev = 126;

          if (!_iteratorNormalCompletion12 && _iterator12["return"] != null) {
            _iterator12["return"]();
          }

        case 128:
          _context7.prev = 128;

          if (!_didIteratorError12) {
            _context7.next = 131;
            break;
          }

          throw _iteratorError12;

        case 131:
          return _context7.finish(128);

        case 132:
          return _context7.finish(125);

        case 133:
          // now to get the reccommended tracks for the playlist I'll use the Browse API
          // I can only use 5 seeds in total, so I made it so we have at least 3 seeds and at most 5
          seedArtists = artists.length > 1 ? underscore.sample(artists, 2) : underscore.sample(artists, 1);
          seedGenres = seedArtists.length >= 1 && genres.length > 1 ? underscore.sample(genres, 2) : underscore.sample(genres, 1);
          seedTracks = seedArtists.length + seedGenres.length < 4 ? underscore.sample(trackIds, 2) : underscore.sample(trackIds, 1);
          recUrl = recUrlCreator('https://api.spotify.com/v1/recommendations?=limit=' + num_songs, 'seed_artists', seedArtists);
          recUrl = recUrlCreator(recUrl, 'seed_genres', seedGenres);
          recUrl = recUrlCreator(recUrl, 'seed_tracks', seedTracks); // Now I finally get the recommended track uris

          _context7.next = 141;
          return regeneratorRuntime.awrap(axiosGetCall(recUrl, jsonHeaders));

        case 141:
          recommendations = _context7.sent;
          uris = [];
          _iteratorNormalCompletion13 = true;
          _didIteratorError13 = false;
          _iteratorError13 = undefined;
          _context7.prev = 146;

          for (_iterator13 = recommendations.tracks[Symbol.iterator](); !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
            rec = _step13.value;
            uris.push(rec.uri);
          } // The last step is to simply make a post request to add the tracks to the playlist


          _context7.next = 154;
          break;

        case 150:
          _context7.prev = 150;
          _context7.t5 = _context7["catch"](146);
          _didIteratorError13 = true;
          _iteratorError13 = _context7.t5;

        case 154:
          _context7.prev = 154;
          _context7.prev = 155;

          if (!_iteratorNormalCompletion13 && _iterator13["return"] != null) {
            _iterator13["return"]();
          }

        case 157:
          _context7.prev = 157;

          if (!_didIteratorError13) {
            _context7.next = 160;
            break;
          }

          throw _iteratorError13;

        case 160:
          return _context7.finish(157);

        case 161:
          return _context7.finish(154);

        case 162:
          postUrl = playlistUrlCreator('https://api.spotify.com/v1/playlists/', matchedId, uris);
          _context7.next = 165;
          return regeneratorRuntime.awrap(addPlaylistItems(postUrl, jsonHeaders));

        case 165:
          _context7.next = 168;
          break;

        case 167:
          return _context7.abrupt("return", 'noSong');

        case 168:
          _context7.next = 171;
          break;

        case 170:
          return _context7.abrupt("return", 'noPlay');

        case 171:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[11, 25, 29, 37], [30,, 32, 36], [46, 50, 54, 62], [55,, 57, 61], [69, 73, 77, 85], [78,, 80, 84], [93, 121, 125, 133], [100, 104, 108, 116], [109,, 111, 115], [126,, 128, 132], [146, 150, 154, 162], [155,, 157, 161]]);
}

app.get('/mod', function _callee3(req, res) {
  var result;
  return regeneratorRuntime.async(function _callee3$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return regeneratorRuntime.awrap(modifyPlaylist(req.query.mod_playlist_name, req.query.add_songs));

        case 2:
          result = _context8.sent;

          if (result === 'noSong') {
            res.json("There weren't any songs in the requested playlist. Use the other form if you want to create a new playlist from scratch!");
          } else if (result === 'noPlay') {
            res.json('No playlist found of that name. Please try again.');
          } else {
            res.json("Success!");
          }

          res.redirect("/");

        case 5:
        case "end":
          return _context8.stop();
      }
    }
  });
});
var port = process.env.PORT;

if (port == null || port == "") {
  port = 8000;
}

app.listen(port); // ensure the user is still authenticated

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/");
}