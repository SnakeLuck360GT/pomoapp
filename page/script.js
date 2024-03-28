const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let roundNumber = 1;
let totalRounds = 0;

var isCooldown = false;
var cooldownDuration = 200;

var state = "default";
var pauseImage = document.getElementById("pauseTimer").querySelector('img');
var resetImage = document.getElementById("skipTimer").querySelector('img');

// Import the getConfigPath function from the ipcRendererModule.js file
const configPath = path.join(__dirname, '..' ,'config', 'config.json');
console.log(configPath)
let userDataPath;

function exit() {
    ipcRenderer.send("closeWindow","");
}

function minimise(){
    ipcRenderer.send("minimiseWindow","")
}

function settings(){
    ipcRenderer.send("openSettings","")
}

let isWork = true;
let isShortBreak = false;
let isLongBreak = false;
let timerInterval;


const timerDisplay = document.getElementById('time');
let secondsLeft;

function startTimer() {
    if (isWork) {
        return startWorkTimer();
    } else if (isShortBreak) {
        return startShortBreakTimer();
    } else if (isLongBreak) {
        return startLongBreakTimer();
    }
}

function playWorkAudio() {
    var workAudio = document.getElementById("workAudio");
    workAudio.play();
  }
function playShortBreakAudio() {
    var ShortBreakAudio = document.getElementById("shortBreakAudio");
    ShortBreakAudio.play();
  }
function playLongBreakAudio() {
    var LongBreakAudio = document.getElementById("longBreakAudio");
    LongBreakAudio.play();
  }

let workDuration = 0;
let shortBreakDuration = 0;
let longBreakDuration = 0;
let roundsInASet = 0;

function updateTimerDisplay() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateRoundsDisplay(roundsInASet) {
    roundNumberText.textContent = `${roundNumber}/${roundsInASet} (${totalRounds})`;
}


function whichBreakisIt(){
    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading config file:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const roundsInASet = config.timerSettings.roundNumber;

            if (roundNumber - 1 < roundsInASet) {
                startShortBreakTimer();
                pomodoroIndicator.style.backgroundColor = 'transparent';
                shortBreakIndicator.style.backgroundColor = '#c5aaf9';
                roundNumberText.textContent = `${roundNumber - 1}/${roundsInASet} (${totalRounds})`;
                isWork = false;
                isShortBreak = true;
                isLongBreak = false;
                ipcRenderer.send("shortBreakNotification", roundNumber);
                console.log("Short Break started");
            } else if (roundNumber >= roundsInASet) {
                console.log("long break started");
                pomodoroIndicator.style.backgroundColor = 'transparent';
                shortBreakIndicator.style.backgroundColor = 'transparent';
                longBreakIndicator.style.backgroundColor = '#c5aaf9';
                isWork = false;
                isShortBreak = false;
                isLongBreak = true;
                roundNumberText.textContent = `${roundNumber - 1}/${roundsInASet} (${totalRounds})`;
                roundNumber = 1;
                ipcRenderer.send("longBreakNotification", roundNumber);
                startLongBreakTimer();
            }
        } catch (parseError) {
            console.error('Error parsing config JSON:', parseError);
        }
    });
}

let skipCooldown = false; 

function skipTimer() {
    if (skipCooldown) {
        return; // Exit function if cooldown is active
    }

    clearInterval(timerInterval);
    timerInterval = null;
    pauseImage.src = "../resources/pause-16.png"; 
    state = "playing";
    
    // Start cooldown
    skipCooldown = true;
    setTimeout(() => {
        skipCooldown = false; // Reset cooldown after 2 seconds
    }, 2000);

    if (isWork) {
        roundNumber++;
        totalRounds++;
        console.log(roundNumber,totalRounds)
        workRan = false;
        whichBreakisIt();
    } else {
        if (isShortBreak) {
            clearInterval(timerInterval);
            ShortBreakRan = false;
            isWork = true;
            isShortBreak = false;
            pomodoroIndicator.style.backgroundColor = '#c5aaf9';
            shortBreakIndicator.style.backgroundColor = 'transparent';
            roundNumberText.textContent = `${roundNumber}/${roundsInASet} (${totalRounds})`;
            ipcRenderer.send("shortBreakEndNotification", roundNumber);
            startWorkTimer();
        } else if (isLongBreak) {
            clearInterval(timerInterval);
            longBreakRan = false;
            isWork = true;
            isLongBreak = false;
            pomodoroIndicator.style.backgroundColor = '#c5aaf9';
            longBreakIndicator.style.backgroundColor = 'transparent';
            roundNumberText.textContent = `${roundNumber}/${roundsInASet} (${totalRounds})`;
            ipcRenderer.send("longBreakEndNotification", roundNumber);
            startWorkTimer();
        }
    }
}


function toggleTimer() {
    if (!isCooldown) {
        if (state === "default") {
            pauseImage.src = "../resources/pause-16.png"; 
            state = "playing";
            isCooldown = true;
            startTimer();

        } else if (state === "playing") {
            pauseImage.src = "../resources/play-16.png"; 
            state = "default";
            isCooldown = true;
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    setTimeout(() => {
        isCooldown = false;
    }, cooldownDuration);
}


// Receive the userData path from the main process

    
    // Function to read the configuration from config.json
    function readConfig(callback) {
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading config file:', err);
                callback(err, null);
                return;
            }
    
            try {
                const config = JSON.parse(data);
                callback(null, config);
            } catch (parseError) {
                console.error('Error parsing config JSON:', parseError);
                callback(parseError, null);
            }
        });
    }
    
    // Update Spotify information function using new config system
    function updateSpotifyInfo() {
        readConfig((err, config) => {
            if (err) {
                console.error('Error reading config file:', err);
                return;
            }
    
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
        });
    }
    
    // Update Spotify enabled function using new config system
    function spotifyEnabled() {
        const elementsToToggle = ['spotify-album', 'spotify-title-and-artist', 'next-song', 'previous-song'];
    
        readConfig((err, config) => {
            if (err) {
                console.error('Error reading config file:', err);
                return;
            }
    
            const spotifyEnabled = config.spotifyAuth.spotify_enabled;
    
            elementsToToggle.forEach(elementId => {
                const element = document.getElementById(elementId);
                element.style.display = spotifyEnabled === 'true' ? 'block' : 'none';
            });
        });
    }
    
    // Example usage of spotifyEnabled function
    
    
    // Function to hide an element
    function hideElement(element) {
        if (element) {
            element.style.visibility = 'hidden';
        }
    }
    
    // Function to toggle visibility of an element
    function toggleVisibility(element, condition) {
        if (element) {
            element.style.visibility = condition ? 'visible' : 'hidden';
        }
    }
    
    
    updateRPC = setInterval(() => {
        updateDiscordRPC(secondsLeft);
    }, 1000);

    // Example usage
    const updateSpotify = setInterval(updateSpotifyInfo, 500);
    
    function spotifyEnabled() {
        const elementsToToggle = ['spotify-album', 'spotify-title-and-artist', 'next-song', 'previous-song'];
    
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading config file:', err);
                return;
            }
    
            try {
                const config = JSON.parse(data);
                const spotifyEnabled = config.spotifyAuth.spotify_enabled;
    
                elementsToToggle.forEach(elementId => {
                    const element = document.getElementById(elementId);
                    element.style.display = spotifyEnabled === 'true' ? 'block' : 'none';
                });
            } catch (parseError) {
                console.error('Error parsing config JSON:', parseError);
            }
        });
    }
    
    const isSpotifyEnabled = setInterval(spotifyEnabled, 500);
    
    function previousSong(){
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading config file:', err);
                return;
            }
    
            try {
                const config = JSON.parse(data);
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
                        throw new Error('Failed to go back to the previous track (Most likely no Spotify Premium)');
                    }
                    console.log('Successfully went back to the previous track');
                })
                .catch(error => console.error(error));
            } catch (parseError) {
                console.error('Error parsing config JSON:', parseError);
            }
        });
    }
    
    function nextSong(){
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading config file:', err);
                return;
            }
    
            try {
                const config = JSON.parse(data);
                const accessToken = config.spotifyAuth.access_token;
                const nextTrackEndpoint = 'https://api.spotify.com/v1/me/player/next';
            
                // Make the request to go to the next track
                fetch(nextTrackEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+ accessToken
                    },
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to go to next track (Most likely no Spotify Premium)');
                    }
                    console.log('Successfully went to the next track');
                })
                .catch(error => console.error(error));
            } catch (parseError) {
                console.error('Error parsing config JSON:', parseError);
            }
        });
    }
    
    

    
    
    

    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading config file:', err);
            return;
        }
    
        try {
            const config = JSON.parse(data);
            const timerDuration = config.timerSettings.timerDuration;
            secondsLeft = timerDuration * 60;
            console.log(secondsLeft);
            updateTimerDisplay(); // Update timer display once secondsLeft is initialized
        } catch (parseError) {
            console.error('Error parsing config JSON:', parseError);
        }
    });

    

    
    
    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading config file:', err);
            return;
        }
    
        try {
            const config = JSON.parse(data);
            workDuration = config.timerSettings.timerDuration;
            shortBreakDuration = config.timerSettings.shortBreakDuration;
            longBreakDuration = config.timerSettings.longBreakDuration;
            roundsInASet = config.timerSettings.roundNumber;
        } catch (parseError) {
            console.error('Error parsing config JSON:', parseError);
        }
    });
    

    const pomodoroIndicator = document.getElementById("work");
    const shortBreakIndicator = document.getElementById("short-break");
    const longBreakIndicator = document.getElementById("long-break");
    const roundNumberText = document.getElementById("round-number");
    

    let workRan = false;
let timerEndTimestamp;



function startWorkTimer(){
    clearInterval(timerInterval);
    if(!workRan){
        fs.readFile(configPath, 'utf8', (err, data) => {        
            try {
                const config = JSON.parse(data);
                workDuration = config.timerSettings.timerDuration;
                roundsInASet = config.timerSettings.roundNumber;
            } catch (parseError) {
                console.error('Error parsing config JSON:', parseError);
            }
        });
        
        const timerDuration = workDuration;
        secondsLeft = timerDuration * 60;
        workRan = true;
        playWorkAudio();
    }


    updateTimerDisplay();
    timerInterval = setInterval(() => {
        secondsLeft--;

        if (secondsLeft < 1490) {
            clearInterval(timerInterval);
            roundNumber++;
            totalRounds++;
            console.log(roundNumber,totalRounds)
            workRan = false
            whichBreakisIt();
        } else {
            updateTimerDisplay();
        }
    }, 1000);
}



    
    
    
    let ShortBreakRan = false
    function startShortBreakTimer() {
        console.log("lol short break started help me");
        clearInterval(timerInterval);
        timerInterval = null;
        pauseImage.src = "../resources/pause-16.png"; 
        state = "playing";
    
        if(!ShortBreakRan){
            fs.readFile(configPath, 'utf8', (err, data) => {
                try {
                    const config = JSON.parse(data);
                    shortBreakDuration = config.timerSettings.shortBreakDuration;
                    roundsInASet = config.timerSettings.roundNumber;
                } catch (parseError) {
                    console.error('Error parsing config JSON:', parseError);
                }
            });
            const timerDuration = shortBreakDuration;
            secondsLeft = timerDuration * 60;
            playShortBreakAudio();
            ShortBreakRan = true
        }
    
    
        updateTimerDisplay();
    
        // Start the timer
        timerInterval = setInterval(() => {
            secondsLeft--;
    
            if (secondsLeft < 295) {
                clearInterval(timerInterval);
                ShortBreakRan = false
                isWork = true
                isShortBreak = false
                pomodoroIndicator.style.backgroundColor = '#c5aaf9';
                shortBreakIndicator.style.backgroundColor = 'transparent';
                roundNumberText.textContent = `${roundNumber}/${roundsInASet} (${totalRounds})`;
                ipcRenderer.send("shortBreakEndNotification",roundNumber);
                startWorkTimer();
                
            } else {
                updateTimerDisplay();
            }
        }, 1000);
    }
    
    
    let longBreakRan = false
    function startLongBreakTimer(){
        clearInterval(timerInterval);
        timerInterval = null;
        pauseImage.src = "../resources/pause-16.png"; 
        state = "playing";
    
        if(!longBreakRan){
            fs.readFile(configPath, 'utf8', (err, data) => {
                try {
                    const config = JSON.parse(data);
                    longBreakDuration = config.timerSettings.longBreakDuration;
                    roundsInASet = config.timerSettings.roundNumber;
                } catch (parseError) {
                    console.error('Error parsing config JSON:', parseError);
                }
            });
            const timerDuration = longBreakDuration;
            secondsLeft = timerDuration * 60;
            longBreakRan = true
            playLongBreakAudio();
        }
    
    
        updateTimerDisplay();
    
        // Start the timer
        timerInterval = setInterval(() => {
            secondsLeft--;
    
            if (secondsLeft < 1795) {
                clearInterval(timerInterval);
                longBreakRan = false
                isWork = true
                isLongBreak = false
                pomodoroIndicator.style.backgroundColor = '#c5aaf9';
                longBreakIndicator.style.backgroundColor = 'transparent';
                roundNumberText.textContent = `${roundNumber}/${roundsInASet} (${totalRounds})`;
                ipcRenderer.send("longBreakEndNotification",roundNumber);
                startWorkTimer();
            } else {
                updateTimerDisplay();
            }
        }, 1000);
    }
    

    

    
    document.addEventListener('DOMContentLoaded', () => {
        const pomodoroIndicator = document.getElementById("work");
        pomodoroIndicator.style.backgroundColor = '#c5aaf9';
    
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading config file:', err);
                return;
            }
    
            try {
                const config = JSON.parse(data);
                const timerDuration = config.timerSettings.timerDuration;
                roundsInASet = config.timerSettings.roundNumber;
                secondsLeft = timerDuration * 60;
                console.log(secondsLeft);
    
                updateTimerDisplay();
                updateRoundsDisplay(roundsInASet);
                updateSpotifyInfo();
                spotifyEnabled();
            } catch (parseError) {
                console.error('Error parsing config JSON:', parseError);
            }
        });
    });
    





const clientId = '1221139127433695325';
const DiscordRPC = require('discord-rpc');
const RPC = new DiscordRPC.Client({transport: 'ipc'});

DiscordRPC.register(clientId);

async function setIdleActivity(){
    if(!RPC) return console.log("wtf");
    console.log("please")
    RPC.setActivity({
        details: `Idle`,
        state: `Not started timer yet`,
        startTimestamp: Date.now(),
        largeImageKey: `cat-idle`,
        largeImageText: `Idle`,
        smallImageKey: `break`,
        smallImageText: `Idle`,
        instance: false,
        buttons:[
            {
                label: `Download PomoApp!`,
                url: `https://github.com/SnakeLuck360GT/pomoapp`
            }
        ]
    })
}

RPC.on('ready', async() =>{
    console.log("hi")
    setIdleActivity();
})

RPC.login({clientId}).catch(err => console.log(err));


async function updateDiscordRPC(secondsLeft){
    if(!RPC) return;

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const endTimestamp = currentTimestamp + secondsLeft + 1;

    if(isWork && workRan){
        RPC.setActivity({
            details: `State: Pomodoro`,
            state: `${roundNumber}/${roundsInASet} (${totalRounds})`,
            endTimestamp: endTimestamp,
            largeImageKey: `purple-sky-icon`,
            largeImageText: `Studying`,
            smallImageKey: `work`,
            smallImageText: `Studying`,
            instance: false,
            buttons:[
                {
                    label: `Download PomoApp!`,
                    url: `https://github.com/SnakeLuck360GT/pomoapp`
                }
            ]
        })
        return;
    }
    else if(isShortBreak && ShortBreakRan){
        RPC.setActivity({
            details: `State: Short Break`,
            state: `${roundNumber-1}/${roundsInASet} (${totalRounds})`,
            endTimestamp: endTimestamp,
            largeImageKey: `cat-idle`,
            largeImageText: `On Short Break`,
            smallImageKey: `break`,
            smallImageText: `On Short Break`,
            instance: false,
            buttons:[
                {
                    label: `Download PomoApp!`,
                    url: `https://github.com/SnakeLuck360GT/pomoapp`
                }
            ]
        })
        return;
    }

    else if(isLongBreak && longBreakRan){
        RPC.setActivity({
            details: `State: Long Break`,
            state: `${roundNumber}/${roundsInASet} (${totalRounds})`,
            endTimestamp: endTimestamp,
            largeImageKey: `cat-idle`,
            largeImageText: `On Long Break`,
            smallImageKey: `break`,
            smallImageText: `Studying`,
            instance: false,
            buttons:[
                {
                    label: `Download PomoApp!`,
                    url: `https://github.com/SnakeLuck360GT/pomoapp`
                }
            ]
        })
        return;
    }

}

function resetTimer(){
     roundNumber = 1;
     totalRounds = 0;
    roundNumberText.textContent = `${roundNumber}/${roundsInASet} (${totalRounds})`;
    clearInterval(timerInterval)
    workRan = false;
    ShortBreakRan = false;
    longBreakRan = false;
    isWork = true;
    isShortBreak = false;
    isLongBreak = false;
    pomodoroIndicator.style.backgroundColor = '#c5aaf9';
    longBreakIndicator.style.backgroundColor = 'transparent';
    shortBreakIndicator.style.backgroundColor = 'transparent';
    state = "default";
    toggleTimer();
}