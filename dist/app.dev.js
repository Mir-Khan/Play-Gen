"use strict";

var axios = require("axios"),
    querystring = require("querystring"),
    underscore = require("underscore"); //axios different functions


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
} // this function creates a url to get recommendations from the web api


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
} // this function gets recommended tracks based on listening history


function newPlaylistTracks(num_songs, foundUser) {
  var nonJsonHeaders, jsonHeaders, artistsUrl, tracksUrl, artistsObject, tracksObject, genresFound, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, ids, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, genres, artists, tracks, recUrl, _recommendations, recomTrackUris, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, _recomTrackUris, _recommendations2, numIters, _i, _recUrl, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, remainingSongs, _recUrl2, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7;

  return regeneratorRuntime.async(function newPlaylistTracks$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
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

          _context2.next = 6;
          return regeneratorRuntime.awrap(axiosCall({
            url: artistsUrl,
            headers: nonJsonHeaders
          }));

        case 6:
          artistsObject = _context2.sent;
          _context2.next = 9;
          return regeneratorRuntime.awrap(axiosCall({
            url: tracksUrl,
            headers: nonJsonHeaders
          }));

        case 9:
          tracksObject = _context2.sent;
          // To get the genres, I decided on finding the unique genres found in the top artists listened to by the user
          genresFound = [];
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context2.prev = 14;
          _iterator2 = artistsObject.items[Symbol.iterator]();

        case 16:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context2.next = 40;
            break;
          }

          artist = _step2.value;
          _iteratorNormalCompletion8 = true;
          _didIteratorError8 = false;
          _iteratorError8 = undefined;
          _context2.prev = 21;

          for (_iterator8 = artist.genres[Symbol.iterator](); !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            genre = _step8.value;

            if (genresFound.indexOf(genre) === -1) {
              genresFound.push(genre);
            }
          }

          _context2.next = 29;
          break;

        case 25:
          _context2.prev = 25;
          _context2.t0 = _context2["catch"](21);
          _didIteratorError8 = true;
          _iteratorError8 = _context2.t0;

        case 29:
          _context2.prev = 29;
          _context2.prev = 30;

          if (!_iteratorNormalCompletion8 && _iterator8["return"] != null) {
            _iterator8["return"]();
          }

        case 32:
          _context2.prev = 32;

          if (!_didIteratorError8) {
            _context2.next = 35;
            break;
          }

          throw _iteratorError8;

        case 35:
          return _context2.finish(32);

        case 36:
          return _context2.finish(29);

        case 37:
          _iteratorNormalCompletion2 = true;
          _context2.next = 16;
          break;

        case 40:
          _context2.next = 46;
          break;

        case 42:
          _context2.prev = 42;
          _context2.t1 = _context2["catch"](14);
          _didIteratorError2 = true;
          _iteratorError2 = _context2.t1;

        case 46:
          _context2.prev = 46;
          _context2.prev = 47;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 49:
          _context2.prev = 49;

          if (!_didIteratorError2) {
            _context2.next = 52;
            break;
          }

          throw _iteratorError2;

        case 52:
          return _context2.finish(49);

        case 53:
          return _context2.finish(46);

        case 54:
          // Now we need to get the ids of the artsts and tracks we have received
          ids = {
            artists: [],
            tracks: []
          };
          _iteratorNormalCompletion3 = true;
          _didIteratorError3 = false;
          _iteratorError3 = undefined;
          _context2.prev = 58;

          for (_iterator3 = artistsObject.items[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            i = _step3.value;
            ids.artists.push(i.id);
          }

          _context2.next = 66;
          break;

        case 62:
          _context2.prev = 62;
          _context2.t2 = _context2["catch"](58);
          _didIteratorError3 = true;
          _iteratorError3 = _context2.t2;

        case 66:
          _context2.prev = 66;
          _context2.prev = 67;

          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }

        case 69:
          _context2.prev = 69;

          if (!_didIteratorError3) {
            _context2.next = 72;
            break;
          }

          throw _iteratorError3;

        case 72:
          return _context2.finish(69);

        case 73:
          return _context2.finish(66);

        case 74:
          _iteratorNormalCompletion4 = true;
          _didIteratorError4 = false;
          _iteratorError4 = undefined;
          _context2.prev = 77;

          for (_iterator4 = tracksObject.items[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            j = _step4.value;
            ids.tracks.push(j.id);
          } // Now we sample the lists we have created to get a total of 5 seeds for the recommendation path of the web api


          _context2.next = 85;
          break;

        case 81:
          _context2.prev = 81;
          _context2.t3 = _context2["catch"](77);
          _didIteratorError4 = true;
          _iteratorError4 = _context2.t3;

        case 85:
          _context2.prev = 85;
          _context2.prev = 86;

          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }

        case 88:
          _context2.prev = 88;

          if (!_didIteratorError4) {
            _context2.next = 91;
            break;
          }

          throw _iteratorError4;

        case 91:
          return _context2.finish(88);

        case 92:
          return _context2.finish(85);

        case 93:
          genres = underscore.sample(genresFound, 2);
          artists = underscore.sample(ids.artists, 2);
          tracks = underscore.sample(ids.tracks, 1); // Finally we must create the string for the query we want to send to the spotify api
          // There's two different behaviors, depending on the number of songs requested
          // If there were more than 100 songs requested, we use the api multiple times to get all the recommended tracks

          if (!(Number(num_songs) < 100)) {
            _context2.next = 127;
            break;
          }

          recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + num_songs;
          recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
          recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
          recUrl = recUrlCreator(recUrl, 'seed_tracks', tracks); // now the recommended tracks are requested from Spotify

          _context2.next = 103;
          return regeneratorRuntime.awrap(axiosCall({
            url: recUrl,
            headers: jsonHeaders
          }));

        case 103:
          _recommendations = _context2.sent;
          // the tracks are then put into an array that is returned
          recomTrackUris = [];
          _iteratorNormalCompletion5 = true;
          _didIteratorError5 = false;
          _iteratorError5 = undefined;
          _context2.prev = 108;

          for (_iterator5 = _recommendations.tracks[Symbol.iterator](); !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            item = _step5.value;
            recomTrackUris.push(item.uri);
          }

          _context2.next = 116;
          break;

        case 112:
          _context2.prev = 112;
          _context2.t4 = _context2["catch"](108);
          _didIteratorError5 = true;
          _iteratorError5 = _context2.t4;

        case 116:
          _context2.prev = 116;
          _context2.prev = 117;

          if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
            _iterator5["return"]();
          }

        case 119:
          _context2.prev = 119;

          if (!_didIteratorError5) {
            _context2.next = 122;
            break;
          }

          throw _iteratorError5;

        case 122:
          return _context2.finish(119);

        case 123:
          return _context2.finish(116);

        case 124:
          return _context2.abrupt("return", recomTrackUris);

        case 127:
          _recomTrackUris = [];

          if (Number(num_songs) % 100 === 0) {
            numIters = Math.floor(Number(num_songs) / 100);
          } else {
            numIters = Math.floor(Number(num_songs) / 100) + 1;
          }

          _i = 0;

        case 130:
          if (!(_i < numIters)) {
            _context2.next = 190;
            break;
          }

          if (!(_i !== numIters - 1)) {
            _context2.next = 160;
            break;
          }

          _recUrl = 'https://api.spotify.com/v1/recommendations?limit=100';
          _recUrl = recUrlCreator(_recUrl, 'seed_artists', artists);
          _recUrl = recUrlCreator(_recUrl, 'seed_genres', genres);
          _recUrl = recUrlCreator(_recUrl, 'seed_tracks', tracks);
          _context2.next = 138;
          return regeneratorRuntime.awrap(axiosCall({
            url: _recUrl,
            headers: jsonHeaders
          }));

        case 138:
          _recommendations2 = _context2.sent;
          _iteratorNormalCompletion6 = true;
          _didIteratorError6 = false;
          _iteratorError6 = undefined;
          _context2.prev = 142;

          for (_iterator6 = _recommendations2.tracks[Symbol.iterator](); !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            item = _step6.value;

            _recomTrackUris.push(item.uri);
          }

          _context2.next = 150;
          break;

        case 146:
          _context2.prev = 146;
          _context2.t5 = _context2["catch"](142);
          _didIteratorError6 = true;
          _iteratorError6 = _context2.t5;

        case 150:
          _context2.prev = 150;
          _context2.prev = 151;

          if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
            _iterator6["return"]();
          }

        case 153:
          _context2.prev = 153;

          if (!_didIteratorError6) {
            _context2.next = 156;
            break;
          }

          throw _iteratorError6;

        case 156:
          return _context2.finish(153);

        case 157:
          return _context2.finish(150);

        case 158:
          _context2.next = 187;
          break;

        case 160:
          remainingSongs = Number(num_songs) - 100 * (numIters - 1);
          _recUrl2 = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
          _recUrl2 = recUrlCreator(_recUrl2, 'seed_artists', artists);
          _recUrl2 = recUrlCreator(_recUrl2, 'seed_genres', genres);
          _recUrl2 = recUrlCreator(_recUrl2, 'seed_tracks', tracks);
          _context2.next = 167;
          return regeneratorRuntime.awrap(axiosCall({
            url: _recUrl2,
            headers: jsonHeaders
          }));

        case 167:
          _recommendations2 = _context2.sent;
          _iteratorNormalCompletion7 = true;
          _didIteratorError7 = false;
          _iteratorError7 = undefined;
          _context2.prev = 171;

          for (_iterator7 = _recommendations2.tracks[Symbol.iterator](); !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            item = _step7.value;

            _recomTrackUris.push(item.uri);
          }

          _context2.next = 179;
          break;

        case 175:
          _context2.prev = 175;
          _context2.t6 = _context2["catch"](171);
          _didIteratorError7 = true;
          _iteratorError7 = _context2.t6;

        case 179:
          _context2.prev = 179;
          _context2.prev = 180;

          if (!_iteratorNormalCompletion7 && _iterator7["return"] != null) {
            _iterator7["return"]();
          }

        case 182:
          _context2.prev = 182;

          if (!_didIteratorError7) {
            _context2.next = 185;
            break;
          }

          throw _iteratorError7;

        case 185:
          return _context2.finish(182);

        case 186:
          return _context2.finish(179);

        case 187:
          _i++;
          _context2.next = 130;
          break;

        case 190:
          return _context2.abrupt("return", _recomTrackUris);

        case 191:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[14, 42, 46, 54], [21, 25, 29, 37], [30,, 32, 36], [47,, 49, 53], [58, 62, 66, 74], [67,, 69, 73], [77, 81, 85, 93], [86,, 88, 92], [108, 112, 116, 124], [117,, 119, 123], [142, 146, 150, 158], [151,, 153, 157], [171, 175, 179, 187], [180,, 182, 186]]);
} // this function adds on the songs to the newly created songs


function addSongsToNewPlaylist(uris, newPlaylistId, num_songs, jsonHeaders) {
  var numIters, lastIndex, selections, _i2, currentSelection, remainingUris, _j, _j2, _i3, _selections, dataBody, addPlaylistUrl, _dataBody, _addPlaylistUrl;

  return regeneratorRuntime.async(function addSongsToNewPlaylist$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (!(Number(num_songs) > 100)) {
            _context3.next = 17;
            break;
          }

          numIters = Number(num_songs) % 100 !== 0 ? Math.floor(Number(num_songs) / 100) + 1 : Math.floor(Number(num_songs) / 100);
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

        case 6:
          if (!(_i3 < _selections.length)) {
            _context3.next = 15;
            break;
          }

          selection = _selections[_i3];
          dataBody = {
            "uris": selection
          };
          addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + newPlaylistId + '/tracks';
          _context3.next = 12;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: addPlaylistUrl,
            headers: jsonHeaders,
            data: dataBody
          }, 'add'));

        case 12:
          _i3++;
          _context3.next = 6;
          break;

        case 15:
          _context3.next = 21;
          break;

        case 17:
          _dataBody = {
            "uris": uris
          };
          _addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + newPlaylistId + '/tracks';
          _context3.next = 21;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: _addPlaylistUrl,
            headers: jsonHeaders,
            data: _dataBody
          }, 'add'));

        case 21:
        case "end":
          return _context3.stop();
      }
    }
  });
} //function to get the current date, taken from stackoverflow


function getDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

  var yyyy = today.getFullYear();
  return mm + '/' + dd + '/' + yyyy;
} //making a query url with multiple artists


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
} //function to add to an existing playlist based on listening history


function addToExisting(name, num_songs, foundUser, currentUserId) {
  var jsonHeaders, playlists, match, matchedId, _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, foundPlaylist, trackIds, empty, _iteratorNormalCompletion11, _didIteratorError11, _iteratorError11, _iterator11, _step11, artists, genres, _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, sampledArtists, artistUrl, severalArtists, _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13, _iteratorNormalCompletion16, _didIteratorError16, _iteratorError16, _iterator16, _step16, seedArtists, seedGenres, seedTracks, uris, numIters, _i4, recUrl, _iteratorNormalCompletion14, _didIteratorError14, _iteratorError14, _iterator14, _step14, remainingSongs, _recUrl3, _iteratorNormalCompletion15, _didIteratorError15, _iteratorError15, _iterator15, _step15, lastIndex, selections, _i5, currentSelection, remainingUris, _j3, _j4, _i6, _selections2, dataBody, addPlaylistUrl, _dataBody2, _addPlaylistUrl2;

  return regeneratorRuntime.async(function addToExisting$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          jsonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          };
          _context4.next = 3;
          return regeneratorRuntime.awrap(axiosCall({
            url: 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists',
            headers: jsonHeaders
          }));

        case 3:
          playlists = _context4.sent;
          // if the inputted name doesn't exist, then the match variable should be false and I notify the user
          match = false;
          _iteratorNormalCompletion10 = true;
          _didIteratorError10 = false;
          _iteratorError10 = undefined;
          _context4.prev = 8;
          _iterator10 = playlists.items[Symbol.iterator]();

        case 10:
          if (_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done) {
            _context4.next = 19;
            break;
          }

          playlist = _step10.value;

          if (!(playlist.name.toLowerCase() === name.toLowerCase())) {
            _context4.next = 16;
            break;
          }

          match = true; // I use these later on

          matchedId = playlist.id; // no need to continue the loop, hopefully the user knows the name of their playlist

          return _context4.abrupt("break", 19);

        case 16:
          _iteratorNormalCompletion10 = true;
          _context4.next = 10;
          break;

        case 19:
          _context4.next = 25;
          break;

        case 21:
          _context4.prev = 21;
          _context4.t0 = _context4["catch"](8);
          _didIteratorError10 = true;
          _iteratorError10 = _context4.t0;

        case 25:
          _context4.prev = 25;
          _context4.prev = 26;

          if (!_iteratorNormalCompletion10 && _iterator10["return"] != null) {
            _iterator10["return"]();
          }

        case 28:
          _context4.prev = 28;

          if (!_didIteratorError10) {
            _context4.next = 31;
            break;
          }

          throw _iteratorError10;

        case 31:
          return _context4.finish(28);

        case 32:
          return _context4.finish(25);

        case 33:
          if (!match) {
            _context4.next = 220;
            break;
          }

          _context4.next = 36;
          return regeneratorRuntime.awrap(axiosCall({
            url: 'https://api.spotify.com/v1/playlists/' + matchedId,
            headers: jsonHeaders
          }));

        case 36:
          foundPlaylist = _context4.sent;
          // trackIds are only really gonna be used for the recommendation part of the api and to check if there are existing tracks in the playlist
          trackIds = []; // if for some reason the user gave an empty playlist, I need to check for this otherwise there is no point
          // and they should create a new playlist instead using the other path that's set up

          empty = false;
          _iteratorNormalCompletion11 = true;
          _didIteratorError11 = false;
          _iteratorError11 = undefined;
          _context4.prev = 42;

          for (_iterator11 = foundPlaylist.tracks.items[Symbol.iterator](); !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
            item = _step11.value;
            trackIds.push(item.track.id);
          }

          _context4.next = 50;
          break;

        case 46:
          _context4.prev = 46;
          _context4.t1 = _context4["catch"](42);
          _didIteratorError11 = true;
          _iteratorError11 = _context4.t1;

        case 50:
          _context4.prev = 50;
          _context4.prev = 51;

          if (!_iteratorNormalCompletion11 && _iterator11["return"] != null) {
            _iterator11["return"]();
          }

        case 53:
          _context4.prev = 53;

          if (!_didIteratorError11) {
            _context4.next = 56;
            break;
          }

          throw _iteratorError11;

        case 56:
          return _context4.finish(53);

        case 57:
          return _context4.finish(50);

        case 58:
          if (trackIds.length === 0) {
            empty = true;
          }

          if (empty) {
            _context4.next = 217;
            break;
          }

          artists = [];
          genres = []; // I opted to only get the main artist's id since it'd be easier to code for, as there are many
          // collaborations of artists from differing genres and a playlist is bound to have repeats of artists

          _iteratorNormalCompletion12 = true;
          _didIteratorError12 = false;
          _iteratorError12 = undefined;
          _context4.prev = 65;

          for (_iterator12 = foundPlaylist.tracks.items[Symbol.iterator](); !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
            item = _step12.value;

            if (artists.indexOf(item.track.artists[0].id) === -1) {
              artists.push(item.track.artists[0].id);
            }
          } // the get multiple artists part of the Artist API only allows up to 50 artists to be queried
          // if there are less than 50 artists in a playlist, no biggie as it just gets all of the artists
          // I just did this instead of trying to get all artists because if a playlist has 500 unique artists
          // then I'd have to end up doing 10 calls to the get multiple artist part of the Artist API and this 
          // would slow everything down


          _context4.next = 73;
          break;

        case 69:
          _context4.prev = 69;
          _context4.t2 = _context4["catch"](65);
          _didIteratorError12 = true;
          _iteratorError12 = _context4.t2;

        case 73:
          _context4.prev = 73;
          _context4.prev = 74;

          if (!_iteratorNormalCompletion12 && _iterator12["return"] != null) {
            _iterator12["return"]();
          }

        case 76:
          _context4.prev = 76;

          if (!_didIteratorError12) {
            _context4.next = 79;
            break;
          }

          throw _iteratorError12;

        case 79:
          return _context4.finish(76);

        case 80:
          return _context4.finish(73);

        case 81:
          sampledArtists = underscore.sample(artists, 50);
          artistUrl = multipleArtistUrl(sampledArtists); // now the artists object will be returned here from the API

          _context4.next = 85;
          return regeneratorRuntime.awrap(axiosCall({
            url: artistUrl,
            headers: jsonHeaders
          }));

        case 85:
          severalArtists = _context4.sent;
          // Why did I do all that? The track objects do not have the genres, so getting the artist objects is
          // the only way to get the genre associated with the track. This isn't 100% but it's the best
          // way I could think of getting the genres in a playlist.
          // I did the same thing I did for artists here, getting only the unique genres 
          _iteratorNormalCompletion13 = true;
          _didIteratorError13 = false;
          _iteratorError13 = undefined;
          _context4.prev = 89;
          _iterator13 = severalArtists.artists[Symbol.iterator]();

        case 91:
          if (_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done) {
            _context4.next = 115;
            break;
          }

          artist = _step13.value;
          _iteratorNormalCompletion16 = true;
          _didIteratorError16 = false;
          _iteratorError16 = undefined;
          _context4.prev = 96;

          for (_iterator16 = artist.genres[Symbol.iterator](); !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
            genre = _step16.value;

            if (genres.indexOf(genre) === -1) {
              genres.push(genre);
            }
          }

          _context4.next = 104;
          break;

        case 100:
          _context4.prev = 100;
          _context4.t3 = _context4["catch"](96);
          _didIteratorError16 = true;
          _iteratorError16 = _context4.t3;

        case 104:
          _context4.prev = 104;
          _context4.prev = 105;

          if (!_iteratorNormalCompletion16 && _iterator16["return"] != null) {
            _iterator16["return"]();
          }

        case 107:
          _context4.prev = 107;

          if (!_didIteratorError16) {
            _context4.next = 110;
            break;
          }

          throw _iteratorError16;

        case 110:
          return _context4.finish(107);

        case 111:
          return _context4.finish(104);

        case 112:
          _iteratorNormalCompletion13 = true;
          _context4.next = 91;
          break;

        case 115:
          _context4.next = 121;
          break;

        case 117:
          _context4.prev = 117;
          _context4.t4 = _context4["catch"](89);
          _didIteratorError13 = true;
          _iteratorError13 = _context4.t4;

        case 121:
          _context4.prev = 121;
          _context4.prev = 122;

          if (!_iteratorNormalCompletion13 && _iterator13["return"] != null) {
            _iterator13["return"]();
          }

        case 124:
          _context4.prev = 124;

          if (!_didIteratorError13) {
            _context4.next = 127;
            break;
          }

          throw _iteratorError13;

        case 127:
          return _context4.finish(124);

        case 128:
          return _context4.finish(121);

        case 129:
          // now to get the reccommended tracks for the playlist I'll use the Browse API
          // I can only use 5 seeds in total, so I made it so we have at least 3 seeds and at most 5
          seedArtists = artists.length > 1 ? underscore.sample(artists, 2) : underscore.sample(artists, 1);
          seedGenres = seedArtists.length >= 1 && genres.length > 1 ? underscore.sample(genres, 2) : underscore.sample(genres, 1);
          seedTracks = seedArtists.length + seedGenres.length < 4 ? underscore.sample(trackIds, 2) : underscore.sample(trackIds, 1);
          uris = [];
          numIters = Number(num_songs) % 100 === 0 ? Math.floor(Number(num_songs) / 100) : Math.floor(Number(num_songs) / 100) + 1;
          _i4 = 0;

        case 135:
          if (!(_i4 < numIters)) {
            _context4.next = 195;
            break;
          }

          if (!(_i4 < numIters - 1)) {
            _context4.next = 165;
            break;
          }

          recUrl = 'https://api.spotify.com/v1/recommendations?limit=100';
          recUrl = recUrlCreator(recUrl, 'seed_artists', seedArtists);
          recUrl = recUrlCreator(recUrl, 'seed_genres', seedGenres);
          recUrl = recUrlCreator(recUrl, 'seed_tracks', seedTracks);
          _context4.next = 143;
          return regeneratorRuntime.awrap(axiosCall({
            url: recUrl,
            headers: jsonHeaders
          }));

        case 143:
          recommendations = _context4.sent;
          _iteratorNormalCompletion14 = true;
          _didIteratorError14 = false;
          _iteratorError14 = undefined;
          _context4.prev = 147;

          for (_iterator14 = recommendations.tracks[Symbol.iterator](); !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
            item = _step14.value;
            uris.push(item.uri);
          }

          _context4.next = 155;
          break;

        case 151:
          _context4.prev = 151;
          _context4.t5 = _context4["catch"](147);
          _didIteratorError14 = true;
          _iteratorError14 = _context4.t5;

        case 155:
          _context4.prev = 155;
          _context4.prev = 156;

          if (!_iteratorNormalCompletion14 && _iterator14["return"] != null) {
            _iterator14["return"]();
          }

        case 158:
          _context4.prev = 158;

          if (!_didIteratorError14) {
            _context4.next = 161;
            break;
          }

          throw _iteratorError14;

        case 161:
          return _context4.finish(158);

        case 162:
          return _context4.finish(155);

        case 163:
          _context4.next = 192;
          break;

        case 165:
          remainingSongs = Number(num_songs) - 100 * (numIters - 1);
          _recUrl3 = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
          _recUrl3 = recUrlCreator(_recUrl3, 'seed_artists', seedArtists);
          _recUrl3 = recUrlCreator(_recUrl3, 'seed_genres', seedGenres);
          _recUrl3 = recUrlCreator(_recUrl3, 'seed_tracks', seedTracks);
          _context4.next = 172;
          return regeneratorRuntime.awrap(axiosCall({
            url: _recUrl3,
            headers: jsonHeaders
          }));

        case 172:
          recommendations = _context4.sent;
          _iteratorNormalCompletion15 = true;
          _didIteratorError15 = false;
          _iteratorError15 = undefined;
          _context4.prev = 176;

          for (_iterator15 = recommendations.tracks[Symbol.iterator](); !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
            item = _step15.value;
            uris.push(item.uri);
          }

          _context4.next = 184;
          break;

        case 180:
          _context4.prev = 180;
          _context4.t6 = _context4["catch"](176);
          _didIteratorError15 = true;
          _iteratorError15 = _context4.t6;

        case 184:
          _context4.prev = 184;
          _context4.prev = 185;

          if (!_iteratorNormalCompletion15 && _iterator15["return"] != null) {
            _iterator15["return"]();
          }

        case 187:
          _context4.prev = 187;

          if (!_didIteratorError15) {
            _context4.next = 190;
            break;
          }

          throw _iteratorError15;

        case 190:
          return _context4.finish(187);

        case 191:
          return _context4.finish(184);

        case 192:
          _i4++;
          _context4.next = 135;
          break;

        case 195:
          if (!(Number(num_songs) > 100)) {
            _context4.next = 211;
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

        case 200:
          if (!(_i6 < _selections2.length)) {
            _context4.next = 209;
            break;
          }

          selection = _selections2[_i6];
          dataBody = {
            "uris": selection
          };
          addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + matchedId + '/tracks';
          _context4.next = 206;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: addPlaylistUrl,
            headers: jsonHeaders,
            data: dataBody
          }, 'add'));

        case 206:
          _i6++;
          _context4.next = 200;
          break;

        case 209:
          _context4.next = 215;
          break;

        case 211:
          _dataBody2 = {
            "uris": uris
          };
          _addPlaylistUrl2 = 'https://api.spotify.com/v1/playlists/' + matchedId + '/tracks';
          _context4.next = 215;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: _addPlaylistUrl2,
            headers: jsonHeaders,
            data: _dataBody2
          }, 'add'));

        case 215:
          _context4.next = 218;
          break;

        case 217:
          return _context4.abrupt("return", 'noSong');

        case 218:
          _context4.next = 221;
          break;

        case 220:
          return _context4.abrupt("return", 'noPlay');

        case 221:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[8, 21, 25, 33], [26,, 28, 32], [42, 46, 50, 58], [51,, 53, 57], [65, 69, 73, 81], [74,, 76, 80], [89, 117, 121, 129], [96, 100, 104, 112], [105,, 107, 111], [122,, 124, 128], [147, 151, 155, 163], [156,, 158, 162], [176, 180, 184, 192], [185,, 187, 191]]);
} // this function makes a new playlist based on user inputs


function newUserTracks(queries, foundUser, userId) {
  var jsonHeaders, publicState, artists, genres, artistsIds, trackId, trackIdArr, _i7, _artists, currentId, uris, newPlaylistDetails, newPlaylistUrl, newPlaylistId;

  return regeneratorRuntime.async(function newUserTracks$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          jsonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          };

          if (queries.private_checkbox === undefined) {
            publicState = false;
          } else {
            publicState = true;
          }

          artists = [];
          genres = []; // the user has the option of inputting 3-5 items, so this covers the optional inputs

          if (queries.artistTwo === '') {
            artists.push(queries.artistOne);
          } else {
            artists.push(queries.artistOne, queries.artistTwo);
          }

          if (queries.genreTwo === '') {
            genres.push(queries.genreOne);
          } else {
            genres.push(queries.genreOne, queries.genreTwo);
          } // now the ids are collected for the tracks and ids


          artistsIds = []; // this is so the function to create the recommendation url doesn't run into any problems

          _context5.next = 9;
          return regeneratorRuntime.awrap(search(queries.trackNew, 'track', jsonHeaders, queries.trackNewArtist));

        case 9:
          trackId = _context5.sent;
          trackIdArr = [trackId.id];
          _i7 = 0, _artists = artists;

        case 12:
          if (!(_i7 < _artists.length)) {
            _context5.next = 21;
            break;
          }

          artist = _artists[_i7];
          _context5.next = 16;
          return regeneratorRuntime.awrap(search(artist, 'artist', jsonHeaders));

        case 16:
          currentId = _context5.sent;
          artistsIds.push(currentId);

        case 18:
          _i7++;
          _context5.next = 12;
          break;

        case 21:
          _context5.next = 23;
          return regeneratorRuntime.awrap(userUris(trackIdArr, genres, artistsIds, queries.num_songs, jsonHeaders));

        case 23:
          uris = _context5.sent;
          newPlaylistDetails = {
            name: queries.new_playlist_name,
            "public": publicState,
            description: "Created on " + getDate()
          };
          newPlaylistUrl = 'https://api.spotify.com/v1/users/' + userId + '/playlists';
          _context5.next = 28;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: newPlaylistUrl,
            headers: jsonHeaders,
            data: newPlaylistDetails,
            dataType: 'json'
          }, 'new'));

        case 28:
          newPlaylistId = _context5.sent;
          _context5.next = 31;
          return regeneratorRuntime.awrap(addSongsToNewPlaylist(uris, newPlaylistId, queries.num_songs, jsonHeaders));

        case 31:
        case "end":
          return _context5.stop();
      }
    }
  });
} // this function is responsible for getting the ids needed for the recommendations based on the user inputs


function search(query, type, header) {
  var trackArtist,
      callUrl,
      result,
      matchedTrack,
      _iteratorNormalCompletion17,
      _didIteratorError17,
      _iteratorError17,
      _iterator17,
      _step17,
      _args6 = arguments;

  return regeneratorRuntime.async(function search$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          trackArtist = _args6.length > 3 && _args6[3] !== undefined ? _args6[3] : undefined;
          callUrl = searchUrlCreator(query, type);
          _context6.next = 4;
          return regeneratorRuntime.awrap(axiosCall({
            url: callUrl,
            headers: header
          }));

        case 4:
          result = _context6.sent;

          if (!(trackArtist === undefined)) {
            _context6.next = 9;
            break;
          }

          return _context6.abrupt("return", result.artists.items[0].id);

        case 9:
          _iteratorNormalCompletion17 = true;
          _didIteratorError17 = false;
          _iteratorError17 = undefined;
          _context6.prev = 12;
          _iterator17 = result.tracks.items[Symbol.iterator]();

        case 14:
          if (_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done) {
            _context6.next = 22;
            break;
          }

          track = _step17.value;

          if (!(track.artists[0].name.toLowerCase() === trackArtist.toLowerCase())) {
            _context6.next = 19;
            break;
          }

          matchedTrack = track;
          return _context6.abrupt("break", 22);

        case 19:
          _iteratorNormalCompletion17 = true;
          _context6.next = 14;
          break;

        case 22:
          _context6.next = 28;
          break;

        case 24:
          _context6.prev = 24;
          _context6.t0 = _context6["catch"](12);
          _didIteratorError17 = true;
          _iteratorError17 = _context6.t0;

        case 28:
          _context6.prev = 28;
          _context6.prev = 29;

          if (!_iteratorNormalCompletion17 && _iterator17["return"] != null) {
            _iterator17["return"]();
          }

        case 31:
          _context6.prev = 31;

          if (!_didIteratorError17) {
            _context6.next = 34;
            break;
          }

          throw _iteratorError17;

        case 34:
          return _context6.finish(31);

        case 35:
          return _context6.finish(28);

        case 36:
          return _context6.abrupt("return", matchedTrack);

        case 37:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[12, 24, 28, 36], [29,, 31, 35]]);
} // this function creates a search url for the search API


function searchUrlCreator(query, type) {
  var baseUrl = 'https://api.spotify.com/v1/search?q=';
  var newQuery = query.split(' ').join('%20');
  return baseUrl + newQuery + '&type=' + type;
} // this function is responsible for getting the actual uris for the new user defined playlist


function userUris(track, genres, artists, num_songs, jsonHeaders) {
  var recUrl, _recommendations3, recomTrackUris, _iteratorNormalCompletion18, _didIteratorError18, _iteratorError18, _iterator18, _step18, _recomTrackUris2, _recommendations4, numIters, _i8, _recUrl4, _iteratorNormalCompletion19, _didIteratorError19, _iteratorError19, _iterator19, _step19, remainingSongs, _recUrl5, _iteratorNormalCompletion20, _didIteratorError20, _iteratorError20, _iterator20, _step20;

  return regeneratorRuntime.async(function userUris$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          if (!(Number(num_songs) < 100)) {
            _context7.next = 31;
            break;
          }

          recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + num_songs;
          recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
          recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
          recUrl = recUrlCreator(recUrl, 'seed_tracks', track); // now the recommended tracks are requested from Spotify

          _context7.next = 7;
          return regeneratorRuntime.awrap(axiosCall({
            url: recUrl,
            headers: jsonHeaders
          }));

        case 7:
          _recommendations3 = _context7.sent;
          // the tracks are then put into an array that is returned
          recomTrackUris = [];
          _iteratorNormalCompletion18 = true;
          _didIteratorError18 = false;
          _iteratorError18 = undefined;
          _context7.prev = 12;

          for (_iterator18 = _recommendations3.tracks[Symbol.iterator](); !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
            item = _step18.value;
            recomTrackUris.push(item.uri);
          }

          _context7.next = 20;
          break;

        case 16:
          _context7.prev = 16;
          _context7.t0 = _context7["catch"](12);
          _didIteratorError18 = true;
          _iteratorError18 = _context7.t0;

        case 20:
          _context7.prev = 20;
          _context7.prev = 21;

          if (!_iteratorNormalCompletion18 && _iterator18["return"] != null) {
            _iterator18["return"]();
          }

        case 23:
          _context7.prev = 23;

          if (!_didIteratorError18) {
            _context7.next = 26;
            break;
          }

          throw _iteratorError18;

        case 26:
          return _context7.finish(23);

        case 27:
          return _context7.finish(20);

        case 28:
          return _context7.abrupt("return", recomTrackUris);

        case 31:
          _recomTrackUris2 = [];

          if (Number(num_songs) % 100 === 0) {
            numIters = Math.floor(Number(num_songs) / 100);
          } else {
            numIters = Math.floor(Number(num_songs) / 100) + 1;
          }

          _i8 = 0;

        case 34:
          if (!(_i8 < numIters)) {
            _context7.next = 94;
            break;
          }

          if (!(_i8 !== numIters - 1)) {
            _context7.next = 64;
            break;
          }

          _recUrl4 = 'https://api.spotify.com/v1/recommendations?limit=100';
          _recUrl4 = recUrlCreator(_recUrl4, 'seed_artists', artists);
          _recUrl4 = recUrlCreator(_recUrl4, 'seed_genres', genres);
          _recUrl4 = recUrlCreator(_recUrl4, 'seed_tracks', track);
          _context7.next = 42;
          return regeneratorRuntime.awrap(axiosCall({
            url: _recUrl4,
            headers: jsonHeaders
          }));

        case 42:
          _recommendations4 = _context7.sent;
          _iteratorNormalCompletion19 = true;
          _didIteratorError19 = false;
          _iteratorError19 = undefined;
          _context7.prev = 46;

          for (_iterator19 = _recommendations4.tracks[Symbol.iterator](); !(_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done); _iteratorNormalCompletion19 = true) {
            item = _step19.value;

            _recomTrackUris2.push(item.uri);
          }

          _context7.next = 54;
          break;

        case 50:
          _context7.prev = 50;
          _context7.t1 = _context7["catch"](46);
          _didIteratorError19 = true;
          _iteratorError19 = _context7.t1;

        case 54:
          _context7.prev = 54;
          _context7.prev = 55;

          if (!_iteratorNormalCompletion19 && _iterator19["return"] != null) {
            _iterator19["return"]();
          }

        case 57:
          _context7.prev = 57;

          if (!_didIteratorError19) {
            _context7.next = 60;
            break;
          }

          throw _iteratorError19;

        case 60:
          return _context7.finish(57);

        case 61:
          return _context7.finish(54);

        case 62:
          _context7.next = 91;
          break;

        case 64:
          remainingSongs = Number(num_songs) - 100 * (numIters - 1);
          _recUrl5 = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
          _recUrl5 = recUrlCreator(_recUrl5, 'seed_artists', artists);
          _recUrl5 = recUrlCreator(_recUrl5, 'seed_genres', genres);
          _recUrl5 = recUrlCreator(_recUrl5, 'seed_tracks', track);
          _context7.next = 71;
          return regeneratorRuntime.awrap(axiosCall({
            url: _recUrl5,
            headers: jsonHeaders
          }));

        case 71:
          _recommendations4 = _context7.sent;
          _iteratorNormalCompletion20 = true;
          _didIteratorError20 = false;
          _iteratorError20 = undefined;
          _context7.prev = 75;

          for (_iterator20 = _recommendations4.tracks[Symbol.iterator](); !(_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done); _iteratorNormalCompletion20 = true) {
            item = _step20.value;

            _recomTrackUris2.push(item.uri);
          }

          _context7.next = 83;
          break;

        case 79:
          _context7.prev = 79;
          _context7.t2 = _context7["catch"](75);
          _didIteratorError20 = true;
          _iteratorError20 = _context7.t2;

        case 83:
          _context7.prev = 83;
          _context7.prev = 84;

          if (!_iteratorNormalCompletion20 && _iterator20["return"] != null) {
            _iterator20["return"]();
          }

        case 86:
          _context7.prev = 86;

          if (!_didIteratorError20) {
            _context7.next = 89;
            break;
          }

          throw _iteratorError20;

        case 89:
          return _context7.finish(86);

        case 90:
          return _context7.finish(83);

        case 91:
          _i8++;
          _context7.next = 34;
          break;

        case 94:
          return _context7.abrupt("return", _recomTrackUris2);

        case 95:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[12, 16, 20, 28], [21,, 23, 27], [46, 50, 54, 62], [55,, 57, 61], [75, 79, 83, 91], [84,, 86, 90]]);
}

function userMod(queries, foundUser, userId) {
  var jsonHeaders, artists, genres, artistsIds, trackId, trackIdArr, _i9, _artists2, currentId, uris;

  return regeneratorRuntime.async(function userMod$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          jsonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + foundUser[0].accessToken
          };
          artists = [];
          genres = []; // the user has the option of inputting 3-5 items, so this covers the optional inputs

          if (queries.artistModTwo === '') {
            artists.push(queries.artistModOne);
          } else {
            artists.push(queries.artistModOne, queries.artistModTwo);
          }

          if (queries.genreTwo === '') {
            genres.push(queries.genreModOne);
          } else {
            genres.push(queries.genreModOne, queries.genreModTwo);
          }

          artistsIds = [];
          _context8.next = 8;
          return regeneratorRuntime.awrap(search(queries.trackMod, 'track', jsonHeaders, queries.trackModArtist));

        case 8:
          trackId = _context8.sent;
          trackIdArr = [trackId.id];
          _i9 = 0, _artists2 = artists;

        case 11:
          if (!(_i9 < _artists2.length)) {
            _context8.next = 20;
            break;
          }

          artist = _artists2[_i9];
          _context8.next = 15;
          return regeneratorRuntime.awrap(search(artist, 'artist', jsonHeaders));

        case 15:
          currentId = _context8.sent;
          artistsIds.push(currentId);

        case 17:
          _i9++;
          _context8.next = 11;
          break;

        case 20:
          _context8.next = 22;
          return regeneratorRuntime.awrap(userUris(trackIdArr, genres, artistsIds, queries.add_songs, jsonHeaders));

        case 22:
          uris = _context8.sent;
          _context8.next = 25;
          return regeneratorRuntime.awrap(userAddToExisting(queries.mod_playlist_name, queries.add_songs, userId, jsonHeaders, uris));

        case 25:
        case "end":
          return _context8.stop();
      }
    }
  });
}

function userAddToExisting(name, num_songs, currentUserId, jsonHeaders, uris) {
  var playlists, match, addPlaylistUrl, matchedId, _iteratorNormalCompletion21, _didIteratorError21, _iteratorError21, _iterator21, _step21, numIters, lastIndex, selections, _i10, currentSelection, remainingUris, _j5, _j6, _i11, _selections3, dataBody, _dataBody3;

  return regeneratorRuntime.async(function userAddToExisting$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.next = 2;
          return regeneratorRuntime.awrap(axiosCall({
            url: 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists',
            headers: jsonHeaders
          }));

        case 2:
          playlists = _context9.sent;
          // a lot of this is just the addToExisting function just with the recommendation API being removed
          match = false;
          addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + matchedId + '/tracks';
          _iteratorNormalCompletion21 = true;
          _didIteratorError21 = false;
          _iteratorError21 = undefined;
          _context9.prev = 8;
          _iterator21 = playlists.items[Symbol.iterator]();

        case 10:
          if (_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done) {
            _context9.next = 19;
            break;
          }

          playlist = _step21.value;

          if (!(playlist.name.toLowerCase() === name.toLowerCase())) {
            _context9.next = 16;
            break;
          }

          match = true;
          matchedId = playlist.id;
          return _context9.abrupt("break", 19);

        case 16:
          _iteratorNormalCompletion21 = true;
          _context9.next = 10;
          break;

        case 19:
          _context9.next = 25;
          break;

        case 21:
          _context9.prev = 21;
          _context9.t0 = _context9["catch"](8);
          _didIteratorError21 = true;
          _iteratorError21 = _context9.t0;

        case 25:
          _context9.prev = 25;
          _context9.prev = 26;

          if (!_iteratorNormalCompletion21 && _iterator21["return"] != null) {
            _iterator21["return"]();
          }

        case 28:
          _context9.prev = 28;

          if (!_didIteratorError21) {
            _context9.next = 31;
            break;
          }

          throw _iteratorError21;

        case 31:
          return _context9.finish(28);

        case 32:
          return _context9.finish(25);

        case 33:
          if (!match) {
            _context9.next = 55;
            break;
          }

          numIters = Number(num_songs) % 100 === 0 ? Math.floor(Number(num_songs) / 100) : Math.floor(Number(num_songs) / 100) + 1;

          if (!Number(num_songs)) {
            _context9.next = 50;
            break;
          }

          lastIndex = 0;
          selections = [];

          for (_i10 = 0; _i10 < numIters; _i10++) {
            currentSelection = [];

            if (_i10 === numIters - 1) {
              remainingUris = uris.length - _i10 * 100;

              for (_j5 = 0; _j5 < remainingUris; _j5++) {
                currentSelection.push(uris[lastIndex]);
                lastIndex++;
              }
            } else {
              for (_j6 = 0; _j6 < 100; _j6++) {
                currentSelection.push(uris[lastIndex]);
                lastIndex++;
              }
            }

            selections.push(currentSelection);
          }

          _i11 = 0, _selections3 = selections;

        case 40:
          if (!(_i11 < _selections3.length)) {
            _context9.next = 48;
            break;
          }

          selection = _selections3[_i11];
          dataBody = {
            "uris": selection
          };
          _context9.next = 45;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: addPlaylistUrl,
            headers: jsonHeaders,
            data: dataBody
          }, 'add'));

        case 45:
          _i11++;
          _context9.next = 40;
          break;

        case 48:
          _context9.next = 53;
          break;

        case 50:
          _dataBody3 = {
            'uris': uris
          };
          _context9.next = 53;
          return regeneratorRuntime.awrap(axiosCall({
            method: 'post',
            url: addPlaylistUrl,
            headers: jsonHeaders,
            data: _dataBody3
          }, 'add'));

        case 53:
          _context9.next = 56;
          break;

        case 55:
          console.log('noMatch');

        case 56:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[8, 21, 25, 33], [26,, 28, 32]]);
}

module.exports = {
  axiosCall: axiosCall,
  recUrlCreator: recUrlCreator,
  newPlaylistTracks: newPlaylistTracks,
  addSongsToNewPlaylist: addSongsToNewPlaylist,
  getDate: getDate,
  multipleArtistUrl: multipleArtistUrl,
  addToExisting: addToExisting,
  newUserTracks: newUserTracks,
  search: search,
  searchUrlCreator: searchUrlCreator,
  userUris: userUris,
  userMod: userMod
};