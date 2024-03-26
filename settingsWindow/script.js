const { ipcRenderer, remote } = require('electron');
const fs = require('fs');
const path = require('path');


// Get the userData path

const configFilePath = path.join(__dirname, '..', 'config', 'config.json');
console.log(configFilePath)

function exit() {
    ipcRenderer.send("closeSettings", "");
}

function minimise() {
    ipcRenderer.send("minimiseSettings", "");
}

function spotifySync() {
    updateDynamicText();
    ipcRenderer.send("authorize-spotify", "");
}

function checkIfFilled() {
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const spotifyEnabled = config.spotifyAuth.spotify_enabled;
            const minimiseOnCloseEnabled = config.mainSettings.minimize_to_tray_on_close;
            const minimiseToTrayEnabled = config.mainSettings.minimize_to_tray;
            const circleButtons = document.getElementsByClassName("circle-button");
            const minimizeButton = document.getElementById("circle-button-minimize-on-close");
            const minimizeTrayButton = document.getElementById("circle-button-minimize-to-tray");

            // Loop through each element with the class 'circle-button'
            for (const circlebutton of circleButtons) {
                const computedStyle = getComputedStyle(circlebutton);
                const backgroundColor = computedStyle.backgroundColor;

                if (spotifyEnabled === "true" && backgroundColor !== 'rgb(255, 255, 255)') {
                    circlebutton.classList.add('clicked');
                } else if (spotifyEnabled === "false" && backgroundColor !== 'transparent') {
                    circlebutton.classList.remove('clicked');
                }
            }

            // Toggle the 'clicked' class based on minimiseOnCloseEnabled
            if (minimizeButton) {
                const computedStyle = getComputedStyle(minimizeButton);
                const backgroundColor = computedStyle.backgroundColor;
                if (minimiseOnCloseEnabled === "true" && backgroundColor !== 'rgb(255, 255, 255)') {
                    minimizeButton.classList.add('clicked');
                } else if (minimiseOnCloseEnabled === "false" && backgroundColor !== 'transparent') {
                    minimizeButton.classList.remove('clicked');
                }
            }

            if (minimizeTrayButton) {
                const computedStyle = getComputedStyle(minimizeTrayButton);
                const backgroundColor = computedStyle.backgroundColor;
                if (minimiseToTrayEnabled === "true" && backgroundColor !== 'rgb(255, 255, 255)') {
                    minimizeTrayButton.classList.add('clicked');
                } else if (minimiseToTrayEnabled === "false" && backgroundColor !== 'transparent') {
                    minimizeTrayButton.classList.remove('clicked');
                }
            }
        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}

const intervalId = setInterval(checkIfFilled, 10);

function toggleFill(element) {
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const spotifyEnabled = config.spotifyAuth.spotify_enabled;
            const newSpotifyEnabled = spotifyEnabled === "true" ? "false" : "true";

            // Update the config object
            config.spotifyAuth.spotify_enabled = newSpotifyEnabled;

            // Write the updated config back to the file
            fs.writeFile(configFilePath, JSON.stringify(config, null, 2), err => {
                if (err) {
                    console.error('Error writing config.json:', err);
                } else {
                    console.log('Config updated successfully.');
                    checkIfFilled(); // Refresh UI after updating config
                }
            });
        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}

const updateDynamicText = () => {
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const dynamicTextElement = document.getElementById('Sync-Text');

            if (config.spotifyAuth.authCode !== "") {
                dynamicTextElement.textContent = 'Synced';
            } else {
                dynamicTextElement.textContent = 'Sync';
            }
        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    checkIfFilled();
    updateDynamicText();
});

function minimiseonclose() {
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const minimiseOnCloseEnabled = config.mainSettings.minimize_to_tray_on_close;
            const newMinimiseOnCloseEnabled = minimiseOnCloseEnabled === "true" ? "false" : "true";

            // Update the config object
            config.mainSettings.minimize_to_tray_on_close = newMinimiseOnCloseEnabled;

            // Write the updated config back to the file
            fs.writeFile(configFilePath, JSON.stringify(config, null, 2), err => {
                if (err) {
                    console.error('Error writing config.json:', err);
                } else {
                    console.log('Config updated successfully.');
                    checkIfFilled(); // Refresh UI after updating config
                }
            });
        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}

function minimizetotray() {
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const minimizeToTrayEnabled = config.mainSettings.minimize_to_tray;
            const newMinimizeToTrayEnabled = minimizeToTrayEnabled === "true" ? "false" : "true";

            // Update the config object
            config.mainSettings.minimize_to_tray = newMinimizeToTrayEnabled;

            // Write the updated config back to the file
            fs.writeFile(configFilePath, JSON.stringify(config, null, 2), err => {
                if (err) {
                    console.error('Error writing config.json:', err);
                } else {
                    console.log('Config updated successfully.');
                    checkIfFilled(); // Refresh UI after updating config
                }
            });
        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}

