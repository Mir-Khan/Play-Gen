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
  axios = require('axios'),
  querystring = require('querystring'),
  underscore = require('underscore'),
  helmet = require("helmet"),
  csp = require("helmet-csp");

require("dotenv").config();

const authCallbackPath = "/auth/spotify/callback";

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

//axios different functions
async function axiosCall(callObject, type = undefined) {
  const response = await axios(callObject).then(res => {
    if(type === 'new'){
      // for a new playlist we need the id
      return res.data.id;
    }else if(type === 'add'){
      // this is just for the id of the version of the playlist, not really needed
      // but this is put here so I don't get an error from the other two blocks in this if-else statement
      console.log(res.data.snapshot_id);
    }else{
      return res.data;
    }
  }).catch(error => {
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
  });

  return response;
}

// Taken from the passport-spotify example
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// used for some of the Spotify API
let currentUserId;

// Taken from the passport-spotify example
let cbUrl = 'https://play-gen.herokuapp.com' + authCallbackPath; //deployed environment
// let cbUrl = 'http://localhost:' + process.env.PORT + authCallbackPath //local testing

passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: cbUrl,
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
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

app.get("/how-to", function (req, res) {
  res.render("how-to.html");
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
  passport.authenticate("spotify", { failureRedirect: "/" }),
  function (req, res) {
    res.redirect("/");
  }
);

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// this one creates a url to get recommendations from the web api
function recUrlCreator(baseUrl, queryParameter, items) {
  baseUrl += '&' + queryParameter + '=';
  for (k of items) {
    baseUrl += k;
    if (k !== items[items.length - 1]) {
      baseUrl += '%2C';
    }
  }
  return baseUrl;
}

// this function gets recommended tracks
async function newPlaylistTracks(num_songs) {
  let foundUser = await user.find({ _id: currentUserId });
  const nonJsonHeaders = { 'Authorization': 'Bearer ' + foundUser[0].accessToken };
  const jsonHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + foundUser[0].accessToken };
  // I then create the urls with the query parameters desired
  // I decided on taking a sample later on from a population of 100 recommended artists and 100 recommended tracks, 
  //since this might help diversify the pool a bit 
  // Also, the time range was set to medium term to get a bit more accurate picture of the user's
  // recent listening habits
  let artistsUrl = 'https://api.spotify.com/v1/me/top/artists?' + querystring.stringify({ limit: '100', time_range: 'medium_term' });
  let tracksUrl = 'https://api.spotify.com/v1/me/top/tracks?' + querystring.stringify({ limit: '100', time_range: 'medium_term' });
  // Then 2 GET requests get the required data we need to make reccomendations using spotify's api
  let artistsObject = await axiosCall({url: artistsUrl, headers: nonJsonHeaders});
  let tracksObject = await axiosCall({url: tracksUrl, headers: nonJsonHeaders});
  // To get the genres, I decided on finding the unique genres found in the top artists listened to by the user
  let genresFound = [];
  for (artist of artistsObject.items) {
    for (genre of artist.genres) {
      if (genresFound.indexOf(genre) === -1) {
        genresFound.push(genre);
      }
    }
  }
  // Now we need to get the ids of the artsts and tracks we have received
  let ids = { artists: [], tracks: [] }
  for (i of artistsObject.items) {
    ids.artists.push(i.id);
  }
  for (j of tracksObject.items) {
    ids.tracks.push(j.id);
  }
  // Now we sample the lists we have created to get a total of 5 seeds for the recommendation path of the web api
  let genres = underscore.sample(genresFound, 2);
  let artists = underscore.sample(ids.artists, 2);
  let tracks = underscore.sample(ids.tracks, 1);
  // Finally we must create the string for the query we want to send to the spotify api
  // There's two different behaviors, depending on the number of songs requested
  // If there were more than 100 songs requested, we use the api multiple times to get all the recommended tracks
  if (Number(num_songs) < 100) {
    let recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + num_songs;
    recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
    recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
    recUrl = recUrlCreator(recUrl, 'seed_tracks', tracks);
    // now the recommended tracks are requested from Spotify
    let recommendations = await axiosCall({url: recUrl, headers: jsonHeaders});
    // the tracks are then put into an array that is returned
    let recomTrackUris = [];
    for (item of recommendations.tracks) {
      recomTrackUris.push(item.uri);
    }
    return recomTrackUris;
  } else {
    let recomTrackUris = [];
    let recommendations;
    let numIters;
    if (Number(num_songs) % 100 === 0) {
      numIters = Math.floor(Number(num_songs) / 100);
    } else {
      numIters = Math.floor(Number(num_songs) / 100) + 1;
    }
    for (let i = 0; i < numIters; i++) {
      // the last iteration is going to be, presumably, less than 100
      if (i !== numIters - 1) {
        let recUrl = 'https://api.spotify.com/v1/recommendations?limit=100';
        recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
        recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
        recUrl = recUrlCreator(recUrl, 'seed_tracks', tracks);
        recommendations = await axiosCall({url: recUrl, headers: jsonHeaders});
        for (item of recommendations.tracks) {
          recomTrackUris.push(item.uri);
        }
      } else {
        let remainingSongs = Number(num_songs) - (100 * (numIters - 1));
        let recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
        recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
        recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
        recUrl = recUrlCreator(recUrl, 'seed_tracks', tracks);
        recommendations = await axiosCall({url: recUrl, headers: jsonHeaders});
        for (item of recommendations.tracks) {
          recomTrackUris.push(item.uri);
        }
      }
    }
    return recomTrackUris;
  }
}

//function to get the current date, gotten from stackoverflow
function getDate() {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  let yyyy = today.getFullYear();
  return mm + '/' + dd + '/' + yyyy;
}

app.get("/new", async (req, res) => {
  // getting the user for the accesstoken, which is to be used in the header created
  let foundUser = await user.find({ _id: currentUserId });
  const jsonHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + foundUser[0].accessToken };
  // getting whether or not the user wanted a public or private playlist
  let publicState;
  if (req.query.private_checkbox === undefined) {
    publicState = 'true';
  } else {
    publicState = 'false';
  }
  // getting track uris
  let uris = await newPlaylistTracks(Number(req.query.num_songs).toString());
  // the details needed in order to create a new playlist
  let newPlaylistDetails = { name: req.query.new_playlist_name, public: publicState, description: "Created on " + getDate() };
  let newPlaylistUrl = 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists';
  // the axios call will return the new playlist's id while also creating the playlist
  let newPlaylistId = await axiosCall({method: 'post', url: newPlaylistUrl, headers: jsonHeaders, data: newPlaylistDetails, dataType: 'json'}, 'new');
  // I used the id returned from the creation in order to create the url, while also adding the track uris to the url
  // This behaves differently if there were more than 100 songs requested
  // I called the api multiple times, using selections of 100 uris at a time except for the last time where
  // I used whatever the remaining number of apis is left
  if (Number(req.query.num_songs) > 100) {
    let numIters = Number(req.query.num_songs) % 100 !== 0 ? Math.floor(Number(req.query.num_songs) / 100) + 1 : Math.floor(Number(req.query.num_songs) / 100);
    let lastIndex = 0;
    let selections = [];
    for (let i = 0; i < numIters; i++) {
      let currentSelection = [];
      if (i === numIters - 1) {
        let remainingUris = uris.length - (i * 100);
        for (let j = 0; j < remainingUris; j++) {
          currentSelection.push(uris[lastIndex]);
          lastIndex++;
        }
      } else {
        for (let j = 0; j < 100; j++) {
          currentSelection.push(uris[lastIndex]);
          lastIndex++;
        }
      }

      selections.push(currentSelection);
    }
    for (selection of selections) {
      let dataBody = { "uris": selection };
      let addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + newPlaylistId + '/tracks';
      await axiosCall({method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody}, 'add');
    }
  } else {
    let dataBody = { "uris": uris };
    let addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + newPlaylistId + '/tracks';
    await axiosCall({method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody}, 'add');
  }
  res.redirect("/");
});

function multipleArtistUrl(artists) {
  let returnUrl = 'https://api.spotify.com/v1/artists?ids=';
  for (artist of artists) {
    returnUrl += artist;
    if (artist !== artists[artists.length - 1]) {
      returnUrl += '%2C';
    }
  }
  return returnUrl;
}

async function addToExisting(name, num_songs) {
  // first i get a list of the user's playlists
  let foundUser = await user.find({ _id: currentUserId });
  const jsonHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + foundUser[0].accessToken };
  let playlists = await axiosCall({url: 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists', headers: jsonHeaders});
  // if the inputted name doesn't exist, then the match variable should be false and I notify the user
  let match = false;
  let matchedId, tracksUrl;
  for (playlist of playlists.items) {
    if ((playlist.name).toLowerCase() === name.toLowerCase()) {
      match = true;
      // I use these later on
      matchedId = playlist.id;
      tracksUrl = playlist.tracks.href;
      // no need to continue the loop, hopefully the user knows the name of their playlist
      break;
    }
  }
  if (match) {
    // now I get the playlist's tracks, artists, and genres present
    let foundPlaylist = await axiosCall({url: 'https://api.spotify.com/v1/playlists/' + matchedId, headers: jsonHeaders});
    // trackIds are only really gonna be used for the recommendation part of the api and to check if there are existing tracks in the playlist
    let trackIds = [];
    // if for some reason the user gave an empty playlist, I need to check for this otherwise there is no point
    // and they should create a new playlist instead using the other path that's set up
    let empty = false;
    for (item of foundPlaylist.tracks.items) {
      trackIds.push(item.track.id);
    }
    if (trackIds.length === 0) {
      empty = true;
    }
    if (!empty) {
      let artists = [];
      let genres = [];
      // I opted to only get the main artist's id since it'd be easier to code for, as there are many
      // collaborations of artists from differing genres and a playlist is bound to have repeats of artists
      for (item of foundPlaylist.tracks.items) {
        if (artists.indexOf(item.track.artists[0].id) === -1) {
          artists.push(item.track.artists[0].id);
        };
      }
      // the get multiple artists part of the Artist API only allows up to 50 artists to be queried
      // if there are less than 50 artists in a playlist, no biggie as it just gets all of the artists
      // I just did this instead of trying to get all artists because if a playlist has 500 unique artists
      // then I'd have to end up doing 10 calls to the get multiple artist part of the Artist API and this 
      // would slow everything down
      let sampledArtists = underscore.sample(artists, 50);
      let artistUrl = multipleArtistUrl(sampledArtists);
      // now the artists object will be returned here from the API
      let severalArtists = await axiosCall({url: artistUrl, headers: jsonHeaders});
      // Why did I do all that? The track objects do not have the genres, so getting the artist objects is
      // the only way to get the genre associated with the track. This isn't 100% but it's the best
      // way I could think of getting the genres in a playlist.
      // I did the same thing I did for artists here, getting only the unique genres 
      for (artist of severalArtists.artists) {
        for (genre of artist.genres) {
          if (genres.indexOf(genre) === -1) {
            genres.push(genre);
          }
        }
      }
      // now to get the reccommended tracks for the playlist I'll use the Browse API
      // I can only use 5 seeds in total, so I made it so we have at least 3 seeds and at most 5
      let seedArtists = artists.length > 1 ? underscore.sample(artists, 2) : underscore.sample(artists, 1);
      let seedGenres = seedArtists.length >= 1 && genres.length > 1 ? underscore.sample(genres, 2) : underscore.sample(genres, 1);
      let seedTracks = seedArtists.length + seedGenres.length < 4 ? underscore.sample(trackIds, 2) : underscore.sample(trackIds, 1);
      let uris = [];
      let numIters = Number(num_songs) % 100 === 0 ? Math.floor(Number(num_songs) / 100) : Math.floor((Number(num_songs) / 100)) + 1;
      for (let i = 0; i < numIters; i++) {
        if (i < numIters - 1) {
          let recUrl = 'https://api.spotify.com/v1/recommendations?limit=100';
          recUrl = recUrlCreator(recUrl, 'seed_artists', seedArtists);
          recUrl = recUrlCreator(recUrl, 'seed_genres', seedGenres);
          recUrl = recUrlCreator(recUrl, 'seed_tracks', seedTracks);
          recommendations = await axiosCall({url: recUrl, headers: jsonHeaders});
          for (item of recommendations.tracks) {
            uris.push(item.uri);
          }
        } else {
          let remainingSongs = Number(num_songs) - (100 * (numIters - 1));
          let recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
          recUrl = recUrlCreator(recUrl, 'seed_artists', seedArtists);
          recUrl = recUrlCreator(recUrl, 'seed_genres', seedGenres);
          recUrl = recUrlCreator(recUrl, 'seed_tracks', seedTracks);
          recommendations = await axiosCall({url: recUrl, headers: jsonHeaders});
          for (item of recommendations.tracks) {
            uris.push(item.uri);
          }
        }
      }
      // The last step is to make a post request to add the tracks to the playlist
      // This again changes based on the number of songs requested
      if (Number(num_songs) > 100) {
        let lastIndex = 0;
        let selections = [];
        for (let i = 0; i < numIters; i++) {
          let currentSelection = [];
          if (i === numIters - 1) {
            let remainingUris = uris.length - (i * 100);
            for (let j = 0; j < remainingUris; j++) {
              currentSelection.push(uris[lastIndex]);
              lastIndex++;
            }
          } else {
            for (let j = 0; j < 100; j++) {
              currentSelection.push(uris[lastIndex]);
              lastIndex++;
            }
          }
          selections.push(currentSelection);
        }
        for (selection of selections) {
          let dataBody = { "uris": selection };
          let addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + matchedId + '/tracks';
          await axiosCall({method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody}, 'add');
        }
      } else {
        let dataBody = { "uris": uris };
        let addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + matchedId + '/tracks';
        await axiosCall({method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody}, 'add');
      }
    } else {
      return 'noSong'
    }
  } else {
    return 'noPlay';
  }
}

app.get('/mod', async (req, res) => {
  let result = await addToExisting(req.query.mod_playlist_name, req.query.add_songs);
  res.redirect("/");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);