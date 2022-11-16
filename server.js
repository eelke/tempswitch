/** Settings */
const expressHost = 'localhost';
const expressPort = 3000;
const serialDeviceSearch = '/dev/tty.usbmodem';
let serialDevice;

// Set to true if you want to log every message from the Arduino; false to only log the relay toggles
const logAll = true; 

// Express & Socket
const express = require('express')
const app = express()
const path = require('path');
const http = require('http').Server(app)
const cors = require('cors')
const io = require('socket.io')(http, {
  // Specifying CORS 
  cors: {
    origin: '*',
  }
})
app.use(express.urlencoded({ extended: true })); 
app.use(cors({
  origin: '*'
}));
app.use(express.static(__dirname + '/frontend/dist'));
app.use(express.static(__dirname + '/logs'));

// Logging
let previousData = null;
const fs = require('fs');
const d = new Date();
const logFile = `${__dirname}/logs/${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}.csv`;
if (!fs.existsSync(logFile)) {
  fs.writeFile(logFile, 'Time,Temp,Cooling\n', function (err) {
    if (err) throw err;
    console.log('File is created successfully.');
  });
} else {
  console.log("Log file already exists, appending data..");
}

// Live data endpoint
const liveData = io.of('/liveData');

// Set up serial connection
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
// list serial ports:
SerialPort.list().then(
  (ports) => {
    ports.forEach((port) => {
      if (port.path.search(serialDeviceSearch) > -1) {
        serialDevice = port.path;
        openSerial();
      }
    })
  },
  err => console.log(err)
);

const openSerial = () => {

  const port = new SerialPort({
    path: serialDevice,
    baudRate: 115200,
    autoOpen: false,
  });
  
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
      const logLine = `${new Date().toISOString()},,\n`;
      fs.appendFile(logFile, logLine, function (err) {
        if (err) throw err;
      });
    }
  })
}

// Get request on home page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/frontend/dist/index.html')));
app.get('/log', (req, res) => res.sendFile(logFile));

// Listening on Host and Port
http.listen(expressPort, expressHost, () => console.log(`Listening on http://${express}:${expressPort}/`))

// Open the url in the default browser 
var opn = require('opn');
const { Z_FIXED } = require('zlib');
const e = require('express');
opn(`http://localhost:${expressPort}`);