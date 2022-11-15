const express = require('express')
const app = express()
const expressHost = 'localhost'
const expressPort = 3000
const path = require('path');


//Set up express & IO

const http = require('http').Server(app)

const io = require('socket.io')(http, {
  // Specifying CORS 
  cors: {
    origin: '*',
  }
})


app.use(express.urlencoded({ extended: true })) // Specifying to use urlencoded// Creating object of Socket
app.use(express.static('frontend/dist'))
const liveData = io.of('/liveData') // URL which will accept socket connection// Socket event

// Set up serial connection
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const port = new SerialPort({
  path: '/dev/tty.usbmodem1442201',
  baudRate: 115200,
  autoOpen: false,
})

let currentData;

port.open(function (err) {
  if (err) {
    return console.log('Error opening port: ', err.message)
  }
})

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }))
parser.on('data', (data) => {

  try {
    currentData = JSON.parse(data).data;
    liveData.emit('new-data', currentData) // Emitting event.
    console.log("Current temp: ", currentData.temp)

  }
  catch(err){
    console.warn("Something went wrong decoding the data...", err)
  }
})

liveData.on('user - connected', (username) => {
  console.log(`Receiver ${username} connected..`) // Logging when user is connected
});

// Get request on home page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/frontend/dist/index.html')));

// Post request on home page
app.post('/', (req, res) => {
  liveData.emit('new-data', currentData) // Emitting event.
})

// Listening on Host and Port
http.listen(expressPort, expressHost, () => console.log(`Listening on http://${express}:${expressPort}/`))


var opn = require('opn');

// opens the url in the default browser 
opn(`http://localhost:${expressPort}`);