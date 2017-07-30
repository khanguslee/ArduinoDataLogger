'use strict';

/*
    Pin Layout:
        Orange:     5v
        Brown:      Pin 8
        Red:        GND
*/

// Initialise Johnny-Five
var johnnyFive = require("Johnny-Five");
var arduinoBoard = new johnnyFive.Board();

arduinoBoard.on("ready", function () {
    console.log("Board ready!");
    var tilt = new johnnyFive.Sensor.Digital(8);
    var sensorCount = 0;
    var sensorFlag = false, prevSensorFlag = false;

    // When sensor changes value
    tilt.on("change", function () {
        sensorCount = 0;
        sensorFlag = true;
        console.log("TILTING!");
    });

    // Continuously loops
    
    var timeoutValue = 100;
    tilt.on("data", function () {
        console.log(sensorCount);

        // Sensor just started turning on
        if (sensorFlag & !prevSensorFlag)
        {
            prevSensorFlag = true;
            console.log("Vibration started.");
        }

        // Sensor just turned off
        if (!sensorFlag && prevSensorFlag)
        {
            prevSensorFlag = false;
            console.log("Vibration stopped.");
        }

        // Sensor reaches timeout value
        if (sensorCount == timeoutValue)
        {
            sensorCount = 0;
            sensorFlag = false;
        }
        sensorCount++;
    })
});
