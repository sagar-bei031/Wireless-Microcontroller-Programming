// Socket.IO for terminal output
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
    var fileNameInput = document.getElementById('filename');
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
                        option.dataset.flash = device.flash;  // Store flash as data attribute
                        option.textContent = `${device['dev-type']} (${device.serial}|${device.flash})`; // Display the dev-type and serial
                        deviceSelect.appendChild(option);
                    });

                    deviceSelect.focus();
                }
                // Call this to check if no device is selected initially
                checkDeviceSelection();
            })
            .catch(error => {
                alert('Error: ' + error);  // Display any fetch errors
            });
    });

    // Update hidden input with selected device serial and flash
    document.getElementById('device-select').addEventListener('change', function() {
        var serial = this.value;
        var flash = this.options[this.selectedIndex].dataset.flash;  // Get flash from data attribute
        document.getElementById('serial').value = serial;
        document.getElementById('flash').value = flash;

        // Update hidden fields and check device selection
        updateHiddenFields();
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

    function updateHiddenFields() {
        var serial = deviceSelect.value;
        var flash = deviceSelect.options[deviceSelect.selectedIndex].dataset.flash;
        var filename = fileNameInput.value;

        document.getElementById('serial').value = serial;
        document.getElementById('flash').value = flash;
        document.getElementById('filename').value = filename;
    }

    document.getElementById('saveForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission and page reload

        updateHiddenFields(); // Ensure hidden fields are updated before form submission

        var formData = new FormData(this); // Collect form data

        fetch('/extract', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();  // Parse JSON response
        })
        .then(data => {
            var terminal = document.getElementById('terminal');
            if (data.error) {
                terminal.innerHTML += "Error: " + data.error + "\n";
            } else {
                terminal.innerHTML += "File extracting in progress ...\n";
            }
        })
        .catch(error => {
            console.error('Error:', error); // Use console.error to see the full error in the console
            alert('Error: ' + error.message); // Handle any errors during the fetch
        });
    });

    // Clear terminal output
    document.getElementById('clear-btn').addEventListener('click', function() {
        terminal.innerHTML = '';
    });
});

