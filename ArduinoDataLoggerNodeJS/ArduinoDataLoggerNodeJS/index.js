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
    /*
        Will display the table of disabled times
    */
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
        cellDelete.innerHTML = '<button id="btnDelete-' + i + '" type="button" class="btn btn-danger btn-sm" onclick="deleteTimeEntry(this)">' +
                                    'Delete' + 
                                '</button>';
        
    }
}

function deleteTimeEntry(inputRow) {
    /*
        Deletes a specific time entry
    */
    let elementID = parseInt(inputRow.id.substring(10, inputRow.id.length));
    // Remove time entry in array
    emailDisabledTimes.splice(elementID, 1);
    // Update stored disabled times
    socket.emit('update-time', {"email_disabled_times": emailDisabledTimes});
    // Re-render table
    showTable();
}

function padZeros(number, length) {
    /*
        Function to pad zeros to a given string
    */
    var str = '' + number;
    while(str.length < length) {
        str = '0' + str;
    }
    return str;
}

function addTimeEntry() {
    /*
        Adds a time entry
    */
    let inputDay = document.getElementById("inputDay").value;
    let inputStartTime = padZeros(document.getElementById("inputStartTimeHour").value, 2) + 
    padZeros(document.getElementById("inputStartTimeMinute").value, 2);
    let inputEndTime = padZeros(document.getElementById("inputEndTimeHour").value, 2) + 
                            padZeros(document.getElementById("inputEndTimeMinute").value, 2);
    let entry = {
        "weekday": inputDay,
        "start_time": inputStartTime,
        "end_time": inputEndTime,
    }
    document.getElementById("formAddDateTime").reset(); 
    emailDisabledTimes.push(entry);
    socket.emit('update-time', {"email_disabled_times": emailDisabledTimes});
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
    /*
        Enables/disables the email options
    */
    displayEmailOption();
    socket.emit('enable-email', {"enable_email": enable_email});
}

function changeDuration() {
    /*
        Changes the duration before an email gets sent
    */
    email_time = document.getElementById("durationBeforeEmail").value
    document.getElementById("durationBeforeEmail").value = '';
    document.getElementById("currentTime").innerHTML = email_time;
    socket.emit('change-duration', {"email_time": email_time});
}