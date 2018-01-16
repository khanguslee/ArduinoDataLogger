# Arduino Data Logger

This project allows an Arduino Uno with a SW-420 tilt sensor to send a POST packet to a server. The packet contains information about:

- Machine name
- Start time
- End time
- Length time
- Whether it is day or night
- If the machine is currently active

This project was created to log the uptime of a machine so that the customer was able to check how long their machine was in use everyday.

## Features
- Sends an HTTP POST request to a specified server
- Send an email to a specified email address after x amount of seconds the sensor has not been triggered
- Able to set day and times that the script sends you an email
- Set options on a webpage hosted by express on http://localhost:8080

## Getting Started
### Hardware Required
* Arduino
* SW-420 Tilt Sensor or similar

### Connecting the Tilt Sensor
Connect the Digital Out pin of the tilt sensor to Digital Pin 8 of the Arduino.

### Installing StandardFirmata Library
You will need an Arduino with the standard firmata library uploaded onto it. This library is already included with the Arduino IDE. 
```
File > Examples > Firmata > StandardFirmata
```
### Options Website
Options website can be accessed via http://localhost:8080

## HTTP Request POST Body
### Vibration Start

|   Parameter   |   Value               |   Description |
|   :---:       |   :---:               |   :---:         |
|   machine     |   Machine Name        |   Name of the machine/device  |
|   start_time  |   YYYY-DD-MM HH:MM:SS |   Start time of the vibration |
|   day_night   |   true/false          |   Whether the time qualifies as a day or night job |
|   active      |   true/false          |   If the machine is currently on  |

### Vibration End

|   Parameter   |   Value               |   Description |
|   :---:       |   :---:               |   :---:         |
|   machine     |   Machine Name        |   Name of the machine/device  |
|   end_time    |   YYYY-DD-MM HH:MM:SS |   End time of the vibration |
|   length_time |   Time in seconds     |   Length of time the machine was on for |
|   active      |   true/false          |   If the machine is currently on  |

## Test Server
For testing, I would recommend using https://requestb.in/ to act as the receiving server.

## Project History
This project was initially entirely ran on a single Arduino Mega. The Arduino Mega had multiple modules installed on it such as an Ethernet module, SD card shield, real-time clock and a tilt sensor. We removed all these modules as the power pack would cause the voltage regulator on the Arduino to overheat. 

Eventually, we moved to having a node.js application that can do the exact same thing whilst adding more functionality such as sending emails and hosting a website.
