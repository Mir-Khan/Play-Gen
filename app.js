const axios = require("axios"),
    querystring = require("querystring"),
    underscore = require("underscore");

//axios different functions
async function axiosCall(callObject, type = undefined) {
    const response = await axios(callObject).then(res => {
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

// this function creates a url to get recommendations from the web api
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

// this function gets recommended tracks based on listening history
async function newPlaylistTracks(num_songs, foundUser) {
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
    let artistsObject = await axiosCall({ url: artistsUrl, headers: nonJsonHeaders });
    let tracksObject = await axiosCall({ url: tracksUrl, headers: nonJsonHeaders });
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
        let recommendations = await axiosCall({ url: recUrl, headers: jsonHeaders });
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
                recommendations = await axiosCall({ url: recUrl, headers: jsonHeaders });
                for (item of recommendations.tracks) {
                    recomTrackUris.push(item.uri);
                }
            } else {
                let remainingSongs = Number(num_songs) - (100 * (numIters - 1));
                let recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
                recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
                recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
                recUrl = recUrlCreator(recUrl, 'seed_tracks', tracks);
                recommendations = await axiosCall({ url: recUrl, headers: jsonHeaders });
                for (item of recommendations.tracks) {
                    recomTrackUris.push(item.uri);
                }
            }
        }
        return recomTrackUris;
    }
}

// this function adds on the songs to the newly created songs
async function addSongsToNewPlaylist(uris, newPlaylistId, num_songs, jsonHeaders) {
    // I used the id returned from the creation in order to create the url, while also adding the track uris to the url
    // This behaves differently if there were more than 100 songs requested
    // I called the api multiple times, using selections of 100 uris at a time except for the last time where
    // I used whatever the remaining number of apis is left
    if (Number(num_songs) > 100) {
        let numIters = Number(num_songs) % 100 !== 0 ? Math.floor(Number(num_songs) / 100) + 1 : Math.floor(Number(num_songs) / 100);
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
            await axiosCall({ method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody }, 'add');
        }
    } else {
        let dataBody = { "uris": uris };
        let addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + newPlaylistId + '/tracks';
        await axiosCall({ method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody }, 'add');
    }
}

//function to get the current date, taken from stackoverflow
function getDate() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    return mm + '/' + dd + '/' + yyyy;
}
//making a query url with multiple artists
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

//function to add to an existing playlist based on listening history
async function addToExisting(name, num_songs, foundUser, currentUserId) {
    const jsonHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + foundUser[0].accessToken };
    let playlists = await axiosCall({ url: 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists', headers: jsonHeaders });
    // if the inputted name doesn't exist, then the match variable should be false and I notify the user
    let match = false;
    let matchedId;
    for (playlist of playlists.items) {
        if ((playlist.name).toLowerCase() === name.toLowerCase()) {
            match = true;
            // I use these later on
            matchedId = playlist.id;
            // no need to continue the loop, hopefully the user knows the name of their playlist
            break;
        }
    }
    if (match) {
        // now I get the playlist's tracks, artists, and genres present
        let foundPlaylist = await axiosCall({ url: 'https://api.spotify.com/v1/playlists/' + matchedId, headers: jsonHeaders });
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
                }
            }
            // the get multiple artists part of the Artist API only allows up to 50 artists to be queried
            // if there are less than 50 artists in a playlist, no biggie as it just gets all of the artists
            // I just did this instead of trying to get all artists because if a playlist has 500 unique artists
            // then I'd have to end up doing 10 calls to the get multiple artist part of the Artist API and this 
            // would slow everything down
            let sampledArtists = underscore.sample(artists, 50);
            let artistUrl = multipleArtistUrl(sampledArtists);
            // now the artists object will be returned here from the API
            let severalArtists = await axiosCall({ url: artistUrl, headers: jsonHeaders });
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
                    recommendations = await axiosCall({ url: recUrl, headers: jsonHeaders });
                    for (item of recommendations.tracks) {
                        uris.push(item.uri);
                    }
                } else {
                    let remainingSongs = Number(num_songs) - (100 * (numIters - 1));
                    let recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
                    recUrl = recUrlCreator(recUrl, 'seed_artists', seedArtists);
                    recUrl = recUrlCreator(recUrl, 'seed_genres', seedGenres);
                    recUrl = recUrlCreator(recUrl, 'seed_tracks', seedTracks);
                    recommendations = await axiosCall({ url: recUrl, headers: jsonHeaders });
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
                    await axiosCall({ method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody }, 'add');
                }
            } else {
                let dataBody = { "uris": uris };
                let addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + matchedId + '/tracks';
                await axiosCall({ method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody }, 'add');
            }
        } else {
            return 'noSong'
        }
    } else {
        return 'noPlay';
    }
}

// this function makes a new playlist based on user inputs
async function newUserTracks(queries, foundUser, userId) {
    const jsonHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + foundUser[0].accessToken };
    let publicState;
    if (queries.private_checkbox === undefined) {
        publicState = false;
    } else {
        publicState = true;
    }
    let artists = [];
    let genres = [];
    // the user has the option of inputting 3-5 items, so this covers the optional inputs
    if (queries.artistTwo === '') {
        artists.push(queries.artistOne);
    } else {
        artists.push(queries.artistOne, queries.artistTwo);
    }
    if (queries.genreTwo === '') {
        genres.push(queries.genreOne);
    } else {
        genres.push(queries.genreOne, queries.genreTwo);
    }
    // now the ids are collected for the tracks and ids
    let artistsIds = [];
    // this is so the function to create the recommendation url doesn't run into any problems
    let trackId = await search(queries.trackNew, 'track', jsonHeaders, queries.trackNewArtist);
    if(trackId !== undefined){
        let trackIdArr = [trackId.id];
        for (artist of artists) {
            let currentId = await search(artist, 'artist', jsonHeaders);
            artistsIds.push(currentId);
        }
        // the rest is extremely similar to the recommendation based playlist creator
        let uris = await userUris(trackIdArr, genres, artistsIds, queries.num_songs, jsonHeaders);
        let newPlaylistDetails = { name: queries.new_playlist_name, public: publicState, description: "Created on " + getDate() };
        let newPlaylistUrl = 'https://api.spotify.com/v1/users/' + userId + '/playlists';
        let newPlaylistId = await axiosCall({ method: 'post', url: newPlaylistUrl, headers: jsonHeaders, data: newPlaylistDetails, dataType: 'json' }, 'new');
        await addSongsToNewPlaylist(uris, newPlaylistId, queries.num_songs, jsonHeaders);
    }else{
        return "error"
    }
}

// this function is responsible for getting the ids needed for the recommendations based on the user inputs
async function search(query, type, header, trackArtist = undefined, offset = undefined) {
    if (trackArtist === undefined) {
        // this part searches for artist ids
        let callUrl = searchUrlCreator(query, type);
        let result = await axiosCall({ url: callUrl, headers: header });
        return result.artists.items[0].id;
    } else {
        // this part searches for track ids
        let callUrl = searchUrlCreator(query + ' ' + trackArtist, type);
        let result = await axiosCall({ url: callUrl, headers: header });
        let matchedTrack;
        for (track of result.tracks.items) {
            if ((track.artists[0].name).toLowerCase() === trackArtist.toLowerCase()) {
                matchedTrack = track;
            }
        }
        // if the title query is extremely common and the artist is relatively down the search list, the 
        // first search may not be enough and it may need to be offset
        let offset = 50;
        // this will continue until offset is 1950 because the API has a limit of 2000, which includes the limit of 50 and the offset value
        while(matchedTrack === undefined && offset < 1950){
            let offsetCall = searchUrlCreator(query + ' ' + trackArtist, type, offset.toString());
            let offsetResult = await axiosCall({ url: callUrl, headers: header });
            let offsetMatch;
            for (track of result.tracks.items) {
                if ((track.artists[0].name).toLowerCase() === trackArtist.toLowerCase()) {
                    offsetMatch = track;
                }
            }
            offset += 50;
        }
        if(matchedTrack === undefined){
            return undefined;
        }else{
            return matchedTrack;
        }
    }
}

// this function creates a search url for the search API
function searchUrlCreator(query, type, offset = undefined) {
    if (offset === undefined) {
        let baseUrl = 'https://api.spotify.com/v1/search?q=';
        let newQuery = query.split(' ').join('%20');
        return baseUrl + newQuery + '&type=' + type + '&market=US&limit=50';
    } else {
        let baseUrl = 'https://api.spotify.com/v1/search?q=';
        let newQuery = query.split(' ').join('%20');
        let limit = '50';
        return baseUrl + newQuery + '&type=' + type + '&market=US&limit=50&offset=' + offset;
    }
}

// this function is responsible for getting the actual uris for the new user defined playlist
async function userUris(track, genres, artists, num_songs, jsonHeaders) {
    if (Number(num_songs) < 100) {
        let recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + num_songs;
        recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
        recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
        recUrl = recUrlCreator(recUrl, 'seed_tracks', track);
        // now the recommended tracks are requested from Spotify
        let recommendations = await axiosCall({ url: recUrl, headers: jsonHeaders });
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
                recUrl = recUrlCreator(recUrl, 'seed_tracks', track);
                recommendations = await axiosCall({ url: recUrl, headers: jsonHeaders });
                for (item of recommendations.tracks) {
                    recomTrackUris.push(item.uri);
                }
            } else {
                let remainingSongs = Number(num_songs) - (100 * (numIters - 1));
                let recUrl = 'https://api.spotify.com/v1/recommendations?limit=' + remainingSongs.toString();
                recUrl = recUrlCreator(recUrl, 'seed_artists', artists);
                recUrl = recUrlCreator(recUrl, 'seed_genres', genres);
                recUrl = recUrlCreator(recUrl, 'seed_tracks', track);
                recommendations = await axiosCall({ url: recUrl, headers: jsonHeaders });
                for (item of recommendations.tracks) {
                    recomTrackUris.push(item.uri);
                }
            }
        }
        return recomTrackUris;
    }
}

// this takes care of the modification input of the user input form
async function userMod(queries, foundUser, userId) {
    const jsonHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + foundUser[0].accessToken };
    let artists = [];
    let genres = [];
    // the user has the option of inputting 3-5 items, so this covers the optional inputs
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
    let artistsIds = [];
    let trackId = await search(queries.trackMod, 'track', jsonHeaders, queries.trackModArtist);
    let trackIdArr = [trackId.id];
    for (artist of artists) {
        let currentId = await search(artist, 'artist', jsonHeaders);
        artistsIds.push(currentId);
    }
    let uris = await userUris(trackIdArr, genres, artistsIds, queries.add_songs, jsonHeaders);
    await userAddToExisting(queries.mod_playlist_name, queries.add_songs, userId, jsonHeaders, uris);
}

// takes care of adding the user inputted recommended songs to an existing playlist
async function userAddToExisting(name, num_songs, currentUserId, jsonHeaders, uris) {
    let playlists = await axiosCall({ url: 'https://api.spotify.com/v1/users/' + currentUserId + '/playlists', headers: jsonHeaders });
    // a lot of this is just the addToExisting function just with the recommendation API being removed
    let match = false;
    let matchedId;
    for (playlist of playlists.items) {
        if ((playlist.name).toLowerCase() === name.toLowerCase()) {
            match = true;
            matchedId = playlist.id;
            break;
        }
    }
    if (match) {
        let addPlaylistUrl = 'https://api.spotify.com/v1/playlists/' + matchedId + '/tracks';
        let numIters = Number(num_songs) % 100 === 0 ? Math.floor(Number(num_songs) / 100) : Math.floor((Number(num_songs) / 100)) + 1;
        if (Number(num_songs)) {
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
                await axiosCall({ method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody }, 'add');
            }
        } else {
            let dataBody = { 'uris': uris };
            await axiosCall({ method: 'post', url: addPlaylistUrl, headers: jsonHeaders, data: dataBody }, 'add');
        }
    } else {
        console.log('noMatch');
    }
}

module.exports = {
    axiosCall, recUrlCreator, newPlaylistTracks, addSongsToNewPlaylist, getDate, multipleArtistUrl, addToExisting, newUserTracks, search, searchUrlCreator, userUris, userMod
}