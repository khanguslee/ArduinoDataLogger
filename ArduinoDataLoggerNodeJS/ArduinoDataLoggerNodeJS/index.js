// Connect to server hosting socket.io
var socket = io();

// Default options
var emailDisabledTimes = [];
var emailTime = 0;
var enableEmail = false;

function showSuccessAlert(title, message="") {
    /*
        Success alert that will pop up
    */
    document.getElementById("success-header").innerHTML = title;
    document.getElementById("success-message").innerHTML = message;
    document.getElementById("success-alert").style.display = "block";
    setTimeout(function() {
        document.getElementById("success-alert").style.display = "none";            
    }, 3000);
}

function showErrorAlert(title, message="") {
    /*
        Error alert that will pop up
    */
    document.getElementById("danger-header").innerHTML = title;
    document.getElementById("danger-message").innerHTML = message;
    document.getElementById("danger-alert").style.display = "block";
    setTimeout(function() {
        document.getElementById("danger-alert").style.display = "none";            
    }, 3000);
}

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
            return 0
    }
}

function sortTable() {
    /*
        Sorts the emailed disabled times. A basic insertion sort.
        This will sort the full table every time. 
        Did this just in case someone messes around with the json file.
    */
    var inputTable = emailDisabledTimes;
    var sortedTable = [];
    for (let i = 0; i < inputTable.length; i++) {
        // Pick out item from input table
        var currentItem = inputTable[i];
        // Insert into sorted table
        for (var j = 0; j < sortedTable.length; j++) {
            var sortedItem = sortedTable[j];
            if (checkDay(currentItem.weekday) < checkDay(sortedItem.weekday)) {
                break;
            } 
            if(checkDay(currentItem.weekday) === checkDay(sortedItem.weekday)) {
                // Check start time
                if (parseInt(currentItem.start_time) < parseInt(sortedItem.start_time)) {
                    break;
                }
                // If start time same, check end time
                if (parseInt(currentItem.start_time) === parseInt(sortedItem.start_time)) {
                    if (parseInt(currentItem.end_time) < parseInt(sortedItem.end_time)) {
                        break;
                    }
                }
            }
        }
        sortedTable.splice(j, 0, currentItem);
    }
    return sortedTable;
}

function changeName() {
    /*
        Changes the device name.
        This name is only used to distinguish one device from another in the SQL database.
    */
    let newDeviceName = document.getElementById("inputChangeName").value;
    socket.emit('change-name', {"device_name": newDeviceName});
    document.getElementById("deviceName").innerHTML = newDeviceName;
}

function toggleEmailList() {
    // Update email destination list
    socket.emit('toggle-email-list');
}

function editEmailList() {
    // Update email destination list
    socket.emit('toggle-email-list');
}

function removeEmail(event) {
    // Remove div
    let removeEmailEntry = this.parentNode.remove();
}

function addEmail(event) {
    /*
        Ran when user adds a new email destination to the list
    */
    let emailListDiv = document.getElementById('modalListOfEmailDestinations');
    let inputEmailElement = document.getElementById('newEmailInput');
    let inputEmailText = inputEmailElement.value;

    // Create new list entry
    let newEmailEntry = document.createElement('li');
    newEmailEntry.className = 'list-group-item';
    newEmailEntry.id = inputEmailText;
    let newEmailText = document.createTextNode(inputEmailText);
    newEmailEntry.appendChild(newEmailText);

    let removeEmailButton = document.createElement('button');
    removeEmailButton.textContent = 'Remove';
    removeEmailButton.className = 'btn btn-danger btn-sm';
    removeEmailButton.style.cssFloat = 'right';
    removeEmailButton.addEventListener('click', removeEmail);
    newEmailEntry.appendChild(removeEmailButton);
    emailListDiv.appendChild(newEmailEntry);
    inputEmailElement.value = '';
}

function changeEmail() {
    /*
        This is triggered when user clicks on Save Changes within the email destination modal.
        This will go through the list entry ID's and saves them into an array. 
        The email destinations will be sent to app.js (Server) to be stored in a json file
    */
    let emailListDiv = document.getElementById('modalListOfEmailDestinations');
    let emailList = emailListDiv.getElementsByTagName('li');
    let outputEmailList = [];
    for (let index=0; index<emailList.length; index++) {
        let emailEntry = emailList[index].id;
        outputEmailList.push(emailEntry);
    }
    socket.emit('add-email-destination', {"email_destinations":outputEmailList});
}

function closeEmailModal() {
    /* 
        When user exits out of the email destination modal, we will clear the input box inside that modal
    */
    let inputEmailElement = document.getElementById('newEmailInput');
    inputEmailElement.value = '';
}

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
        Pre-conditions:
            emailDisabledTimes - Up to date before this function is called
    */
    // Delete existing table
    var table = document.getElementById("tableOfDatesAndTimes");
    for (let i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    }

    emailDisabledTimes = sortTable();

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

function validateHour(inputHour) {
    /*
        Check if user input a valid hour
    */
    if (inputHour == "") {
        showErrorAlert("Invalid Hour", "No value for hour");        
        return false;
    }

    if (inputHour >= 0 && inputHour <= 23) {
        return true;
    }
    showErrorAlert("Invalid Hour", "Input hour value between 0 and 23");                    
    return false;
}

function validateMinute(inputMinute) {
    /*
        Check if user input a valid minute
    */
    if (inputMinute == "") {
        showErrorAlert("Invalid Minute", "No value for minute");                
        return false;
    }

    if (inputMinute >= 0 && inputMinute <= 59) {
        return true;
    }
    showErrorAlert("Invalid Minute", "Input minute value between 0 and 59");                        
    return false;
}

function addTimeEntry() {
    /*
        Adds a time entry
    */
    let inputDay = document.getElementById("inputDay").value;
    // Check start time
    var startHour = document.getElementById("inputStartTimeHour").value;
    var startMinute = document.getElementById("inputStartTimeMinute").value;
    // Check if actual hour and minute value
    if (validateHour(startHour) && validateMinute(startMinute)) {
        var inputStartTime = padZeros(startHour, 2) + padZeros(startMinute, 2);        
    } else {
        return false;
    }

    // Check end time
    var endHour = document.getElementById("inputEndTimeHour").value;
    var endMinute = document.getElementById("inputEndTimeMinute").value;
    if (validateHour(endHour) && validateMinute(endMinute)) {
        var inputEndTime = padZeros(endHour, 2) + padZeros(endMinute, 2);
    } else {
        return false;
    }

    // Check if end time is later than start time
    if (inputStartTime >= inputEndTime) {
        showErrorAlert("Invalid start/end time", "The input start time is later than the input end time");
        return false;
    }

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
    // Set device name
    document.getElementById("deviceName").innerHTML = data.device_name;

    // Email options
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
    /*
        Server can call this if options were successful/unsuccessful in saving.
    */
    if(isSaved) {
        showSuccessAlert("Options saved!");
    } else {
        showErrorAlert("Options failed to save!");
    }
});

socket.on('update-email-list', (data) => {
    /*
        Will populate the two email destination lists.
    */
    if (data.email_destinations.length)
    {
        // Update email destination list
        let mainEmailListDiv = document.getElementById('mainListOfEmailDestinations');
        mainEmailListDiv.innerHTML = '';
        for (let i=0; i<data.email_destinations.length; i++)
        {
            let newEmailEntry = document.createElement('li');
            newEmailEntry.className = 'list-group-item';
            let newEmailText = document.createTextNode(data.email_destinations[i]);
            newEmailEntry.appendChild(newEmailText);
            mainEmailListDiv.appendChild(newEmailEntry);
        }
        
        // Done again since you cannot append same child to multiple parents
        let modalEmailListDiv = document.getElementById('modalListOfEmailDestinations');
        modalEmailListDiv.innerHTML = '';
        for (let i=0; i<data.email_destinations.length; i++)
        {
            let newEmailEntry = document.createElement('li');
            newEmailEntry.className = 'list-group-item';
            newEmailEntry.id = data.email_destinations[i];
            let newEmailText = document.createTextNode(data.email_destinations[i]);
            newEmailEntry.appendChild(newEmailText);

            let removeEmailButton = document.createElement('button');
            removeEmailButton.textContent = 'Remove';
            removeEmailButton.className = 'btn btn-danger btn-sm';
            removeEmailButton.style.cssFloat = 'right';
            removeEmailButton.addEventListener('click', removeEmail);
            newEmailEntry.appendChild(removeEmailButton);
            modalEmailListDiv.appendChild(newEmailEntry);
        }
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
    if (email_time <= 0) {
        showErrorAlert("Invalid Duration", "Please input a positive duration.");
        return false;
    }
    document.getElementById("currentTime").innerHTML = email_time;
    socket.emit('change-duration', {"email_time": email_time});
}