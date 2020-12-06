const { json } = require("body-parser");
const { response } = require("express");
const { url } = require("inspector");

// modified from the passport-spotify example

const express = require("express"),
  session = require("express-session"),
  passport = require("passport"),
  SpotifyStrategy = require("passport-spotify").Strategy,
  consolidate = require("consolidate"),
  mongoose = require('mongoose'),
  helmet = require("helmet"),
  csp = require("helmet-csp"),
  apiFuncs = require("./app");

require("dotenv").config();

const authCallbackPath = "/auth/spotify/callback",
  authUserCallbackPath = "/auth/spotify/callback/user";

//setting up database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', () => {
  console.log("connected!");
});
mongoose.set('useFindAndModify', false);
//making the user schema and model to be used
const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true }
});

const user = mongoose.model('user', userSchema);

// Taken from the passport-spotify example
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// used for some of the Spotify API
let currentUserId;


let cbUrl = 'https://play-gen.herokuapp.com' + authCallbackPath; //deployed environment
// let cbUrl = 'http://localhost:' + process.env.PORT + authCallbackPath //local testing

passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: cbUrl,
    },
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(async function () {
        currentUserId = profile.id;
        let userExist = await user.exists({ _id: profile.id });

        if (userExist) {
          await user.findOneAndUpdate({ _id: currentUserId }, { accessToken: accessToken, refreshToken: refreshToken });
        } else {
          const newUser = new user({
            _id: currentUserId,
            accessToken: accessToken,
            refreshToken: refreshToken
          });
          newUser.save();
        }

        return done(null, profile);
      });
    }
  )
);

const app = express();

// configure Express
app.set("views", __dirname + "/views");
app.set("view engine", "html");
app.use(express.json());

// security
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy());
app.use(helmet.dnsPrefetchControl());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...csp.getDefaultDirectives(),
      "default-src": ["'self'", "https://ka-f.fontawesome.com/releases/v5.15.1/css/free.min.css", "https://ka-f.fontawesome.com/releases/v5.15.1/css/free-v4-shims.min.css", "https://ka-f.fontawesome.com/releases/v5.15.1/css/free-v4-font-face.min.css"],
      "script-src": ["'self'", "https://kit.fontawesome.com/63ada23c4f.js", "https://code.jquery.com/jquery-3.5.1.slim.min.js", "https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js", "'unsafe-inline'"],
    },
  })
);

app.use(
  session({ secret: "keyboard cat", resave: true, saveUninitialized: true })
);

//initializing passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + "/views/public"));

app.engine("html", consolidate.nunjucks);

app.get("/", function (req, res) {
  res.render("index.html", { user: req.user });
});

app.get('/user-input', function (req, res) {
  res.render("user-input.html", { user: req.user });
});

app.get('/404', function (req, res) {
  res.render("error.html");
});

app.get('/choose', function (req, res) {
  res.render("choose.html", { user: req.user });
});

app.get('/rec', function (req, res) {
  res.render("rec.html", { user: req.user })
});

app.get('/404', function (req, res) {
  res.render("error.html", { user: req.user });
})

// authorizing the user and passing the scopes
app.get(
  "/auth/spotify",
  passport.authenticate("spotify", {
    scope: ["user-top-read", "playlist-modify-public", "playlist-modify-private", "playlist-read-private"],
    showDialog: true,
  })
);

// redirecting back to the website after a successful redirect
app.get(
  authCallbackPath,
  passport.authenticate("spotify", { failureRedirect: "/404" }),
  function (req, res) {
    res.redirect("/choose");
  }
);

app.get(
  authUserCallbackPath,
  passport.authenticate("spotify", { failureRedirect: "/404" }),
  function (req, res) {
    res.redirect("/user-input");
  }
);

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/new", async (req, res) => {
  // getting the user for the accesstoken, which is to be used in the header created
  let foundUser = await user.find({ _id: currentUserId });
  const jsonHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + foundUser[0].accessToken };
  // getting track uris
  let uris = await apiFuncs.newPlaylistTracks(Number(req.query.num_songs).toString(), foundUser);
  // getting whether or not the user wanted a public or private playlist
  let publicState;
  if (req.query.private_checkbox === undefined) {
    publicState = 'true';
  } else {
    publicState = 'false';
  }
  // the details needed in order to create a new playlist
  let newPlaylistDetails = { name: req.query.new_playlist_name, public: publicState, description: "Created on " + apiFuncs.getDate() };
  let newPlaylistUrl = 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists';
  // the axios call will return the new playlist's id while also creating the playlist
  let newPlaylistId = await apiFuncs.axiosCall({ method: 'post', url: newPlaylistUrl, headers: jsonHeaders, data: newPlaylistDetails, dataType: 'json' }, 'new');
  // the new playlist is then filled with songs here
  await apiFuncs.addSongsToNewPlaylist(uris, newPlaylistId, req.query.num_songs, jsonHeaders);
  res.redirect("/rec");
});

app.get('/mod', async (req, res) => {
  let foundUser = await user.find({ _id: currentUserId });
  let result = await apiFuncs.addToExisting(req.query.mod_playlist_name, req.query.add_songs, foundUser, currentUserId);
  res.redirect("/rec");
});

app.get('/user-new', async (req, res) => {
  let foundUser = await user.find({ _id: currentUserId });
  let result  = await apiFuncs.newUserTracks(req.query, foundUser, currentUserId);
  if(result === 'error'){
    res.json({status: 401, error: "Error: The track wasn't found. Please go back and enter another one."});
  }else{
    res.redirect('/user-input');
  }
});

app.get('/user-mod', async (req, res) => {
  let foundUser = await user.find({ _id: currentUserId });
  await apiFuncs.userMod(req.query, foundUser, currentUserId);
  res.redirect('/user-input');
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);