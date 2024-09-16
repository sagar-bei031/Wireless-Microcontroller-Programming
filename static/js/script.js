// script.js

// Socket.IO for terminal output (if needed)
var socket = io.connect('http://' + document.domain + ':' + location.port);
socket.on('terminal_output', function(data) {
    var terminal = document.getElementById('terminal');
    terminal.innerHTML += data.output + "\n";
});

document.addEventListener("DOMContentLoaded", function() {
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
                        option.textContent = device['dev-type'] + ' (' + device.serial + ')'; // Display the dev-type and serial
                        deviceSelect.appendChild(option);
                    });

                    deviceSelect.focus();
                    deviceSelect.size = data.programmers.length + 1;
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
        document.getElementById('serial').value = serial;

        // Disable the upload button if no serial is selected
        checkDeviceSelection();

        this.size = 1;
    });

    // Function to check if a device is selected and enable/disable the button
    function checkDeviceSelection() {
        var serial = document.getElementById('device-select').value;
        var uploadButton = document.querySelector('.upload-btn');

        if (serial === '') {
            uploadButton.disabled = true;
            uploadButton.style.backgroundColor = '#666'; // Grey out button
            uploadButton.style.cursor = 'not-allowed';
            uploadButton.value = 'Flash File';
        } else {
            uploadButton.disabled = false;
            uploadButton.style.backgroundColor = '#4CAF50'; // Re-enable button
            uploadButton.style.cursor = 'pointer';
            uploadButton.value = 'Flash File';
        }
    }

    // Handle the form submission via AJAX to prevent page reload
    document.getElementById('uploadForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission and page reload

        var formData = new FormData(this); // Collect form data

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                return response.text();
            }
        })
        .then(data => {
            // Update the terminal output or handle any response logic
            var terminal = document.getElementById('terminal');

            if (typeof data === 'object') {
                if (data.error) {
                    terminal.innerHTML += "Error: " + data.error + "\n";
                } else {
                    terminal.innerHTML += "File uploaded successfully!\n";
                }
            } else {
                terminal.innerHTML += data + "\n";
            }
        })
        .catch(error => {
            alert('Error: ' + error); // Handle any errors during the fetch
        });
    });
});

