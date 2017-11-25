// Connect to server hosting socket.io
var socket = io();

// Default options
var emailDisabledTimes = [];
var emailTime = 0;
var enableEmail = false;

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

function showTable() {
    // Delete existing table
    var table = document.getElementById("tableOfDatesAndTimes");
    for (let i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    }

    // Populate table with times
    var tableHTML = document.getElementById("tableOfDatesAndTimes").getElementsByTagName('tbody')[0];    
    for (var i = 0; i < emailDisabledTimes.length; i++) {
        var disabledEntry = emailDisabledTimes[i];
        var row = tableHTML.insertRow(tableHTML.rows.length);

        var cellDay = row.insertCell(0);
        cellDay.innerHTML = disabledEntry.weekday;

        var cellStartTime = row.insertCell(1);
        cellStartTime.innerHTML = disabledEntry.start_time;

        var cellEndTime = row.insertCell(2);
        cellEndTime.innerHTML = disabledEntry.end_time;

        var cellDelete = row.insertCell(3);
        cellDelete.innerHTML = '<button id="btnDelete-' + i + '" type="button" class="btn btn-danger btn-sm" onclick="deleteRow(this)">' +
                                    'Delete' + 
                                '</button>';
        
    }
}

function deleteRow(inputRow) {
    let elementID = parseInt(inputRow.id.substring(10, inputRow.id.length));
    // Remove time entry in array
    emailDisabledTimes.splice(elementID, 1);
    // Update stored disabled times
    socket.emit('delete-time', {"email_disabled_times": emailDisabledTimes});
    // Re-render table
    showTable();
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
    showTable();
});

socket.on('options-saved', (isSaved) => {
    if(isSaved) {
        document.getElementById("success-alert").style.display = "block";
        setTimeout(function() {
            document.getElementById("success-alert").style.display = "none";            
         }, 3000);
    } else {

    }
});

function enableEmailOption() {
    displayEmailOption();
    socket.emit('enable-email', {"enable_email": enable_email});
}

function changeDuration() {
    email_time = document.getElementById("durationBeforeEmail").value
    document.getElementById("durationBeforeEmail").value = '';
    document.getElementById("currentTime").innerHTML = email_time;
    socket.emit('change-duration', {"email_time": email_time});
}

// Email disabled times should show a list of the day and starting/ending times of the email option

// Adding a new date/time should send to app.js a JSON blob of everything
