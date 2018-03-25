'use strict';

/*
    Pin Layout:
        Orange:     5v
        Brown:      Pin 8
        Red:        GND
*/

/*
--- Dependencies ---
*/
var johnnyFive = require('Johnny-Five');
var arduinoBoard = new johnnyFive.Board({ port: "COM4" });

var request = require("request");

var fs = require('fs');
// Read credentials file
var credentialsFileName = "credentials.json";
var readCredentialsFile = fs.readFileSync(credentialsFileName);
var credentials = JSON.parse(readCredentialsFile);

function loadCredentialsFile() {
    readCredentialsFile = fs.readFileSync(credentialsFileName);
    credentials = JSON.parse(readCredentialsFile);
}

// Read option file
var optionsFileName = "options.json";
var optionsFile = fs.readFileSync(optionsFileName);
var userOptions = JSON.parse(optionsFile);

function loadOptionsFile() {
    optionsFile = fs.readFileSync(optionsFileName);
    userOptions = JSON.parse(optionsFile);
}

/*
--- Hosting webpage code ---
Code below is used to host the Arduino Data Logger Webpage on http://localhost:8080

Mostly express and socket.io stuff
*/
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var path = require('path');

io.on('connection', (socket) => {
    // Initial connection with client 
    socket.emit('ready', userOptions);
    console.log('Connected to client');

    function alertOptionsSaved(isSaved) {
        /*
            Notify client if it had saved the options
        */
        socket.emit('options-saved', isSaved);
    }

    // TODO: Remove duplicate code
    function saveOptionsToFile() {
        fs.writeFile(optionsFileName, JSON.stringify(userOptions), 'utf8', (error) => {
            if (error) {
                alertOptionsSaved(false);
                return false;
            } 
            alertOptionsSaved(true);
            return true;
        });
    }

    function saveCredentialsToFile() {
        fs.writeFile(credentialsFileName, JSON.stringify(credentials), 'utf8', (error) => {
            if (error) {
                alertOptionsSaved(false);
                return false;
            }
            alertOptionsSaved(true);
            return true;
        });
    }

    socket.on('change-name', (data) => {
        userOptions.device_name = data.device_name;
        saveOptionsToFile();
        console.log("Device name changed");
    });

    socket.on('toggle-email-list', () => {
        socket.emit('update-email-list', {"email_destinations": credentials.email_destination});
    });

    socket.on('add-email-destination', (data) => {
        credentials.email_destination = data.email_destinations;
        saveCredentialsToFile();
        console.log("Email destination changed");
        socket.emit('update-email-list', {"email_destinations": credentials.email_destination});
    });

    socket.on('enable-email', (data) => {
        userOptions.enable_email = data.enable_email;
        saveOptionsToFile();
        console.log("Enable email option changed");
    });

    socket.on('change-duration', (data) => {
        userOptions.email_time = data.email_time;
        saveOptionsToFile();
        console.log("Time before email sent changed");
    });

    socket.on('update-time', (data) => {
        userOptions.email_disabled_times = data.email_disabled_times;
        saveOptionsToFile();
        console.log("Email disabled times changed");
    });

    socket.on('error', (error) => {  
        console.log("Error - " + error);
    });      
});

// html page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// CSS file
app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.css'));
});
// .js file
app.get('/index.js', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.js'));
});

server.listen(8080, () => {
    console.log('Arduino Data Logger web interface activated on port 8080');
});

/*
--- E-mail code ---
Code below allows the script to send an email to a list of email addresses that
you specify in credentials.json

Follow this to set up email address:
https://stackoverflow.com/questions/14654736/nodemailer-econnrefused
*/
var nodemailer = require('nodemailer');

// Options to send email via email server

var transporter = nodemailer.createTransport({
    host: "192.168.1.2",
    port: 25,
    secureConnection: false,
    tls: {
        rejectUnauthorized: false
    }
});


// Options to send email via gmail
/*
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: credentials.email_address,
        pass: credentials.email_password
    }
});
*/

function checkDay(dayString) {
    /* Converts day string to int */
    switch (dayString.toLowerCase())
    {
        case 'monday':
            return 1;
        case 'tuesday':
            return 2;
        case 'wednesday':
            return 3;
        case 'thursday':
            return 4;
        case 'friday':
            return 5;
        case 'saturday':
            return 6;
        case 'sunday':
            return 0;
    }
}

function checkIfValidTime()
{
    /* Check if email should be sent */
    var currentDate = new Date();
    var currentDay = currentDate.getDay(); 
    var disabledTimeArray = userOptions.email_disabled_times;
    for (var i = 0; i < disabledTimeArray.length; i++)
    {
        var timeEntry = disabledTimeArray[i];
        // Check if the current day
        if (checkDay(timeEntry.weekday) == currentDay)
        {
            // Check if email is within disabled time
            var currentTime = currentDate.getHours().toString() + currentDate.getMinutes().toString();
            if (parseInt(currentTime) > parseInt(timeEntry.start_time) && parseInt(currentTime) < parseInt(timeEntry.end_time))
            {
                return false;
            }
        }
    }
    return true;
}

function sendEmail()
{
    /*
    Send an email to a chosen email destination.
    */
    loadCredentialsFile();
    loadOptionsFile();
    
    if(!userOptions.enable_email)
    {
        return false;
    }

    if (!checkIfValidTime())
    {
        console.log('Email disabled');
        return false;
    }

    var mailOptions = {
        from: credentials.email_address,
        to: credentials.email_destination,
        subject: userOptions.device_name + ' has stopped punching',
        text: userOptions.device_name + ' has stopped punching'
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
    });
    console.log('Send email now');
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
        if (jsonTable.table.length == 0) {
            return;
        }

        for (var index = 0; index < jsonTable.table.length; index++) {
            var options = {
                url: credentials.server_url,
                method: "POST",
                form: jsonTable.table.shift()
            };

            request.post(options, function (error, response, body) {
                if (!error) {
                    console.log("Sent backup message!");
                } else {
                    console.log('Error: ' + error);
                    console.log("CANT'T SEND BACK");
                    console.log(options.form);
                    jsonTable.table.push(options.form);
                }
            });
        }
        var outputJSON = JSON.stringify(jsonTable);
        console.log(outputJSON);
        fs.writeFile("backup.json", outputJSON, "utf8", function (err) {
            if (err) throw err;
            console.log("Sent backup data!");
        });
    });
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

/*
--- Main Code ---
*/


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

    loadCredentialsFile();
    loadOptionsFile();

    var startData = {
        machine: userOptions.device_name,
        start_time: startTime[0] + " " + startTime[1],
        active: "true"
    };

    const options = {
        url: credentials.server_url,
        method: "POST",
        form: startData
    };

    request.post(options, function (error, response, body) {
        if (!error) {
            console.log("Sent starting message!");
        } else {
            console.log("CAN'T SEND");
        }
    });

    return startTime;
}

function vibrationStop(startTime)
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
    var startTimeUnix = startTime[2];
    var lengthTime = endTimeUnix - startTimeUnix;
    console.log("Length time: " + lengthTime);

    loadCredentialsFile();
    loadOptionsFile();

    var endData = {
        machine: userOptions.device_name,
        start_time: startTime[0] + " " + startTime[1],
        end_time: endTime[0] + " " + endTime[1],
        day_night: startTime[3],
        length_time: lengthTime,
        active: "false"
    };

    const options = {
        url: credentials.server_url,
        method: "POST",
        form: endData
    };

    request.post(options, function (error, response, body) {
        if (!error) {
            console.log("Sent end message!");
            sendBackupData();
        } else {
            console.log("CAN'T SEND");

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
    });

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
    var timeoutValue = 250;         // Change timeout value later on.
    tilt.on("data", function () {
        // Sensor just started turning on
        if (sensorFlag & !prevSensorFlag) {
            prevSensorFlag = true;
            startTime = vibrationStart();
            console.log("Vibration started.");
            clearTimeout(sendEmailTimeout); // Don't send email if switch activated before 5 minutes of inactivity
        }

        // Sensor just turned off
        if (!sensorFlag && prevSensorFlag) {
            prevSensorFlag = false;
            vibrationStop(startTime);
            console.log("Vibration stopped.");
            
            sendEmailTimeout = setTimeout(sendEmail, userOptions.email_time * 1000); // Send email after 5 minutes of inactivity
        }

        // Sensor reaches timeout value
        if (sensorCount == timeoutValue) {
            sensorCount = 0;
            sensorFlag = false;
        }
        sensorCount++;
    });
});
