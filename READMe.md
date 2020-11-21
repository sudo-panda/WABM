# WABM

WABM is an acronym for WhatsApp Bulk Messenger

## What does it do?

Like the name suggests to can send messages to multiple people using your Whatsapp Web login and a CSV file

## How to use?

Follow these steps:

1) Open the app on your desktop and the Whatsapp App on your phone with the WhatsApp Web QR Code scanner ready. 
2) Click on Get QR Code and wait for the QR code to appear.
3) Once you scan the code it will automatically redirect you to the Options once it detects login.
4) Either upload a CSV or write a single message on the page. The number must have it's country code in it without any spaces or any symbols. THe format of the CSV is given below:

If you are converting from excel to CSV:

| Phone | Message |
|-------|---------|
|911234567890| Random Message1 |
|910123456789| Random Message2 |
|911234567891| Random Message3 |

If you are writing the CSV manually:

```CSV
Phone, Message
911234567890, Random Message1
910123456789, "Multi Line
Message"
911234567891, Random Message3
```

## Future Plans

Try to look for a way to send messages without using puppeteer. 