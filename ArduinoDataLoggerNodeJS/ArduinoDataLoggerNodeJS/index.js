// Connect to server hosting socket.io
var socket = io();

// Default options
var email_disabled_times = [];
var email_time = 0;
var enable_email = false;

function displayEmailOption() {
    /*
        Shows/Hides the emailOptions div
    */
    if (document.getElementById("selectEmailActivation").value == 'Off') {
        enable_email = false;
        document.getElementById("emailOptions").style.display = "none";
    } else {
        enable_email = true;
        document.getElementById("emailOptions").style.display = "block";
    }
}

// Get already set options and display them
socket.on('ready', (data) => {
    enableEmail = data.enable_email;    
    emailDisabledTimes = data.email_disabled_times;
    emailTime = data.email_time;

    // Display the correct select option
    document.getElementById("selectEmailActivation").value = enableEmail ? 'On' : 'Off';
    displayEmailOption();

    // Display the time before an email gets sent
    document.getElementById("currentTime").textContent = emailTime;

    // Fill up the table
    for (var i = 0; i < emailDisabledTimes.length; i++) {
        var disabledEntry = emailDisabledTimes[i];
        var tableHTML = document.getElementById("tableOfDatesAndTimes");
        var row = tableHTML.insertRow(1);

        var cellDay = row.insertCell(0);
        cellDay.innerHTML = disabledEntry.weekday;

        var cellStartTime = row.insertCell(1);
        cellStartTime.innerHTML = disabledEntry.start_time;

        var cellEndTime = row.insertCell(2);
        cellEndTime.innerHTML = disabledEntry.end_time;
    }
});

function enableEmailOption() {
    displayEmailOption();
    socket.emit('enable-email', {"enable_email": enable_email});
}


// Otherwise show the email options

// Time before email text box should send to app.js the number of seconds

// Email disabled times should show a list of the day and starting/ending times of the email option

// Adding a new date/time should send to app.js a JSON blob of everything
