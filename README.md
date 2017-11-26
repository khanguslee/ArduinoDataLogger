# Arduino Data Logger

This project allows an Arduino Uno with a SW-420 tilt sensor to send a POST packet to a server. The packet contains information about:

- Machine name
- Start time
- End time
- Length time
- Whether it is day or night
- If the machine is currently active

## Features
- Sends an HTTP request to a specified server
- Send an email to a specified email address after x amount of seconds the sensor has not been triggered
- Able to set day and times that the script sends you an email
- Set options on a webpage hosted by express on http://localhost:8080


### TODO:
- [ ] Create a separate .js file for different parts of the script
    - [ ] app.js file
    - [ ] utils.js file 
    - [ ] server.js file (socket.io and express stuff)
    - [ ] email.js (functions for email stuff)
- [ ] Invalid data should alert user on the form 
