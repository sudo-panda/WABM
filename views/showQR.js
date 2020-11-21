const electron = require('electron') 
const ipc = electron.ipcRenderer;

var img = document.getElementById('qr'); 

ipc.on('updateQR', function(event, arg) { 
    console.log(arg);
    // Updating the value of the HTML Tag with the Data Received 
    // In Case the Data Received is not a Number and is  
    // some arbitary Value,display will show as NaN (Not a Number) 
    img.src = arg; 

    ipc.send('check-login');
}); 