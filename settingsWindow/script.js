const {ipcRenderer} = require('electron');

function exit() {
    ipcRenderer.send("closeSettings","");
}

function minimise(){
    ipcRenderer.send("minimiseSettings","")
}

function spotifySync(){
    updateDynamicText();
    ipcRenderer.send("authorize-spotify","")
}

function checkIfFilled() {
    fetch('../config.json')
        .then(response => response.json())
        .then(config => {
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
                } else if(minimiseOnCloseEnabled === "false" && backgroundColor !== 'transparent'){
                    minimizeButton.classList.remove('clicked');
                }
            }

            if (minimizeTrayButton) {
                const computedStyle = getComputedStyle(minimizeTrayButton);
                const backgroundColor = computedStyle.backgroundColor;
                if (minimiseToTrayEnabled === "true" && backgroundColor !== 'rgb(255, 255, 255)') {
                    minimizeTrayButton.classList.add('clicked');
                } else if(minimiseToTrayEnabled === "false" && backgroundColor !== 'transparent'){
                    minimizeTrayButton.classList.remove('clicked');
                }
            }
        })
        .catch(error => {
            console.error('Error fetching config.json:', error);
        });
}

const intervalId = setInterval(checkIfFilled, 10);



function toggleFill(element) {

    fetch('../config.json')
    .then(response => response.json())
      .then(config => {
        const spotifyEnabled = config.spotifyAuth.spotify_enabled;
        if(spotifyEnabled == "true"){
            ipcRenderer.send("spotifyEnabled","false")
        }
        else{
            ipcRenderer.send("spotifyEnabled","true")
        }
      })
  }

const fs = require('fs').promises;

const updateDynamicText = async () => {
    try {
        const configPath = './config.json';
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        const dynamicTextElement = document.getElementById('Sync-Text');
        console.log('dynamicTextElement:', dynamicTextElement);

        if (config.spotifyAuth.authCode != "") {
            dynamicTextElement.textContent = 'Synced';
        } else {
            dynamicTextElement.textContent = 'Sync';
        }
    } catch (error) {
        console.error('Error reading or parsing the configuration file:', error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    updateDynamicText();

});

function minimiseonclose(){
    fetch('../config.json')
    .then(response => response.json())
      .then(config => {
        const minimiseOnCloseEnabled = config.mainSettings.minimize_to_tray_on_close;
        if(minimiseOnCloseEnabled == "true"){
            ipcRenderer.send("minimiseOnCloseEnabled","false")
        }
        else{
            ipcRenderer.send("minimiseOnCloseEnabled","true")
        }
      })
}

function minimizetotray(){
    fetch('../config.json')
    .then(response => response.json())
      .then(config => {
        const minimizeToTrayEnabled = config.mainSettings.minimize_to_tray;
        if(minimizeToTrayEnabled == "true"){
            ipcRenderer.send("minimizeEnabled","false")
        }
        else{
            ipcRenderer.send("minimizeEnabled","true")
        }
      })
}
