'use strict';

/*
    Pin Layout:
        Orange:     5v
        Brown:      Pin 8
        Red:        GND
*/

var johnnyFive = require("Johnny-Five");
var arduinoBoard = new johnnyFive.Board();

arduinoBoard.on("ready", function() {
    var tilt = new johnnyFive.Sensor.Digital(8);

    tilt.on("change", function () {
        if (this.value) {
            console.log("TILT");
        }
    });
});
