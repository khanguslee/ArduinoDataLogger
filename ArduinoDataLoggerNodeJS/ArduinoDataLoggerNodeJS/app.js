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

// Initialise http-post
var http = require("http");
http.post = require("http-post");

var machineName = "TRUMPF 500";
function getTime()
{
    /*
        Should return a time string with the format of 'YYYY-MM-DD' and 'HH:MM:SS'.
        Unix time should also be returned
    */
    var date = new Date();
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hour = ('0' + date.getHours()).slice(-2);
    var minute = ('0' + date.getMinutes()).slice(-2);
    var second = ('0' + date.getSeconds()).slice(-2);

    // Unix Time
    var unixTime = Math.floor(date / 1000);

    // Check if it is day or night
    var isDay;
    if (date.getHours() >= 8 & date.getHours() < 16)
    {
        isDay = true;
    }
    else 
    {
        isDay = false;
    }

    return [year + '-' + month + '-' + day, hour + ':' + minute + ':' + second, unixTime, isDay];
}

function vibrationStart()
{
    var startTime = getTime();
    console.log(startTime[0] + " " + startTime[1]);

    var startData = {
        machine: machineName,
        start_time: startTime[0] + " " + startTime[1],
        day_night: startTime[3],
        active: "true"
    };

    return startTime[2];
}

function vibrationStop(startTimeUnix)
{
    var endTime = getTime();
    console.log(endTime[0] + " " + endTime[1]);
    var endTimeUnix = endTime[2];
    var lengthTime = endTimeUnix - startTimeUnix;
    console.log("Length time: " + lengthTime);

    var endDate = {
        machine: machineName,
        end_time: endTime[0] + " " + endTime[1],
        length_time: lengthTime,
        active: "false"
    };

}

arduinoBoard.on("ready", function () {
    console.log("Board ready!");
    var tilt = new johnnyFive.Sensor.Digital(8);
    var sensorCount = 0;
    var sensorFlag = false, prevSensorFlag = false;
    var startTime = 0;

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
            startTime = vibrationStart();
            console.log("Vibration started.");

        }

        // Sensor just turned off
        if (!sensorFlag && prevSensorFlag)
        {
            prevSensorFlag = false;
            vibrationStop(startTime);
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
