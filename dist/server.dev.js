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
    axios = require('axios'),
    querystring = require('querystring'),
    underscore = require('underscore'),
    helmet = require("helmet"),
    csp = require("helmet-csp");

require("dotenv").config();

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
var user = mongoose.model('user', userSchema); //axios different functions

function axiosCall(callObject) {
  var type,
      response,
      _args = arguments;
  return regeneratorRuntime.async(function axiosCall$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          type = _args.length > 1 && _args[1] !== undefined ? _args[1] : undefined;
          _context.next = 3;
          return regeneratorRuntime.awrap(axios(callObject).then(function (res) {
            if (type === 'new') {
              // for a new playlist we need the id
              return res.data.id;
            } else if (type === 'add') {
              // this is just for the id of the version of the playlist, not really needed
              // but this is put here so I don't get an error from the other two blocks in this if-else statement
              console.log(res.data.snapshot_id);
            } else {
              return res.data;
            }
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

        case 3:
          response = _context.sent;
          return _context.abrupt("return", response);

        case 5:
        case "end":
          return _context.stop();
      }
    }
  });
} // Taken from the passport-spotify example


passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
}); // used for some of the Spotify API

var currentUserId; // Taken from the passport-spotify example

var cbUrl = 'https://play-gen.herokuapp.com' + authCallbackPath; //deployed environment
// let cbUrl = 'http://localhost:' + process.env.PORT + authCallbackPath //local testing

passport.use(new SpotifyStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: cbUrl
}, function (accessToken, refreshToken, expires_in, profile, done) {
  process.nextTick(function _callee() {
    var userExist, newUser;
    return regeneratorRuntime.async(function _callee$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            currentUserId = profile.id;
            _context2.next = 3;
            return regeneratorRuntime.awrap(user.exists({
              _id: profile.id
            }));

          case 3:
            userExist = _context2.sent;

            if (!userExist) {
              _context2.next = 9;
              break;
            }

            _context2.next = 7;
            return regeneratorRuntime.awrap(user.findOneAndUpdate({
              _id: currentUserId
            }, {
              accessToken: accessToken,
              refreshToken: refreshToken
            }));

          case 7:
            _context2.next = 11;
            break;

          case 9:
            newUser = new user({
              _id: currentUserId,
              accessToken: accessToken,
              refreshToken: refreshToken
            });
            newUser.save();

          case 11:
            return _context2.abrupt("return", done(null, profile));

          case 12:
          case "end":
            return _context2.stop();
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
}); // this one creates a url to get recommendations from the web api

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
} // this function gets recommended tracks


function newPlaylistTracks(num_songs) {
  var foundUser, nonJsonHeaders, jsonHeaders, artistsUrl, tracksUrl, artistsObject, tracksObject, genresFound, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, ids, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, genres, artists, tracks, recUrl, _recommendations, recomTrackUris, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, _recomTrackUris, _recommendations2, numIters, _i, _recUrl, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, remainingSongs, _recUrl2, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7;

  return regeneratorRuntime.async(function newPlaylistTracks$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context3.sent;
          nonJsonHeaders = {
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          };
          jsonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          }; // I then create the urls with the query parameters desired
          // I decided on taking a sample later on from a population of 100 recommended artists and 100 recommended tracks, 
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

          _context3.next = 9;
          return regeneratorRuntime.awrap(axiosCall({
            url: artistsUrl,
            headers: nonJsonHeaders
          }));

        case 9:
          artistsObject = _context3.sent;
          _context3.next = 12;
          return regeneratorRuntime.awrap(axiosCall({
            url: tracksUrl,
            headers: nonJsonHeaders
          }));

        case 12:
          tracksObject = _context3.sent;
          // To get the genres, I decided on finding the unique genres found in the top artists listened to by the user
          genresFound = [];
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context3.prev = 17;
          _iterator2 = artistsObject.items[Symbol.iterator]();

        case 19:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context3.next = 43;
            break;
          }

          artist = _step2.value;
          _iteratorNormalCompletion8 = true;
          _didIteratorError8 = false;
          _iteratorError8 = undefined;
          _context3.prev = 24;

          for (_iterator8 = artist.genres[Symbol.iterator](); !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            genre = _step8.value;

            if (genresFound.indexOf(genre) === -1) {
              genresFound.push(genre);
            }
          }

          _context3.next = 32;
          break;

        case 28:
          _context3.prev = 28;
          _context3.t0 = _context3["catch"](24);
          _didIteratorError8 = true;
          _iteratorError8 = _context3.t0;

        case 32:
          _context3.prev = 32;
          _context3.prev = 33;

          if (!_iteratorNormalCompletion8 && _iterator8["return"] != null) {
            _iterator8["return"]();
          }

        case 35:
          _context3.prev = 35;

          if (!_didIteratorError8) {
            _context3.next = 38;
            break;
          }

          throw _iteratorError8;

        case 38:
          return _context3.finish(35);

        case 39:
          return _context3.finish(32);

        case 40:
          _iteratorNormalCompletion2 = true;
          _context3.next = 19;
          break;

        case 43:
          _context3.next = 49;
          break;

        case 45:
          _context3.prev = 45;
          _context3.t1 = _context3["catch"](17);
          _didIteratorError2 = true;
          _iteratorError2 = _context3.t1;

        case 49:
          _context3.prev = 49;
          _context3.prev = 50;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 52:
          _context3.prev = 52;

          if (!_didIteratorError2) {
            _context3.next = 55;
            break;
          }

          throw _iteratorError2;

        case 55:
          return _context3.finish(52);

        case 56:
          return _context3.finish(49);

        case 57:
          // Now we need to get the ids of the artsts and tracks we have received
          ids = {
            artists: [],
            tracks: []
          };
          _iteratorNormalCompletion3 = true;
          _didIteratorError3 = false;
          _iteratorError3 = undefined;
          _context3.prev = 61;

          for (_iterator3 = artistsObject.items[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            i = _step3.value;
            ids.artists.push(i.id);
          }

          _context3.next = 69;
          break;

        case 65:
          _context3.prev = 65;
          _context3.t2 = _context3["catch"](61);
          _didIteratorError3 = true;
          _iteratorError3 = _context3.t2;

        case 69:
          _context3.prev = 69;
          _context3.prev = 70;

          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }

        case 72:
          _context3.prev = 72;

          if (!_didIteratorError3) {
            _context3.next = 75;
            break;
          }

          throw _iteratorError3;

        case 75:
          return _context3.finish(72);

        case 76:
          return _context3.finish(69);

        case 77:
          _iteratorNormalCompletion4 = true;
          _didIteratorError4 = false;
          _iteratorError4 = undefined;
          _context3.prev = 80;

          for (_iterator4 = tracksObject.items[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            j = _step4.value;
            ids.tracks.push(j.id);
          } // Now we sample the lists we have created to get a total of 5 seeds for the recommendation path of the web api


          _context3.next = 88;
          break;

        case 84:
          _context3.prev = 84;
          _context3.t3 = _context3["catch"](80);
          _didIteratorError4 = true;
          _iteratorError4 = _context3.t3;

        case 88:
          _context3.prev = 88;
          _context3.prev = 89;

          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }

        case 91:
          _context3.prev = 91;

          if (!_didIteratorError4) {
            _context3.next = 94;
            break;
          }

          throw _iteratorError4;

        case 94:
          return _context3.finish(91);

        case 95:
          return _context3.finish(88);

        case 96:
          genres = underscore.sample(genresFound, 2);
          artists = underscore.sample(ids.artists, 2);
          tracks = underscore.sample(ids.tracks, 1); // Finally we must create the string for the query we want to send to the spotify api
          // There's two different behaviors, depending on the number of songs requested
          // If there were more than 100 songs requested, we use the api multiple times to get all the recommended tracks

          if (!(Number(num_songs) < 100)) {
            _context3.next = 130;
            break;
          }

          recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + num_songs;
          recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
          recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
          recUrl = recUrlCreator(recUrl, 'seed_tracks', tracks); // now the recommended tracks are requested from Spotify

          _context3.next = 106;
          return regeneratorRuntime.awrap(axiosCall({
            url: recUrl,
            headers: jsonHeaders
          }));

        case 106:
          _recommendations = _context3.sent;
          // the tracks are then put into an array that is returned
          recomTrackUris = [];
          _iteratorNormalCompletion5 = true;
          _didIteratorError5 = false;
          _iteratorError5 = undefined;
          _context3.prev = 111;

          for (_iterator5 = _recommendations.tracks[Symbol.iterator](); !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            item = _step5.value;
            recomTrackUris.push(item.uri);
          }

          _context3.next = 119;
          break;

        case 115:
          _context3.prev = 115;
          _context3.t4 = _context3["catch"](111);
          _didIteratorError5 = true;
          _iteratorError5 = _context3.t4;

        case 119:
          _context3.prev = 119;
          _context3.prev = 120;

          if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
            _iterator5["return"]();
          }

        case 122:
          _context3.prev = 122;

          if (!_didIteratorError5) {
            _context3.next = 125;
            break;
          }

          throw _iteratorError5;

        case 125:
          return _context3.finish(122);

        case 126:
          return _context3.finish(119);

        case 127:
          return _context3.abrupt("return", recomTrackUris);

        case 130:
          _recomTrackUris = [];

          if (Number(num_songs) % 100 === 0) {
            numIters = Math.floor(Number(num_songs) / 100);
          } else {
            numIters = Math.floor(Number(num_songs) / 100) + 1;
          }

          _i = 0;

        case 133:
          if (!(_i < numIters)) {
            _context3.next = 193;
            break;
          }

          if (!(_i !== numIters - 1)) {
            _context3.next = 163;
            break;
          }

          _recUrl = 'https://api.spotify.com/v1/recommendations?limit=100';
          _recUrl = recUrlCreator(_recUrl, 'seed_artists', artists);
          _recUrl = recUrlCreator(_recUrl, 'seed_genres', genres);
          _recUrl = recUrlCreator(_recUrl, 'seed_tracks', tracks);
          _context3.next = 141;
          return regeneratorRuntime.awrap(axiosCall({
            url: _recUrl,
            headers: jsonHeaders
          }));

        case 141:
          _recommendations2 = _context3.sent;
          _iteratorNormalCompletion6 = true;
          _didIteratorError6 = false;
          _iteratorError6 = undefined;
          _context3.prev = 145;

          for (_iterator6 = _recommendations2.tracks[Symbol.iterator](); !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            item = _step6.value;

            _recomTrackUris.push(item.uri);
          }

          _context3.next = 153;
          break;

        case 149:
          _context3.prev = 149;
          _context3.t5 = _context3["catch"](145);
          _didIteratorError6 = true;
          _iteratorError6 = _context3.t5;

        case 153:
          _context3.prev = 153;
          _context3.prev = 154;

          if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
            _iterator6["return"]();
          }

        case 156:
          _context3.prev = 156;

          if (!_didIteratorError6) {
            _context3.next = 159;
            break;
          }

          throw _iteratorError6;

        case 159:
          return _context3.finish(156);

        case 160:
          return _context3.finish(153);

        case 161:
          _context3.next = 190;
          break;

        case 163:
          remainingSongs = Number(num_songs) - 100 * (numIters - 1);
          _recUrl2 = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
          _recUrl2 = recUrlCreator(_recUrl2, 'seed_artists', artists);
          _recUrl2 = recUrlCreator(_recUrl2, 'seed_genres', genres);
          _recUrl2 = recUrlCreator(_recUrl2, 'seed_tracks', tracks);
          _context3.next = 170;
          return regeneratorRuntime.awrap(axiosCall({
            url: _recUrl2,
            headers: jsonHeaders
          }));

        case 170:
          _recommendations2 = _context3.sent;
          _iteratorNormalCompletion7 = true;
          _didIteratorError7 = false;
          _iteratorError7 = undefined;
          _context3.prev = 174;

          for (_iterator7 = _recommendations2.tracks[Symbol.iterator](); !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            item = _step7.value;

            _recomTrackUris.push(item.uri);
          }

          _context3.next = 182;
          break;

        case 178:
          _context3.prev = 178;
          _context3.t6 = _context3["catch"](174);
          _didIteratorError7 = true;
          _iteratorError7 = _context3.t6;

        case 182:
          _context3.prev = 182;
          _context3.prev = 183;

          if (!_iteratorNormalCompletion7 && _iterator7["return"] != null) {
            _iterator7["return"]();
          }

        case 185:
          _context3.prev = 185;

          if (!_didIteratorError7) {
            _context3.next = 188;
            break;
          }

          throw _iteratorError7;

        case 188:
          return _context3.finish(185);

        case 189:
          return _context3.finish(182);

        case 190:
          _i++;
          _context3.next = 133;
          break;

        case 193:
          return _context3.abrupt("return", _recomTrackUris);

        case 194:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[17, 45, 49, 57], [24, 28, 32, 40], [33,, 35, 39], [50,, 52, 56], [61, 65, 69, 77], [70,, 72, 76], [80, 84, 88, 96], [89,, 91, 95], [111, 115, 119, 127], [120,, 122, 126], [145, 149, 153, 161], [154,, 156, 160], [174, 178, 182, 190], [183,, 185, 189]]);
} //function to get the current date, gotten from stackoverflow


function getDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

  var yyyy = today.getFullYear();
  return mm + '/' + dd + '/' + yyyy;
}

app.get("/new", function _callee2(req, res) {
  var foundUser, jsonHeaders, publicState, uris, newPlaylistDetails, newPlaylistUrl, newPlaylistId, numIters, lastIndex, selections, _i2, currentSelection, remainingUris, _j, _j2, _i3, _selections, dataBody, addPlaylistUrl, _dataBody, _addPlaylistUrl;

  return regeneratorRuntime.async(function _callee2$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context4.sent;
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


          _context4.next = 7;
          return regeneratorRuntime.awrap(newPlaylistTracks(Number(req.query.num_songs).toString()));

        case 7:
          uris = _context4.sent;
          // the details needed in order to create a new playlist
          newPlaylistDetails = {
            name: req.query.new_playlist_name,
            "public": publicState,
            description: "Created on " + getDate()
          };
          newPlaylistUrl = 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists'; // the axios call will return the new playlist's id while also creating the playlist

          _context4.next = 12;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: newPlaylistUrl,
            headers: jsonHeaders,
            data: newPlaylistDetails,
            dataType: 'json'
          }, 'new'));

        case 12:
          newPlaylistId = _context4.sent;

          if (!(Number(req.query.num_songs) > 100)) {
            _context4.next = 30;
            break;
          }

          numIters = Number(req.query.num_songs) % 100 !== 0 ? Math.floor(Number(req.query.num_songs) / 100) + 1 : Math.floor(Number(req.query.num_songs) / 100);
          lastIndex = 0;
          selections = [];

          for (_i2 = 0; _i2 < numIters; _i2++) {
            currentSelection = [];

            if (_i2 === numIters - 1) {
              remainingUris = uris.length - _i2 * 100;

              for (_j = 0; _j < remainingUris; _j++) {
                currentSelection.push(uris[lastIndex]);
                lastIndex++;
              }
            } else {
              for (_j2 = 0; _j2 < 100; _j2++) {
                currentSelection.push(uris[lastIndex]);
                lastIndex++;
              }
            }

            selections.push(currentSelection);
          }

          _i3 = 0, _selections = selections;

        case 19:
          if (!(_i3 < _selections.length)) {
            _context4.next = 28;
            break;
          }

          selection = _selections[_i3];
          dataBody = {
            "uris": selection
          };
          addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + newPlaylistId + '/tracks';
          _context4.next = 25;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: addPlaylistUrl,
            headers: jsonHeaders,
            data: dataBody
          }, 'add'));

        case 25:
          _i3++;
          _context4.next = 19;
          break;

        case 28:
          _context4.next = 34;
          break;

        case 30:
          _dataBody = {
            "uris": uris
          };
          _addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + newPlaylistId + '/tracks';
          _context4.next = 34;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: _addPlaylistUrl,
            headers: jsonHeaders,
            data: _dataBody
          }, 'add'));

        case 34:
          res.redirect("/");

        case 35:
        case "end":
          return _context4.stop();
      }
    }
  });
});

function multipleArtistUrl(artists) {
  var returnUrl = 'https://api.spotify.com/v1/artists?ids=';
  var _iteratorNormalCompletion9 = true;
  var _didIteratorError9 = false;
  var _iteratorError9 = undefined;

  try {
    for (var _iterator9 = artists[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
      artist = _step9.value;
      returnUrl += artist;

      if (artist !== artists[artists.length - 1]) {
        returnUrl += '%2C';
      }
    }
  } catch (err) {
    _didIteratorError9 = true;
    _iteratorError9 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion9 && _iterator9["return"] != null) {
        _iterator9["return"]();
      }
    } finally {
      if (_didIteratorError9) {
        throw _iteratorError9;
      }
    }
  }

  return returnUrl;
}

function addToExisting(name, num_songs) {
  var foundUser, jsonHeaders, playlists, match, matchedId, tracksUrl, _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, foundPlaylist, trackIds, empty, _iteratorNormalCompletion11, _didIteratorError11, _iteratorError11, _iterator11, _step11, artists, genres, _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, sampledArtists, artistUrl, severalArtists, _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13, _iteratorNormalCompletion16, _didIteratorError16, _iteratorError16, _iterator16, _step16, seedArtists, seedGenres, seedTracks, uris, numIters, _i4, recUrl, _iteratorNormalCompletion14, _didIteratorError14, _iteratorError14, _iterator14, _step14, remainingSongs, _recUrl3, _iteratorNormalCompletion15, _didIteratorError15, _iteratorError15, _iterator15, _step15, lastIndex, selections, _i5, currentSelection, remainingUris, _j3, _j4, _i6, _selections2, dataBody, addPlaylistUrl, _dataBody2, _addPlaylistUrl2;

  return regeneratorRuntime.async(function addToExisting$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(user.find({
            _id: currentUserId
          }));

        case 2:
          foundUser = _context5.sent;
          jsonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          };
          _context5.next = 6;
          return regeneratorRuntime.awrap(axiosCall({
            url: 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists',
            headers: jsonHeaders
          }));

        case 6:
          playlists = _context5.sent;
          // if the inputted name doesn't exist, then the match variable should be false and I notify the user
          match = false;
          _iteratorNormalCompletion10 = true;
          _didIteratorError10 = false;
          _iteratorError10 = undefined;
          _context5.prev = 11;
          _iterator10 = playlists.items[Symbol.iterator]();

        case 13:
          if (_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done) {
            _context5.next = 23;
            break;
          }

          playlist = _step10.value;

          if (!(playlist.name.toLowerCase() === name.toLowerCase())) {
            _context5.next = 20;
            break;
          }

          match = true; // I use these later on

          matchedId = playlist.id;
          tracksUrl = playlist.tracks.href; // no need to continue the loop, hopefully the user knows the name of their playlist

          return _context5.abrupt("break", 23);

        case 20:
          _iteratorNormalCompletion10 = true;
          _context5.next = 13;
          break;

        case 23:
          _context5.next = 29;
          break;

        case 25:
          _context5.prev = 25;
          _context5.t0 = _context5["catch"](11);
          _didIteratorError10 = true;
          _iteratorError10 = _context5.t0;

        case 29:
          _context5.prev = 29;
          _context5.prev = 30;

          if (!_iteratorNormalCompletion10 && _iterator10["return"] != null) {
            _iterator10["return"]();
          }

        case 32:
          _context5.prev = 32;

          if (!_didIteratorError10) {
            _context5.next = 35;
            break;
          }

          throw _iteratorError10;

        case 35:
          return _context5.finish(32);

        case 36:
          return _context5.finish(29);

        case 37:
          if (!match) {
            _context5.next = 224;
            break;
          }

          _context5.next = 40;
          return regeneratorRuntime.awrap(axiosCall({
            url: 'https://api.spotify.com/v1/playlists/' + matchedId,
            headers: jsonHeaders
          }));

        case 40:
          foundPlaylist = _context5.sent;
          // trackIds are only really gonna be used for the recommendation part of the api and to check if there are existing tracks in the playlist
          trackIds = []; // if for some reason the user gave an empty playlist, I need to check for this otherwise there is no point
          // and they should create a new playlist instead using the other path that's set up

          empty = false;
          _iteratorNormalCompletion11 = true;
          _didIteratorError11 = false;
          _iteratorError11 = undefined;
          _context5.prev = 46;

          for (_iterator11 = foundPlaylist.tracks.items[Symbol.iterator](); !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
            item = _step11.value;
            trackIds.push(item.track.id);
          }

          _context5.next = 54;
          break;

        case 50:
          _context5.prev = 50;
          _context5.t1 = _context5["catch"](46);
          _didIteratorError11 = true;
          _iteratorError11 = _context5.t1;

        case 54:
          _context5.prev = 54;
          _context5.prev = 55;

          if (!_iteratorNormalCompletion11 && _iterator11["return"] != null) {
            _iterator11["return"]();
          }

        case 57:
          _context5.prev = 57;

          if (!_didIteratorError11) {
            _context5.next = 60;
            break;
          }

          throw _iteratorError11;

        case 60:
          return _context5.finish(57);

        case 61:
          return _context5.finish(54);

        case 62:
          if (trackIds.length === 0) {
            empty = true;
          }

          if (empty) {
            _context5.next = 221;
            break;
          }

          artists = [];
          genres = []; // I opted to only get the main artist's id since it'd be easier to code for, as there are many
          // collaborations of artists from differing genres and a playlist is bound to have repeats of artists

          _iteratorNormalCompletion12 = true;
          _didIteratorError12 = false;
          _iteratorError12 = undefined;
          _context5.prev = 69;

          for (_iterator12 = foundPlaylist.tracks.items[Symbol.iterator](); !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
            item = _step12.value;

            if (artists.indexOf(item.track.artists[0].id) === -1) {
              artists.push(item.track.artists[0].id);
            }

            ;
          } // the get multiple artists part of the Artist API only allows up to 50 artists to be queried
          // if there are less than 50 artists in a playlist, no biggie as it just gets all of the artists
          // I just did this instead of trying to get all artists because if a playlist has 500 unique artists
          // then I'd have to end up doing 10 calls to the get multiple artist part of the Artist API and this 
          // would slow everything down


          _context5.next = 77;
          break;

        case 73:
          _context5.prev = 73;
          _context5.t2 = _context5["catch"](69);
          _didIteratorError12 = true;
          _iteratorError12 = _context5.t2;

        case 77:
          _context5.prev = 77;
          _context5.prev = 78;

          if (!_iteratorNormalCompletion12 && _iterator12["return"] != null) {
            _iterator12["return"]();
          }

        case 80:
          _context5.prev = 80;

          if (!_didIteratorError12) {
            _context5.next = 83;
            break;
          }

          throw _iteratorError12;

        case 83:
          return _context5.finish(80);

        case 84:
          return _context5.finish(77);

        case 85:
          sampledArtists = underscore.sample(artists, 50);
          artistUrl = multipleArtistUrl(sampledArtists); // now the artists object will be returned here from the API

          _context5.next = 89;
          return regeneratorRuntime.awrap(axiosCall({
            url: artistUrl,
            headers: jsonHeaders
          }));

        case 89:
          severalArtists = _context5.sent;
          // Why did I do all that? The track objects do not have the genres, so getting the artist objects is
          // the only way to get the genre associated with the track. This isn't 100% but it's the best
          // way I could think of getting the genres in a playlist.
          // I did the same thing I did for artists here, getting only the unique genres 
          _iteratorNormalCompletion13 = true;
          _didIteratorError13 = false;
          _iteratorError13 = undefined;
          _context5.prev = 93;
          _iterator13 = severalArtists.artists[Symbol.iterator]();

        case 95:
          if (_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done) {
            _context5.next = 119;
            break;
          }

          artist = _step13.value;
          _iteratorNormalCompletion16 = true;
          _didIteratorError16 = false;
          _iteratorError16 = undefined;
          _context5.prev = 100;

          for (_iterator16 = artist.genres[Symbol.iterator](); !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
            genre = _step16.value;

            if (genres.indexOf(genre) === -1) {
              genres.push(genre);
            }
          }

          _context5.next = 108;
          break;

        case 104:
          _context5.prev = 104;
          _context5.t3 = _context5["catch"](100);
          _didIteratorError16 = true;
          _iteratorError16 = _context5.t3;

        case 108:
          _context5.prev = 108;
          _context5.prev = 109;

          if (!_iteratorNormalCompletion16 && _iterator16["return"] != null) {
            _iterator16["return"]();
          }

        case 111:
          _context5.prev = 111;

          if (!_didIteratorError16) {
            _context5.next = 114;
            break;
          }

          throw _iteratorError16;

        case 114:
          return _context5.finish(111);

        case 115:
          return _context5.finish(108);

        case 116:
          _iteratorNormalCompletion13 = true;
          _context5.next = 95;
          break;

        case 119:
          _context5.next = 125;
          break;

        case 121:
          _context5.prev = 121;
          _context5.t4 = _context5["catch"](93);
          _didIteratorError13 = true;
          _iteratorError13 = _context5.t4;

        case 125:
          _context5.prev = 125;
          _context5.prev = 126;

          if (!_iteratorNormalCompletion13 && _iterator13["return"] != null) {
            _iterator13["return"]();
          }

        case 128:
          _context5.prev = 128;

          if (!_didIteratorError13) {
            _context5.next = 131;
            break;
          }

          throw _iteratorError13;

        case 131:
          return _context5.finish(128);

        case 132:
          return _context5.finish(125);

        case 133:
          // now to get the reccommended tracks for the playlist I'll use the Browse API
          // I can only use 5 seeds in total, so I made it so we have at least 3 seeds and at most 5
          seedArtists = artists.length > 1 ? underscore.sample(artists, 2) : underscore.sample(artists, 1);
          seedGenres = seedArtists.length >= 1 && genres.length > 1 ? underscore.sample(genres, 2) : underscore.sample(genres, 1);
          seedTracks = seedArtists.length + seedGenres.length < 4 ? underscore.sample(trackIds, 2) : underscore.sample(trackIds, 1);
          uris = [];
          numIters = Number(num_songs) % 100 === 0 ? Math.floor(Number(num_songs) / 100) : Math.floor(Number(num_songs) / 100) + 1;
          _i4 = 0;

        case 139:
          if (!(_i4 < numIters)) {
            _context5.next = 199;
            break;
          }

          if (!(_i4 < numIters - 1)) {
            _context5.next = 169;
            break;
          }

          recUrl = 'https://api.spotify.com/v1/recommendations?limit=100';
          recUrl = recUrlCreator(recUrl, 'seed_artists', seedArtists);
          recUrl = recUrlCreator(recUrl, 'seed_genres', seedGenres);
          recUrl = recUrlCreator(recUrl, 'seed_tracks', seedTracks);
          _context5.next = 147;
          return regeneratorRuntime.awrap(axiosCall({
            url: recUrl,
            headers: jsonHeaders
          }));

        case 147:
          recommendations = _context5.sent;
          _iteratorNormalCompletion14 = true;
          _didIteratorError14 = false;
          _iteratorError14 = undefined;
          _context5.prev = 151;

          for (_iterator14 = recommendations.tracks[Symbol.iterator](); !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
            item = _step14.value;
            uris.push(item.uri);
          }

          _context5.next = 159;
          break;

        case 155:
          _context5.prev = 155;
          _context5.t5 = _context5["catch"](151);
          _didIteratorError14 = true;
          _iteratorError14 = _context5.t5;

        case 159:
          _context5.prev = 159;
          _context5.prev = 160;

          if (!_iteratorNormalCompletion14 && _iterator14["return"] != null) {
            _iterator14["return"]();
          }

        case 162:
          _context5.prev = 162;

          if (!_didIteratorError14) {
            _context5.next = 165;
            break;
          }

          throw _iteratorError14;

        case 165:
          return _context5.finish(162);

        case 166:
          return _context5.finish(159);

        case 167:
          _context5.next = 196;
          break;

        case 169:
          remainingSongs = Number(num_songs) - 100 * (numIters - 1);
          _recUrl3 = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
          _recUrl3 = recUrlCreator(_recUrl3, 'seed_artists', seedArtists);
          _recUrl3 = recUrlCreator(_recUrl3, 'seed_genres', seedGenres);
          _recUrl3 = recUrlCreator(_recUrl3, 'seed_tracks', seedTracks);
          _context5.next = 176;
          return regeneratorRuntime.awrap(axiosCall({
            url: _recUrl3,
            headers: jsonHeaders
          }));

        case 176:
          recommendations = _context5.sent;
          _iteratorNormalCompletion15 = true;
          _didIteratorError15 = false;
          _iteratorError15 = undefined;
          _context5.prev = 180;

          for (_iterator15 = recommendations.tracks[Symbol.iterator](); !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
            item = _step15.value;
            uris.push(item.uri);
          }

          _context5.next = 188;
          break;

        case 184:
          _context5.prev = 184;
          _context5.t6 = _context5["catch"](180);
          _didIteratorError15 = true;
          _iteratorError15 = _context5.t6;

        case 188:
          _context5.prev = 188;
          _context5.prev = 189;

          if (!_iteratorNormalCompletion15 && _iterator15["return"] != null) {
            _iterator15["return"]();
          }

        case 191:
          _context5.prev = 191;

          if (!_didIteratorError15) {
            _context5.next = 194;
            break;
          }

          throw _iteratorError15;

        case 194:
          return _context5.finish(191);

        case 195:
          return _context5.finish(188);

        case 196:
          _i4++;
          _context5.next = 139;
          break;

        case 199:
          if (!(Number(num_songs) > 100)) {
            _context5.next = 215;
            break;
          }

          lastIndex = 0;
          selections = [];

          for (_i5 = 0; _i5 < numIters; _i5++) {
            currentSelection = [];

            if (_i5 === numIters - 1) {
              remainingUris = uris.length - _i5 * 100;

              for (_j3 = 0; _j3 < remainingUris; _j3++) {
                currentSelection.push(uris[lastIndex]);
                lastIndex++;
              }
            } else {
              for (_j4 = 0; _j4 < 100; _j4++) {
                currentSelection.push(uris[lastIndex]);
                lastIndex++;
              }
            }

            selections.push(currentSelection);
          }

          _i6 = 0, _selections2 = selections;

        case 204:
          if (!(_i6 < _selections2.length)) {
            _context5.next = 213;
            break;
          }

          selection = _selections2[_i6];
          dataBody = {
            "uris": selection
          };
          addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + matchedId + '/tracks';
          _context5.next = 210;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: addPlaylistUrl,
            headers: jsonHeaders,
            data: dataBody
          }, 'add'));

        case 210:
          _i6++;
          _context5.next = 204;
          break;

        case 213:
          _context5.next = 219;
          break;

        case 215:
          _dataBody2 = {
            "uris": uris
          };
          _addPlaylistUrl2 = 'https://api.spotify.com/v1/playlists/' + matchedId + '/tracks';
          _context5.next = 219;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: _addPlaylistUrl2,
            headers: jsonHeaders,
            data: _dataBody2
          }, 'add'));

        case 219:
          _context5.next = 222;
          break;

        case 221:
          return _context5.abrupt("return", 'noSong');

        case 222:
          _context5.next = 225;
          break;

        case 224:
          return _context5.abrupt("return", 'noPlay');

        case 225:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[11, 25, 29, 37], [30,, 32, 36], [46, 50, 54, 62], [55,, 57, 61], [69, 73, 77, 85], [78,, 80, 84], [93, 121, 125, 133], [100, 104, 108, 116], [109,, 111, 115], [126,, 128, 132], [151, 155, 159, 167], [160,, 162, 166], [180, 184, 188, 196], [189,, 191, 195]]);
}

app.get('/mod', function _callee3(req, res) {
  var result;
  return regeneratorRuntime.async(function _callee3$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return regeneratorRuntime.awrap(addToExisting(req.query.mod_playlist_name, req.query.add_songs));

        case 2:
          result = _context6.sent;
          res.redirect("/");

        case 4:
        case "end":
          return _context6.stop();
      }
    }
  });
});
var port = process.env.PORT;

if (port == null || port == "") {
  port = 8000;
}

app.listen(port);