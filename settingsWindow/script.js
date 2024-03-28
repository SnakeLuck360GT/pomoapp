const { ipcRenderer, remote } = require('electron');
const fs = require('fs');
const path = require('path');
const { start } = require('repl');


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

function toggleClickedClass(element, condition, targetValue) {
    if (element) {
        const computedStyle = getComputedStyle(element);
        const backgroundColor = computedStyle.backgroundColor;
        if (condition === "true" && backgroundColor !== targetValue) {
            element.classList.add('clicked');
        } else if (condition === "false" && backgroundColor !== 'transparent') {
            element.classList.remove('clicked');
        }
    }
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
            for (const circleButton of circleButtons) {
                toggleClickedClass(circleButton, spotifyEnabled, 'rgb(255, 255, 255)');
            }

            // Toggle the 'clicked' class based on minimiseOnCloseEnabled
            toggleClickedClass(minimizeButton, minimiseOnCloseEnabled, 'rgb(255, 255, 255)');
            toggleClickedClass(minimizeTrayButton, minimiseToTrayEnabled, 'rgb(255, 255, 255)');
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

let CurrentPage = "timer-settings";

function UnloadandLoadPage(startPage, EndPage) {
    if (EndPage == CurrentPage) return;
    
    const startElement = document.getElementById(startPage.toLowerCase() + "-page");
    const endElement = document.getElementById(EndPage.toLowerCase() + "-page");

    if (startElement && endElement) {
        startElement.classList.add("hidden");
        setTimeout(function () {
            endElement.classList.remove("hidden");
            startElement.style.display = "none";
            endElement.style.display = "block";
            CurrentPage = EndPage;
            console.log(CurrentPage)
        }, 350);
    }
}

function openOptionsSettings() {
    UnloadandLoadPage("timer-settings","options");
}

function openTimerSettings(){
    UnloadandLoadPage("options","timer-settings");
}



document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    checkIfFilled();
    updateDynamicText();
    setPomodoroTimerLabel();
    setShortBreakTimerLabel();
    setLongBreakTimerLabel();
    setRoundNumberLabel();
});



const Pomodoroslider = document.getElementById('pomodoro-slider');
const PomodorovalueLabel = document.getElementById('PomodoroSliderValue');



function setPomodoroTimerLabel(){
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const PomodoroTimerDuration = config.timerSettings.timerDuration;

            Pomodoroslider.value = PomodoroTimerDuration;
            pomodoroUpdateValueLabel();
            

        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}


Pomodoroslider.addEventListener('input', () => { 
    pomodoroUpdateValueLabel();

});


function pomodoroUpdateValueLabel() {
    const value = Pomodoroslider.value;
    PomodorovalueLabel.textContent = value + ":00";
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);

            // Update the config object
            config.timerSettings.timerDuration = parseInt(value);

            fs.writeFile(configFilePath, JSON.stringify(config, null, 2), err => {
                if (err) {
                    console.error('Error writing config.json:', err);
                } else {
                    console.log('Config updated successfully.');
                }
            });
        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}


const ShortBreakSlider = document.getElementById('short-break-slider');
const ShortBreakSliderValue = document.getElementById('ShortBreakSliderValue');

function setShortBreakTimerLabel(){
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const ShortBreakDuration = config.timerSettings.shortBreakDuration;

            ShortBreakSlider.value = ShortBreakDuration;
            ShortBreakUpdateValueLabel();
            

        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}

function ShortBreakUpdateValueLabel() {
    const value = ShortBreakSlider.value;
    ShortBreakSliderValue.textContent = value + ":00";
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);

            // Update the config object
            config.timerSettings.shortBreakDuration = parseInt(value);

            fs.writeFile(configFilePath, JSON.stringify(config, null, 2), err => {
                if (err) {
                    console.error('Error writing config.json:', err);
                } else {
                    console.log('Config updated successfully.');
                }
            });
        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}


ShortBreakSlider.addEventListener('input', () => { 
    ShortBreakUpdateValueLabel();
});


const LongBreakSlider = document.getElementById('long-break-slider');
const LongBreakSliderValue = document.getElementById('LongBreakSliderValue');

function setLongBreakTimerLabel(){
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const LongBreakDuration = config.timerSettings.longBreakDuration;

            LongBreakSlider.value = LongBreakDuration;
            LongBreakUpdateValueLabel();
            

        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}

function LongBreakUpdateValueLabel() {
    const value = LongBreakSlider.value;
    LongBreakSliderValue.textContent = value + ":00";
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);

            // Update the config object
            config.timerSettings.longBreakDuration = parseInt(value);

            fs.writeFile(configFilePath, JSON.stringify(config, null, 2), err => {
                if (err) {
                    console.error('Error writing config.json:', err);
                } else {
                    console.log('Config updated successfully.');
                }
            });
        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}


LongBreakSlider.addEventListener('input', () => { 
    LongBreakUpdateValueLabel();
});

const RoundNumberSlider = document.getElementById('round-number-slider');
const RoundNumbeSliderValue = document.getElementById('RoundNumberSliderValue');

function setRoundNumberLabel(){
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);
            const RoundNumber = config.timerSettings.roundNumber;

            RoundNumberSlider.value = RoundNumber;
            RoundNumberUpdateValueLabel();
            

        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}

function RoundNumberUpdateValueLabel() {
    const value = RoundNumberSlider.value;
    RoundNumbeSliderValue.textContent = value
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading config.json:', err);
            return;
        }

        try {
            const config = JSON.parse(data);

            // Update the config object
            config.timerSettings.roundNumber = parseInt(value);

            fs.writeFile(configFilePath, JSON.stringify(config, null, 2), err => {
                if (err) {
                    console.error('Error writing config.json:', err);
                } else {
                    console.log('Config updated successfully.');
                }
            });
        } catch (error) {
            console.error('Error parsing config.json:', error);
        }
    });
}


RoundNumberSlider.addEventListener('input', () => { 
    RoundNumberUpdateValueLabel();
});