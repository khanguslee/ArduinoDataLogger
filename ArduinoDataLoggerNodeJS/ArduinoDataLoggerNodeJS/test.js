/*
    Dependencies
*/
var request = require('request');

var fs = require('fs');
// Read credentials file
var credentialsFileName = "credentials.json";
var readCredentialsFile = fs.readFileSync(credentialsFileName);
var credentials = JSON.parse(readCredentialsFile);
// Read option file
var optionsFileName = "options.json";
var optionsFile = fs.readFileSync(optionsFileName);
var userOptions = JSON.parse(optionsFile);

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

function sendStartRequest() {
    var startTime = getTime();

    var startData = {
        machine: userOptions.device_name,
        start_time: startTime[0] + " " + startTime[1],
        end_time: '',
        day_night: startTime[3],
        active: "true"
    };
    console.log(startData);
    const options = {
        url: credentials.server_url,
        method: "POST",
        form: startData
    };

    request.post(options, function(error, response, body) {
        if (!error) {
            console.log("Sent starting message!");
            console.log(response);
            console.log(body);
        } else {
            console.log("Can't send!");
            console.log(error);
        }
    });
    return startTime;
}

function sendEndRequest(startTime) {
    var endTime = getTime();
    console.log(endTime[0] + " " + endTime[1]);
    var endTimeUnix = endTime[2];
    var lengthTime = endTimeUnix - startTime[2];
    console.log("Length time: " + lengthTime);

    var endData = {
        machine: userOptions.device_name,
        start_time: startTime[0] + " " + startTime[1],
        end_time: endTime[0] + " " + endTime[1],
        day_night: startTime[3],
        length_time: lengthTime,
        active: "false"
    };
    console.log(endData);

    const options = {
        url: credentials.server_url,
        method: "POST",
        form: endData
    };

    request.post(options, function(error, response, body) {
        if (!error) {
            console.log("Sent end message!");
            console.log(response);
            console.log(body);
        } else {
            console.log("Can't send!");
            console.log(error);
        }
    });
}

function sendTestRequest() {
    console.log("Testing with " + credentials.server_url);

    var startTime = sendStartRequest();

    var timeDelay = 1000;
    setTimeout(() => {
        sendEndRequest(startTime);
    }, timeDelay);
}

/* Test Email */
function testCorrectEmailRecipients()
{
    /*
    Send an email to a chosen email destination.
    */

    var mailOptions = {
        from: credentials.email_address,
        to: credentials.email_destination,
        subject: userOptions.device_name + ' has stopped punching',
        text: userOptions.device_name + ' has stopped punching'
    };

    console.log(mailOptions);
}

/* Test email time is correct */
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
    console.log(disabledTimeArray);
    for (var i = 0; i < disabledTimeArray.length; i++)
    {
        var timeEntry = disabledTimeArray[i];
        // Check if the current day
        if (checkDay(timeEntry.weekday) == currentDay)
        {
            // Check if email is within disabled time
            var currentTime = currentDate.getHours().toString() + currentDate.getMinutes().toString();
            console.log(currentTime);
            if (parseInt(currentTime) > parseInt(timeEntry.start_time) && parseInt(currentTime) < parseInt(timeEntry.end_time))
            {
                return false;
            }
        }
    }
    return true;
}

function testEmailValidTime() {
    console.log(checkIfValidTime());
}


//sendTestRequest();
//testCorrectEmailRecipients();
testEmailValidTime();