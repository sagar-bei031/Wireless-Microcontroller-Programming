document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById('binaryForm');
    const statusMessage = document.getElementById('statusMessage');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the page from reloading

        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            statusMessage.textContent = "Please select a file.";
            return;
        }

        const formData = new FormData();
        formData.append('binary_file', file);

        // Send the file using fetch API
        fetch('/save-bin', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                statusMessage.textContent = "File uploaded successfully!";
            } else {
                statusMessage.textContent = "Error: " + data.error;
            }
        })
        .catch(error => {
            statusMessage.textContent = "An error occurred: " + error.message;
        });
    });
});

