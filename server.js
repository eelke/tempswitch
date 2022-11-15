// Express & Socket
const express = require('express')
const app = express()
const expressHost = 'localhost'
const expressPort = 3000
const path = require('path');
const http = require('http').Server(app)
const io = require('socket.io')(http, {
  // Specifying CORS 
  cors: {
    origin: '*',
  }
})
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('frontend/dist'));

let previousData = null;
const logAll = true; // Set to true if you want to log every message from the Arduino; false to only log the relay toggles
const fs = require('fs');
const logFile = `logs/${new Date().toISOString()}.csv`;
fs.writeFile(logFile, 'Time,Temp,Cooling\n', function (err) {
  if (err) throw err;
  console.log('File is created successfully.');
});

// Live data endpoint
const liveData = io.of('/liveData');

// Set up serial connection
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const port = new SerialPort({
  path: '/dev/tty.usbmodem1442201',
  baudRate: 115200,
  autoOpen: false,
})
port.open(function (err) {
  if (err) {
    return console.log('Error opening port: ', err.message)
  }
})


// Handle data coming from Arduino (in JSON format)
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }))
parser.on('data', (data) => {
  try {
    const currentData = JSON.parse(data).data;
    liveData.emit('new-data', currentData) // Emitting event.

    if (previousData){
      if (logAll || (previousData.state.cooling !== currentData.state.cooling)){
        const logLine = `${new Date().toISOString()},${currentData.temp},${currentData.state.cooling ? 'ON':'OFF'}\n`;
        fs.appendFile(logFile, logLine, function (err) {
          if (err) throw err;
        });
      } 
    }
    previousData = currentData;
    console.log("Current temp: ", currentData.temp)
  }
  catch(err){
    console.warn("Something went wrong decoding the data...", err)
  }
})

// Get request on home page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/frontend/dist/index.html')));

// Listening on Host and Port
http.listen(expressPort, expressHost, () => console.log(`Listening on http://${express}:${expressPort}/`))

// Open the url in the default browser 
var opn = require('opn');
opn(`http://localhost:${expressPort}`);