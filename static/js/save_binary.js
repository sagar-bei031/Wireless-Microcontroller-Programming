document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('binaryForm');
    const statusMessage = document.getElementById('statusMessage');
    const dropdownBtn = document.getElementById('fileDropdownBtn');
    const fileSelect = document.getElementById('fileDropdown');
    const actionStatus = document.getElementById('actionStatus');

    const saveFileBtn = document.getElementById('saveFileBtn');
    const deleteFileBtn = document.getElementById('deleteFileBtn');
    const renameFileBtn = document.getElementById('renameFileBtn');
    const downloadLink = document.getElementById('downloadLink'); // Hidden download link

    // Handle form submission to save file
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        const formData = new FormData(form);

        fetch('/save-bin', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success message
                statusMessage.textContent = 'File saved successfully!';
                statusMessage.classList.add('success');
                statusMessage.classList.remove('error');
            } else {
                // Show error message
                statusMessage.textContent = 'Error: ' + data.error;
                statusMessage.classList.add('error');
                statusMessage.classList.remove('success');
            }
        })
        .catch(error => {
            // Handle fetch error
            statusMessage.textContent = 'Error: ' + error;
            statusMessage.classList.add('error');
            statusMessage.classList.remove('success');
        });
    });

    // Fetch and show saved files when button is clicked, also open the dropdown
    dropdownBtn.addEventListener('click', function () {
        // Fetch the list of saved files from the server
        fetch('/get_saved_files')
            .then(response => response.json())
            .then(data => {
                // Clear existing options except the first one
                fileSelect.innerHTML = '<option value="" disabled selected>Select a saved file</option>';

                if (data.files && data.files.length > 0) {
                    data.files.forEach(file => {
                        const fileOption = document.createElement('option');
                        fileOption.textContent = file;
                        fileOption.value = file;
                        fileSelect.appendChild(fileOption);
                    });
                } else {
                    const noFilesOption = document.createElement('option');
                    noFilesOption.textContent = 'No saved files found';
                    noFilesOption.disabled = true;
                    fileSelect.appendChild(noFilesOption);
                }

                // Automatically open the dropdown
                fileSelect.focus();
            })
            .catch(error => {
                // Handle error while fetching files
                const errorOption = document.createElement('option');
                errorOption.textContent = 'Error fetching files: ' + error;
                errorOption.disabled = true;
                fileSelect.appendChild(errorOption);
            });
    });

    // Handle Download button click
    saveFileBtn.addEventListener('click', function () {
        const selectedFile = fileSelect.value;
        if (selectedFile) {
            actionStatus.textContent = ''; // Clear previous action status

            // Set up the download link
            fetch(`/download_file/${selectedFile}`)
                .then(response => response.blob()) // Fetch the file as a blob
                .then(blob => {
                    const url = window.URL.createObjectURL(blob); // Create a URL for the file
                    downloadLink.href = url;
                    downloadLink.download = selectedFile; // Set the file name for the download
                    downloadLink.click(); // Trigger the download
                    window.URL.revokeObjectURL(url); // Clean up the URL after download

                    actionStatus.textContent = 'File downloaded successfully!';
                    actionStatus.classList.add('success');
                    actionStatus.classList.remove('error');
                })
                .catch(error => {
                    actionStatus.textContent = 'Error: ' + error;
                    actionStatus.classList.add('error');
                    actionStatus.classList.remove('success');
                });
        } else {
            actionStatus.textContent = 'Please select a file to download.';
        }
    });

    // Handle Delete button click
    deleteFileBtn.addEventListener('click', function () {
        const selectedFile = fileSelect.value;
        if (selectedFile) {
            actionStatus.textContent = ''; // Clear previous action status

            fetch(`/delete_file/${selectedFile}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        actionStatus.textContent = 'File deleted successfully!';
                        actionStatus.classList.add('success');
                        actionStatus.classList.remove('error');
                    } else {
                        actionStatus.textContent = 'Error: ' + data.error;
                        actionStatus.classList.add('error');
                        actionStatus.classList.remove('success');
                    }
                })
                .catch(error => {
                    actionStatus.textContent = 'Error: ' + error;
                    actionStatus.classList.add('error');
                    actionStatus.classList.remove('success');
                });
        } else {
            actionStatus.textContent = 'Please select a file to delete.';
        }
    });

    // Handle Rename button click
    renameFileBtn.addEventListener('click', function () {
        const selectedFile = fileSelect.value;
        const newName = prompt("Enter the new name for the file:");

        if (selectedFile && newName) {
            actionStatus.textContent = ''; // Clear previous action status

            fetch(`/rename_file/${selectedFile}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ new_name: newName })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        actionStatus.textContent = 'File renamed successfully!';
                        actionStatus.classList.add('success');
                        actionStatus.classList.remove('error');
                    } else {
                        actionStatus.textContent = 'Error: ' + data.error;
                        actionStatus.classList.add('error');
                        actionStatus.classList.remove('success');
                    }
                })
                .catch(error => {
                    actionStatus.textContent = 'Error: ' + error;
                    actionStatus.classList.add('error');
                    actionStatus.classList.remove('success');
                });
        } else {
            actionStatus.textContent = 'Please select a file and enter a new name.';
        }
    });
});

