#include <Adafruit_MAX31865.h>
#define ARDUINOJSON_USE_LONG_LONG 1
#include <ArduinoJson.h>

// These are the temperature edges used. Comment these lines out to have the program run in demo mode.
// In demo mode the app picks edges around the current environment temperature instead.
//#define LOWER_EDGE_CELCIUS -3.5f;
//#define UPPER_EDGE_CELCIUS -2.0f;

// Run logic & log ever N ms
#define LOOP_INTERVAL 2000

// Use software SPI: CS, DI, DO, CLK
Adafruit_MAX31865 thermo = Adafruit_MAX31865(10, 11, 12, 13);

// The value of the Rref resistor. Use 430.0 for PT100 and 4300.0 for PT1000
#define RREF 430.0

// The 'nominal' 0-degrees-C resistance of the sensor
// 100.0 for PT100, 1000.0 for PT1000
#define RNOMINAL 100.0

// Pin the relays connects to
const int relayPin = 2;

// Variables
#ifdef LOWER_EDGE_CELCIUS &&UPPER_EDGE_CELCIUS
float rangeLowerEdge = LOWER_EDGE_CELCIUS; // in ºC
float rangeUpperEdge = UPPER_EDGE_CELCIUS; // in ºC
bool rangeHasBeenSet = true;
#else
float rangeLowerEdge = 0.0f; // in ºC
float rangeUpperEdge = 0.0f; // in ºC
bool rangeHasBeenSet = false;
#endif

bool cooling = false;

void setup()
{
  Serial.begin(115200);
  while (!Serial)
    continue;

  thermo.begin(MAX31865_3WIRE);

  pinMode(relayPin, OUTPUT);
}

void loop()
{

  uint16_t rtd = thermo.readRTD();
  float ratio = rtd;
  ratio /= 32768;

  handleTemperature(thermo.temperature(RNOMINAL, RREF));
  report(ratio);

  delay(LOOP_INTERVAL);
}

void report(float ratio)
{

  StaticJsonDocument<400> doc;

  doc["sensor"] = "temp";
  doc["time"] = millis();

  JsonObject data = doc.createNestedObject("data");
  data["rtd"] = 8250;
  data["rat"] = ratio;
  data["res"] = RREF * ratio;
  data["temp"] = thermo.temperature(RNOMINAL, RREF);

  // Check and print any faults
  uint8_t fault = thermo.readFault();
  if (fault)
  {
    JsonObject fault = doc.createNestedObject("fault");
    fault["0x"] = fault;
    JsonArray fault_msgs = fault.createNestedArray("msgs");
    if (fault & MAX31865_FAULT_HIGHTHRESH)
    {
      fault_msgs.add("RTD High Threshold");
    }
    if (fault & MAX31865_FAULT_LOWTHRESH)
    {
      fault_msgs.add("RTD Low Threshold");
    }
    if (fault & MAX31865_FAULT_REFINLOW)
    {
      fault_msgs.add("REFIN- > 0.85 x Bias");
    }
    if (fault & MAX31865_FAULT_REFINHIGH)
    {
      fault_msgs.add("REFIN- < 0.85 x Bias - FORCE- open");
    }
    if (fault & MAX31865_FAULT_RTDINLOW)
    {
      fault_msgs.add("RTDIN- < 0.85 x Bias - FORCE- open");
    }
    if (fault & MAX31865_FAULT_OVUV)
    {
      fault_msgs.add("Under/Over voltage");
    }
    thermo.clearFault();
  }

  JsonObject state = data.createNestedObject("state");
  state["cooling"] = cooling;
  state["ledge"] = rangeLowerEdge;
  state["uedge"] = rangeUpperEdge;

  serializeJson(doc, Serial);
  Serial.println();
}

void handleTemperature(float temp)
{

  //  During development, set edges around current environment temperature
  if (!rangeHasBeenSet)
  {
    rangeUpperEdge = temp + 2.0f;
    rangeLowerEdge = temp + 1.0f;
    rangeHasBeenSet = true;
    cooling = false;
  }

  // Upper and lower edges should not be the same
  if (rangeUpperEdge <= rangeLowerEdge)
  {
    rangeUpperEdge = rangeLowerEdge + 1;
  }

  //  Scenarios
  //  Assumption: temperature will always want to rise.

  // 1. cooling == false && temp > rangeUpperEdge: cooling = true
  if (temp >= rangeUpperEdge)
  {
    cooling = true;
  }

  // 2. temp <= rangeLowerEdge: cooling = false
  else if (cooling && temp <= rangeLowerEdge)
  {
    cooling = false;
  }

  // We use NC (Normally Closed) output of the relay
  // The compressor is disabled when we set the pin to LOW
  // And enabled when set to HIGH
  digitalWrite(relayPin, cooling);
}
