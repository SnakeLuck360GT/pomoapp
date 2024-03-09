let timer;
let minutes = 25;
let seconds = 0;

var isCooldown = false;
var cooldownDuration = 200

var state = "default";
var timerState = "Pomodoro";
var pauseImage = document.getElementById("pauseTimer").querySelector('img');
var resetImage =  document.getElementById("skipTimer").querySelector('img');

const {ipcRenderer} = require('electron');

function exit() {
    ipcRenderer.send("closeWindow","");
}

function minimise(){
    ipcRenderer.send("minimiseWindow","")
}

function settings(){
    ipcRenderer.send("openSettings","")
}


function updateSpotifyInfo() {
    // Fetch the config.json file
    fetch('../config.json')
      .then(response => response.json())
      .then(config => {
        // Get the necessary values from the config object
        const lastAlbumCoverUrl = config.spotifyAuth.last_album_cover_url + '?timestamp=' + new Date().getTime();
        const lastSong = config.spotifyAuth.last_song;
        const lastArtist = config.spotifyAuth.last_artist;

        const authCode = config.spotifyAuth.authCode;

        const albumImage = document.getElementById('spotify-album').querySelector('img');
        const titleAndArtist = document.getElementById('spotify-title-and-artist');
        const forward = document.getElementById('next-song');
        const backward = document.getElementById('previous-song');

        if (!authCode) {
            titleAndArtist.textContent = `Please link Spotify in settings!`
            albumImage.src = '../resources/spotify-16.png';
            forward.style.visibility = "hidden";
            backward.style.visibility = "hidden";
            return;
        } else if (lastSong === undefined && lastArtist === undefined) {
            titleAndArtist.textContent = `No song currently playing!`
            albumImage.src = '../resources/cat.jpg';
            albumImage.style.visibility = 'visible';
            hideElement(forward);
            hideElement(backward);
            return;
        }

        // Check if the values are already set to avoid unnecessary updates
        if (albumImage.src == lastAlbumCoverUrl && titleAndArtist.textContent == `${lastSong} • ${lastArtist}`) {
            return;
        }

        // Update the elements
        albumImage.src = lastAlbumCoverUrl;
        titleAndArtist.textContent = `${lastSong} • ${lastArtist}`;
        albumImage.style.visibility = 'visible';

        // Show/hide the elements based on the condition
        toggleVisibility(forward, lastSong !== undefined && lastArtist !== undefined);
        toggleVisibility(backward, lastSong !== undefined && lastArtist !== undefined);
      })
      .catch(error => console.error('Error fetching or updating config:', error));
}

// Helper function to toggle visibility
function toggleVisibility(element, condition) {
    if (element) {
        if (condition) {
            element.style.visibility = 'visible';
        } else {
            element.style.visibility = 'hidden';
        }
    }
}

// Helper function to hide an element
function hideElement(element) {
    if (element) {
        element.style.visibility = 'hidden';
    }
}

// Example usage
const updateSpotify = setInterval(updateSpotifyInfo, 500);

  function spotifyEnabled() {
    const elementsToToggle = ['spotify-album', 'spotify-title-and-artist', 'next-song', 'previous-song'];

    fetch('../config.json')
        .then(response => response.json())
        .then(config => {
            const spotifyEnabled = config.spotifyAuth.spotify_enabled;

            elementsToToggle.forEach(elementId => {
                const element = document.getElementById(elementId);
                element.style.display = spotifyEnabled === 'true' ? 'block' : 'none';
            });
        })
        .catch(error => {
            console.error('Error fetching config.json:', error);
        });
}


  const isSpotifyEnabled = setInterval(spotifyEnabled, 500);

 function previousSong(){
    fetch('../config.json')
    .then(response => response.json())
      .then(config => {
        const accessToken = config.spotifyAuth.access_token;
        const previousTrackEndpoint = 'https://api.spotify.com/v1/me/player/previous';
    
    // Make the request to go back to the previous track
        fetch(previousTrackEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+ accessToken
            },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to go back to the previous track');
        }
        console.log('Successfully went back to the previous track');
      })
      .catch(error => console.error(error));
      })

  }


function pauseTimer() {
    if(!isCooldown){
        if (state === "default") {
            pauseImage.src = "../resources/pause-16.png"; 
            state = "playing";
            isCooldown = true;
        }
         else if (state === "playing"){
            pauseImage.src = "../resources/play-16.png"; 
            state = "default";
            isCooldown = true;
        }
    }

    setTimeout(() => {
        isCooldown = false;
    }, cooldownDuration);
}

