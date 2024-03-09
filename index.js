const path = require('path');
const { app, BrowserWindow, ipcMain, Tray, Menu} = require('electron');
const request = require('request');
const { constrainedMemory, config } = require('process');
const fs = require('fs');
let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: "PomoApp",
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        resizable: false,
        alwaysOnTop: true,
        maximizable: false,
        width: 736,
        height: 496,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: __dirname + './resources/purple_sky_icon.png',
        
    });

    mainWindow.loadFile(path.join(__dirname, "./page/index.html"));
}

let settingsWindow;

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
      title: "Settings",
      autoHideMenuBar: true,
      titleBarStyle: 'hidden',
      resizable: false,
      alwaysOnTop: true,
      maximizable: true,
      width: 300,
      height: 500,
      webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
      },
      icon: __dirname + './resources/purple_sky_icon.png',

      
      
  });

  settingsWindow.loadFile(path.join(__dirname, "./settingsWindow/index.html"));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
});
}


app.whenReady().then(() => {
    createMainWindow();
});

ipcMain.on("closeWindow", (event, data) => {
  const configPath = './config.json';
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const isMinimizetoTray = config.mainSettings.minimize_to_tray_on_close;

  if (isMinimizetoTray == "true"){
    return closeToTray();
  }
  else{
    mainWindow.close(); 
  }
});

ipcMain.on("minimiseWindow", (event, data) => {
  const configPath = './config.json';
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const isMinimizeTray = config.mainSettings.minimize_to_tray;
  if(isMinimizeTray == "true"){
    return minimiseToTray();
  }else{
    mainWindow.minimize(); 
  }
});

ipcMain.on("openSettings", (event, data) => {
  if(!settingsWindow){
    createSettingsWindow();
  }
  else if(settingsWindow){
    settingsWindow.close();
  }
});

ipcMain.on("closeSettings", (event, data) => {
  if(settingsWindow){
    settingsWindow.close();
  }
});

ipcMain.on("minimiseSettings", (event, data) => {
  if(settingsWindow){
    settingsWindow.minimize();
  }
});

ipcMain.on("spotifyEnabled", (event, data) => {
  const configPath = './config.json';
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    config.spotifyAuth.spotify_enabled = data;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

});

ipcMain.on("minimiseOnCloseEnabled", (event, data) => {
  const configPath = './config.json';
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    config.mainSettings.minimize_to_tray_on_close = data;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

});

ipcMain.on("minimizeEnabled", (event, data) => {
  console.log(data)
  const configPath = './config.json';
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    config.mainSettings.minimize_to_tray = data;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

});


let currentTimestamp = 0

function getCurrentTime(){
    currentTimestamp = Math.floor(Date.now() / 1000);
    const configPath = './config.json';
    const configfile = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    if(configfile.spotifyAuth.authCode == "" || !configfile.spotifyAuth.authCode) return;
    
  
      if(currentTimestamp > configfile.spotifyAuth.expiry_timestamp){
        refreshAccessToken()
        console.log("Refreshing Access_Token")
      }

    
}


const intervalId = setInterval(getCurrentTime, 1000);
const currentlyPlaying = setInterval(getCurrentlyPlaying, 2500);

ipcMain.on('authorize-spotify', (event, data) => {
  const scopes = [
      'user-read-currently-playing',
      'user-modify-playback-state',
      'app-remote-control',
  ];

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=732d056b612e4f82bef5425f2566736a&response_type=code&redirect_uri=${encodeURIComponent('https://spotifycallback.netlify.app')}&scope=${encodeURIComponent(scopes.join(' '))}`;

  const fspromises = require('fs').promises;
  const configPath = './config.json';
  
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  if(config.spotifyAuth.authCode != "") return;

  const authWindow = new BrowserWindow({ width: 800, height: 600 });
  authWindow.loadURL(spotifyAuthUrl);


  // initial auth code thingy
  const sendAuthCodeToServer = () => {

    const configPath = './config.json';
    const fs = require('fs');
    const request = require('request');
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
    const authorisationCode = config.spotifyAuth.authCode;
  
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const expirationTime = currentTimestamp + 3600;
  
    request.post(
      {
        url: "https://spotifycallback.netlify.app/.netlify/functions/api/auth",
        json: {
          code: authorisationCode,
        },
      },
      (error, response, body) => {
        if (!error) {
          console.log("Sending request with authCode:", authorisationCode);
          console.log("Response:", body);
  
          config.spotifyAuth.access_token = body.access_token;
          config.spotifyAuth.expiry_timestamp = expirationTime;
          config.spotifyAuth.refresh_token = body.refresh_token;
  

          fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  
          console.log("Access token is: ", body.access_token);
          console.log("Expiry is: ", body.expires_in);
          console.log("Refresh token is: ", body.refresh_token);
        } else {
          console.error("Error:", error);
        }
      },
    );
  };

  
  authWindow.webContents.on('will-redirect', async (event, newUrl) => {
      const { redirectURI } = JSON.parse(await fspromises.readFile(configPath)).spotifyAuth;
  
      if (newUrl.startsWith(redirectURI)) {
          const urlParts = newUrl.split('?');
          const queryString = urlParts[1];
          const params = new URLSearchParams(queryString);
  
          const code = params.get('code');
  
          // Read the config file again to get the latest data
          const config = JSON.parse(await fspromises.readFile(configPath));
          config.spotifyAuth.authCode = code;
  
          await fspromises.writeFile(configPath, JSON.stringify(config, null, 2));
  
          // Send the code to your Electron main process
          mainWindow.webContents.send('spotify-auth-code', code);
          console.log(code);
          sendAuthCodeToServer();
          // Close the authentication window
          authWindow.close();
      }
  });
  
  

  });





  function refreshAccessToken(){
    const configPath = './config.json';
    const fs = require('fs');
    const request = require('request');
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
    const refreshCode = config.spotifyAuth.refresh_token;
  
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const expirationTime = currentTimestamp + 3600;
  
    request.post(
      {
        url: "https://spotifycallback.netlify.app/.netlify/functions/api/refresh",
        json: {
          code: refreshCode,
        },
      },
      (error, response, body) => {
        if (!error) {
          console.log("Sending request with authCode:", refreshCode);
          console.log("Response:", body);

          if(body.error){
            const scopes = [
              'user-read-currently-playing',
              'user-modify-playback-state',
          ];
        
          const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=732d056b612e4f82bef5425f2566736a&response_type=code&redirect_uri=${encodeURIComponent('https://spotifycallback.netlify.app')}&scope=${encodeURIComponent(scopes.join(' '))}`;
        
          const fspromises = require('fs').promises;
          const configPath = './config.json';
          
          const fs = require('fs');
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        
        
          const authWindow = new BrowserWindow({ width: 800, height: 480 });
          authWindow.loadURL(spotifyAuthUrl);
        
        
          // initial auth code thingy
          const sendAuthCodeToServer = () => {
        
            const configPath = './config.json';
            const fs = require('fs');
            const request = require('request');
            
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          
            const authorisationCode = config.spotifyAuth.authCode;
          
            const currentTimestamp = Math.floor(Date.now() / 1000);
        
            const expirationTime = currentTimestamp + 3600;
          
            request.post(
              {
                url: "https://spotifycallback.netlify.app/.netlify/functions/api/auth",
                json: {
                  code: authorisationCode,
                },
              },
              (error, response, body) => {
                if (!error) {
                  console.log("Sending request with authCode:", authorisationCode);
                  console.log("Response:", body);
          
                  config.spotifyAuth.access_token = body.access_token;
                  config.spotifyAuth.expiry_timestamp = expirationTime;
                  config.spotifyAuth.refresh_token = body.refresh_token;
          
        
                  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
          
                  console.log("Access token is: ", body.access_token);
                  console.log("Expiry is: ", body.expires_in);
                  console.log("Refresh token is: ", body.refresh_token);
                } else {
                  console.error("Error:", error);
                }
              },
            );
          };
        
          
          authWindow.webContents.on('will-redirect', async (event, newUrl) => {
              const { redirectURI } = JSON.parse(await fspromises.readFile(configPath)).spotifyAuth;
          
              if (newUrl.startsWith(redirectURI)) {
                  const urlParts = newUrl.split('?');
                  const queryString = urlParts[1];
                  const params = new URLSearchParams(queryString);
          
                  const code = params.get('code');
          
                  // Read the config file again to get the latest data
                  const config = JSON.parse(await fspromises.readFile(configPath));
                  config.spotifyAuth.authCode = code;
          
                  await fspromises.writeFile(configPath, JSON.stringify(config, null, 2));
          
                  // Send the code to your Electron main process
                  mainWindow.webContents.send('spotify-auth-code', code);
                  console.log(code);
                  sendAuthCodeToServer();
                  // Close the authentication window
                  authWindow.close();
              }
          });
          }
  
          config.spotifyAuth.access_token = body.access_token;
          config.spotifyAuth.expiry_timestamp = expirationTime;
  

          fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  
          console.log("Access token is: ", body.access_token);
          console.log("Expiry is: ", body.expires_in);
        } else {
          console.error("Error:", error);
        }
      },
    );
  }

  function getCurrentlyPlaying(){
    const configPath = './config.json';
    const fs = require('fs');
    const request = require('request');
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
    const AccessToken = config.spotifyAuth.access_token;
  
    request.post(
      {
        url: "https://spotifycallback.netlify.app/.netlify/functions/api/get-currently-playing",
        json: {
          access_token: AccessToken,
        },
      },
      (error, response, body) => {
        if (!error) {
          if (config.spotifyAuth.last_song == body.song && config.spotifyAuth.last_album_cover_url == body.albumCoverUrl) return;

          console.log("Sending request with authCode:", AccessToken);
          console.log("Response:", body);
  
          config.spotifyAuth.last_song = body.song;
          config.spotifyAuth.last_album_cover_url = body.albumCoverUrl;
          config.spotifyAuth.last_artist = body.artist;


          fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  

        } else {
          console.error("Error:", error);
        }
      },
    );
  }

let tray = null;

function closeToTray(){
  mainWindow.hide()
  if (settingsWindow){
    settingsWindow.hide()
  }
  tray = new Tray( __dirname + './resources/purple_sky_icon.png');
 const contextMenu = Menu.buildFromTemplate([
        { label: "Quit", type: "normal", click: handleQuit },
    ]);
    tray.setToolTip("PomoApp");
    tray.setContextMenu(contextMenu);
    tray.addListener("click", () => {
      tray.destroy()
      restoreMainWindow();
    });
}

function minimiseToTray(){
  mainWindow.hide()
  tray = new Tray( __dirname + './resources/purple_sky_icon.png');
 const contextMenu = Menu.buildFromTemplate([
        { label: "Quit", type: "normal", click: handleQuit },
    ]);
    tray.setToolTip("PomoApp");
    tray.setContextMenu(contextMenu);
    tray.addListener("click", () => {
      tray.destroy()
      restoreMainWindow();
    });
}


function handleQuit(){
  app.quit();
}

function restoreMainWindow() {
  if (!mainWindow) {
      createMainWindow(); // If mainWindow doesn't exist, create it
  } else {
    if(settingsWindow){
      settingsWindow.show()
    }
      mainWindow.show(); // If mainWindow exists, simply show it
  }
}