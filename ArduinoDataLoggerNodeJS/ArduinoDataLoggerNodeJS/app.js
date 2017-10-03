'use strict';

/*
    Pin Layout:
        Orange:     5v
        Brown:      Pin 8
        Red:        GND
*/

// Dependencies
var johnnyFive = require('Johnny-Five');
var arduinoBoard = new johnnyFive.Board();

var request = require("request");

var fs = require('fs');
var JSONfile = fs.readFileSync("credentials.json");
var JSONcontents = JSON.parse(JSONfile);
var serverURL = JSONcontents.serverUrl;     // Insert URL you wanna send POST packet to
var machineName = "TRUMPF 500";

// Follow this to set up email address:
// https://stackoverflow.com/questions/14654736/nodemailer-econnrefused
var nodemailer = require('nodemailer')
var transporter = nodemailer.createTransport({
    host: "192.168.1.2",
    port: 25,
    secureConnection: false,
    tls: {
        rejectUnauthorized: false
    }
});

function sendEmail()
{
    /*
    Send an email to a chosen email destination.
    */
    var mailOptions = {
        from: JSONcontents.emailAddress,
        to: JSONcontents.emailDestination,
        subject: '5000 has stopped punching',
        text: '5000 has stopped punching'
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error)
        {
            console.log('Error: ' + error);
        }
        else
        {
            console.log('Email sent: ' + info.response);
        }
    })
    console.log('Send email now')
}

function sendBackupData()
{
    /*
    Read from a backup JSON file and send the messages when reconnected to the network. 
    */
    var jsonTable = { "table": [] };
    fs.readFile("backup.json", "utf8", function (err, data) {
        if (err) throw err;
        jsonTable = JSON.parse(data);
        if (jsonTable.table.length == 0)
        {
            return;
        }

        for (var index = 0; index < jsonTable.table.length; index++) {
            var options = {
                url: serverURL,
                method: "POST",
                form: jsonTable.table.shift()
            };

            request.post(options, function (error, response, body) {
                if (!error) {
                    console.log("Sent backup message!");
                } else {
                    console.log('Error: ' + error);
                    console.log("CANT'T SEND BACK");
                    console.log(options.form)
                    jsonTable.table.push(options.form)
                }
            });
        }
        console.log(jsonTable);
        var outputJSON = JSON.stringify(jsonTable);
        console.log(outputJSON);
        fs.writeFile("backup.json", outputJSON, "utf8", function (err) {
            if (err) throw err;
            console.log("Sent backup data!")
        });
    })
}

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
    /*
    Should get:
    - Start time and date the vibration started
    - Whether it was day or night
    Will send the message, if there is network connection, once complete.
    Will store message into a JSON file if there is no network connection.
    */
    var jsonTable = { "table": [] };
    var startTime = getTime();
    console.log(startTime[0] + " " + startTime[1]);

    var startData = {
        machine: machineName,
        start_time: startTime[0] + " " + startTime[1],
        day_night: startTime[3],
        active: "true"
    };

    const options = {
        url: serverURL,
        method: "POST",
        form: startData
    };

    request.post(options, function (error, response, body) {
        if (!error)
        {
            console.log("Sent starting message!");
            sendBackupData();
        } else {
            console.log("CANT'T SEND");
            // Write to JSON file for backup if can't send to server
            fs.readFile("backup.json", "utf8", function readFileCallback(err, data) {
                if (err) throw err;
                jsonTable = JSON.parse(data);
                jsonTable.table.push(startData);
                var outputJSON = JSON.stringify(jsonTable);
                fs.writeFile("backup.json", outputJSON, "utf8", function (err) {
                    if (err) throw err;
                });
            });
        }
    })

    return startTime[2];
}

function vibrationStop(startTimeUnix)
{
    /*
    Should get:
    - End time and date the vibration ended
    - Total length of time
    Will send the message, if there is network connection, once complete.
    Will store message into a JSON file if there is no network connection.
    */
    var jsonTable = { "table": [] };
    var endTime = getTime();
    console.log(endTime[0] + " " + endTime[1]);
    var endTimeUnix = endTime[2];
    var lengthTime = endTimeUnix - startTimeUnix;
    console.log("Length time: " + lengthTime);

    var endData = {
        machine: machineName,
        end_time: endTime[0] + " " + endTime[1],
        length_time: lengthTime,
        active: "false"
    };

    const options = {
        url: serverURL,
        method: "POST",
        form: endData
    };

    request.post(options, function (error, response, body) {
        if (!error) {
            console.log("Sent end message!");
            sendBackupData();
        } else {
            console.log("CANT'T SEND");

            // Write to JSON file for backup if can't send to server
            fs.readFile("backup.json", "utf8", function readFileCallback(err, data) {
                if (err) throw err;
                jsonTable = JSON.parse(data);
                jsonTable.table.push(endData);
                var outputJSON = JSON.stringify(jsonTable);
                fs.writeFile("backup.json", outputJSON, "utf8", function (err) {
                    if (err) throw err;
                });
            });
        }
    })

}

arduinoBoard.on("ready", function () {
    /*
    Main function that runs when Arduino is 'ready'
    */
    console.log("Board ready!");
    var tilt = new johnnyFive.Sensor.Digital(8);
    var sensorCount = 0;
    var sensorFlag = false, prevSensorFlag = false;
    var startTime = 0;
    var sendEmailTimeout;

    // When sensor changes value
    tilt.on("change", function () {
        sensorCount = 0;
        sensorFlag = true;
        console.log("TILTING!");
    });

    // Continuously loops
    var timeoutValue = 500;         // Change timeout value later on.
    tilt.on("data", function () {
        // Sensor just started turning on
        if (sensorFlag & !prevSensorFlag)
        {
            prevSensorFlag = true;
            startTime = vibrationStart();
            console.log("Vibration started.");
            clearTimeout(sendEmailTimeout); // Don't send email if switch activated before 5 minutes of inactivity
        }

        // Sensor just turned off
        if (!sensorFlag && prevSensorFlag)
        {
            prevSensorFlag = false;
            vibrationStop(startTime);
            console.log("Vibration stopped.");
            sendEmailTimeout = setTimeout(sendEmail, 5 * 60 * 1000); // Send email after 5 minutes of inactivity
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
