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

function getTime()
{
    /*
        Should return a time string with the format of 'YYYY-MM-DD' and 'HH:MM:SS'
    */
    var date = new Date();
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hour = ('0' + date.getHours()).slice(-2);
    var minute = ('0' + date.getMinutes()).slice(-2);
    var second = ('0' + date.getSeconds()).slice(-2);
    
    return [year + '-' + month + '-' + day, hour + ':' + minute + ':' + second]
}

function vibrationStart()
{
    var startTime = getTime();
    console.log(startTime[0] + " " + startTime[1]);
}

function vibrationStop()
{
    var endTime = getTime();
    console.log(endTime[0] + " " + endTime[1]);
}

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
    
    var timeoutValue = 100;         // Change timeout value later on.
    tilt.on("data", function () {

        // Sensor just started turning on
        if (sensorFlag & !prevSensorFlag)
        {
            prevSensorFlag = true;
            vibrationStart();
            console.log("Vibration started.");
        }

        // Sensor just turned off
        if (!sensorFlag && prevSensorFlag)
        {
            prevSensorFlag = false;
            vibrationStop();
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
