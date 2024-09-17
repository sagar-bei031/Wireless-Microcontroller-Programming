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
	
                    //deviceSelect.size = data.programmers.length + 1;
                }
                // Call this to check if no device is selected initially
                checkDeviceSelection();
            })
            .catch(error => {
                alert('Error: ' + error);  // Display any fetch errors
            });
    });


    // Fetch and populate saved files
    fetch('/get_saved_files')
        .then(response => response.json())
        .then(data => {
            var fileSelect = document.getElementById('file-select');
            fileSelect.innerHTML = '<option value="">--Select a Saved File--</option>'; // Reset the dropdown

            if (data.files.length > 0) {
                data.files.forEach(file => {
                    var option = document.createElement('option');
                    option.value = file;  // Set the value to the file name
                    option.textContent = file;  // Display the file name
                    fileSelect.appendChild(option);
                });
            }

            // Check if a file is selected
            checkDeviceSelection();
        })
        .catch(error => {
            alert('Error fetching saved files: ' + error);
        });

    // Update hidden input with selected device serial
    document.getElementById('device-select').addEventListener('change', function() {
        var serial = this.value;
        document.getElementById('serial').value = serial;

        // Disable the upload button if no serial is selected
        checkDeviceSelection();
    });

    // Check if a file is selected and enable the button
    document.getElementById('file-select').addEventListener('change', checkDeviceSelection);

    // Function to check if a device and file are selected
    function checkDeviceSelection() {
        var serial = document.getElementById('device-select').value;
        var file = document.getElementById('file-select').value;
        var uploadButton = document.querySelector('.upload-btn');

        if (serial === '' || file === '') {
            uploadButton.disabled = true;
            uploadButton.style.backgroundColor = '#666'; // Grey out button
            uploadButton.style.cursor = 'not-allowed';
        } else {
            uploadButton.disabled = false;
            uploadButton.style.backgroundColor = '#4CAF50'; // Re-enable button
            uploadButton.style.cursor = 'pointer';
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

    // Clear terminal screen when clear button is clicked
    document.getElementById('clear-btn').addEventListener('click', function() {
        document.getElementById('terminal').innerHTML = '';
    });
});

