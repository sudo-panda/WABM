const electron = require('electron');
const ipc = electron.ipcRenderer;

var single_msg_btn = document.getElementById('singleMsg');
var phone = document.getElementById('phone');
var message = document.getElementById('msg');
var sent = document.getElementById('sent');

var upload_csv_btn = document.getElementById('bulkMsg');

single_msg_btn.addEventListener('click', function () {
    ipc.send('send-msg', phone.value, message.value);
    single_msg_btn.disabled = true;
    upload_csv_btn.disabled = true;
});

upload_csv_btn.addEventListener('click', function () {
    ipc.send('get-csv');
    single_msg_btn.disabled = true;
    upload_csv_btn.disabled = true;
    sent.innerHTML = "";
});

ipc.on('status', function (event, arg) {
    single_msg_btn.disabled = false;
    upload_csv_btn.disabled = false;
    phone.value = "";
    message.value = "";
});

ipc.on('sent', function (event, row) {
    sent.innerHTML = "Sent row " + row ;
});
