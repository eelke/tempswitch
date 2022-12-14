# TempSwitch for Climate Cleanup

A temperature-based physical relay (electrical switch) application, based on PT100, Arduino, Node.js & svelte.js



## Set up the Arduino

Make sure you install the required libraries:
- Adafruit_MAX31865
- ArduinoJson

These are the temperature edges used. Comment these lines out to have the program run in demo mode.
In demo mode the app picks edges around the current environment temperature instead.

```
//#define LOWER_EDGE_CELCIUS -3.5f;
//#define UPPER_EDGE_CELCIUS -2.0f;
```

The relay will turn ON whenever the temperature has reached the UPPER edge (or above)
And it will turn OFF whenever the temparature has reached the BOTTOM edge (or below)


## Set up the server (node app)

1. Run `$ npm install` to install all dependencies

2. Run `$ node server.js`, this will start the server and load a browser window

3. Use PM2 to keep the Node.js process running..
https://www.digitalocean.com/community/tutorials/nodejs-pm2

---

## Note 

The Arduino code will run regardless of a serial connection.
The Node app is just to monitor & log its behaviour
You can safely close browser the window, and the server will keep on logging.  

By eelke.net, for ClimateCleanup.org


