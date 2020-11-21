const electron = require('electron') 
const remote = electron.remote; 
// Import the ipcRenderer Module from Electron  
const ipc = electron.ipcRenderer; 
  
var submit = document.getElementById('submit'); 

submit.addEventListener('click', function () { 
    ipc.send('get-QR');
    submit.disabled = true;
}); 