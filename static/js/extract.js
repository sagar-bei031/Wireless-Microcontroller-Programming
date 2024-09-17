// Socket.IO for terminal output (if needed)
var socket = io.connect('http://' + document.domain + ':' + location.port);

// On WebSocket connect, set the sid in the hidden form field
socket.on('connect', () => {
    document.getElementById('sid').value = socket.id;
});

socket.on('terminal_output', function(data) {
    var terminal = document.getElementById('terminal');
    terminal.innerHTML += data.output + "\n";
});


document.addEventListener("DOMContentLoaded", function() {
    var deviceSelect = document.getElementById('device-select');
    var fileNameInput = document.getElementById('file-name');
    var saveButton = document.getElementById('save-btn');
    var terminal = document.getElementById('terminal');
    // Initial state of the button should be disabled
    checkDeviceSelection();

    // Search button functionality
    document.getElementById('search-btn').addEventListener('click', function() {
        fetch('/search')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);  // Handle any errors from the server
                    return;
                }

                var deviceSelect = document.getElementById('device-select');
                deviceSelect.innerHTML = '<option value="">--Select a Microcontroller--</option>'; // Reset the dropdown

                // Loop through the devices and add them as options
                if (data.programmers.length > 0) {
                    data.programmers.forEach(device => {
                        var option = document.createElement('option');
                        option.value = device.serial;  // Set the value to the device serial number
			option.flash = device.flash;
                        option.textContent = device['dev-type'] + ' (' + device.serial + '|' + device.flash ')'; // Display the dev-type and serial
                        deviceSelect.appendChild(option);
                    });

                    deviceSelect.focus();
	
                    //deviceSelect.size = data.programmers.length + 1;
                }
                // Call this to check if no device is selected initially
                checkDeviceSelection();
            })
            .catch(error => {
                alert('Error: ' + error);  // Display any fetch errors
            });
    });

    // Update hidden input with selected device serial
    document.getElementById('device-select').addEventListener('change', function() {
        var serial = this.value;
	var flash = this.flash;
        document.getElementById('serial').value = serial;
        document.getElementById('flash').value = flash;

        // Disable the upload button if no serial is selected
        checkDeviceSelection();
    });

    // Check if a microcontroller is selected and enable text input
    function checkDeviceSelection() {
        if (deviceSelect.value !== '') {
            fileNameInput.disabled = false;
        } else {
            fileNameInput.disabled = true;
            saveButton.disabled = true;
        }
    }

    // Enable save button when a file name is entered
    fileNameInput.addEventListener('input', function() {
        if (this.value !== '') {
            saveButton.disabled = false;
        } else {
            saveButton.disabled = true;
        }
    });


    // Handle the form submission via AJAX to prevent page reload
    document.getElementById('saveForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission and page reload

        var formData = new FormData(this); // Collect form data

        fetch('/extract', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            var terminal = document.getElementById('terminal');
            if (data.error) {
                terminal.innerHTML += "Error: " + data.error + "\n";
            } else {
                terminal.innerHTML += "File uploaded successfully!\n";
            }
        })
        .catch(error => {
            alert('Error: ' + error); // Handle any errors during the fetch
        });
    });



    // Clear terminal output
    document.getElementById('clear-btn').addEventListener('click', function() {
        terminal.innerHTML = '';
    });
});

