const { autoUpdater } = require("electron-updater");
const electron = require('electron');
const { ipcMain, dialog, app, BrowserWindow } = require('electron')
const puppeteer = require('puppeteer');
var fs = require('fs');
const csv = require('csv-parser');


app.on("ready", () => {
    autoUpdater.checkForUpdatesAndNotify();
});


var browser;
var page;
var win;

let launchOptions = {
    headless: false,
    args: ['--start-maximized']
};


function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadFile('views/landing.html');
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (browser) {
        browser.close();
    }
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

ipcMain.on('get-QR', async function (event) {
    browser = await puppeteer.launch(launchOptions);
    page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    await page.setViewport({ width: 640, height: 768 });
    await page.goto('https://web.whatsapp.com');

    page.on('dialog', async dialog => { await dialog.accept(); });

    try {
        await page.waitForSelector('canvas', { timeout: 30000 });
        try {
            const dataUrl = await page.evaluate(() => {
                const canvas = document.querySelector("canvas");
                return canvas.toDataURL();
            });

            win.loadFile("views/showQR.html");
            win.webContents.once('did-navigate', () => {
                win.webContents.once('dom-ready', () => {
                    win.webContents.send('updateQR', dataUrl);
                })
            });

        } catch (e) {
            console.log(e);
            res.redirect('/');
        }
    } catch (e) {
        console.log(e);
        return;
    }
});

ipcMain.on('check-login', async function (event) {
    try {
        await page.waitForSelector('span[data-testid="default-user"]', { timeout: 30000 });
        console.log("Logged In");
        win.loadFile("views/options.html");
    } catch (e) {
        console.log(e);
        console.log(e);
        const options = {
            type: 'info',
            buttons: ['Ok'],
            defaultId: 2,
            message: 'Timed Out',
            detail: 'Please retry',
        };
        dialog.showMessageBox(null, options);
        if (browser) {
            browser.close();
        }
        win.loadFile("views/landing.html");
        return;
    }
});

ipcMain.on('send-msg', async function (event, phone, msg) {
    var pattern = /^[0-9]{12}$/;
    if (msg.trim() === "" || !(pattern.test(phone.trim()))) {
        event.sender.send('status', false);
    }
    try {
        await page.goto('https://web.whatsapp.com/send?phone=' + phone + '&text&app_absent=0');

        await page.waitForSelector('footer');
        await page.type('footer>div.copyable-area>div[tabindex="-1"]>div>div.copyable-text', msg);
        await page.click('footer>div.copyable-area>div:last-child>button');

        console.log("Sent!");
        const options = {
            type: 'info',
            buttons: ['Ok'],
            defaultId: 2,
            message: 'Success',
            detail: 'Sent successfully!',
        };
        dialog.showMessageBox(null, options);
        event.sender.send('status', true);
    } catch (e) {
        console.log(e);
        const options = {
            type: 'info',
            buttons: ['Ok'],
            defaultId: 2,
            message: 'Failed',
            detail: 'Could not send message.',
        };
        dialog.showMessageBox(null, options);
        event.sender.send('status', false);
    }
})

ipcMain.on('get-csv', async function (event) {
    var res = await dialog.showOpenDialog({
        filters: [
            { name: 'CSV', extensions: ['csv'] },
        ]
    });
    if (res.canceled) {
        console.log("hi");
        event.sender.send('status', false);
    } else {
        var arr = [];
        fs.createReadStream(res.filePaths[0])
            .pipe(csv())
            .on('data', async (row) => {
                arr.push(row);
            })
            .on('end', async () => {
                console.log("CSV Parsed\n");
                try {
                    var pattern = /^[0-9]{12}$/;
                    var no_error = true;
                    for (row in arr) {
                        if (!(pattern.test(arr[row]['Phone'].trim()))) {
                            const options = {
                                type: 'info',
                                buttons: ['Ok'],
                                defaultId: 2,
                                message: 'Failed on row: ' + (Number(row) + 2),
                                detail: arr[row]['Phone'] + ' is not a valid number',
                            };
                            dialog.showMessageBox(null, options);
                            no_error = false;
                            break;
                        } else if (arr[row]['Message'].trim() === "") {
                            const options = {
                                type: 'info',
                                buttons: ['Ok'],
                                defaultId: 2,
                                message: 'Failed on row: ' + (Number(row) + 2),
                                detail: 'Message cannot be empty',
                            };
                            dialog.showMessageBox(null, options);
                            no_error = false;
                            break;
                        }

                        console.log(arr[row]['Phone']);
                        await page.goto('https://web.whatsapp.com/send?phone=' + arr[row]['Phone'].trim() + '&text&app_absent=0');
                        console.log(" " + arr[row]['Message']);

                        await page.waitForSelector('footer');

                        var msgArr = arr[row]['Message'].trim().split("\n");
                        for (var i = 0; i < msgArr.length; i++) {
                            if (i != 0) {
                                await page.keyboard.down('Control');
                                await page.keyboard.press('Enter');
                                await page.keyboard.up('Control');
                            }
                            await page.type('footer>div.copyable-area>div[tabindex="-1"]>div>div.copyable-text', msgArr[i]);
                        }
                        await page.click('footer>div.copyable-area>div:last-child>button');
                        console.log("Sent!\n");
                        event.sender.send('sent', Number(row) + 2);
                    }
                    if (no_error) {
                        const options = {
                            type: 'info',
                            buttons: ['Ok'],
                            defaultId: 2,
                            message: 'Success',
                            detail: 'All messages sent successfully!',
                        };
                        dialog.showMessageBox(null, options);
                    }
                    event.sender.send('status', true);
                } catch (e) {
                    console.log(e);
                    const options = {
                        type: 'info',
                        buttons: ['Ok'],
                        defaultId: 2,
                        message: 'Failed',
                        detail: 'Could not send some/all messages. Please make sure the header of the CSV is "Phone" and "Message"',
                    };
                    dialog.showMessageBox(null, options);
                    event.sender.send('status', false);
                }
            });
    }
})