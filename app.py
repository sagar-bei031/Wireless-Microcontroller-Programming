from flask import Flask, jsonify, render_template, request, redirect, url_for, flash
from flask_socketio import SocketIO, emit
import os
import subprocess
import csv

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Used to handle flash messages
UPLOAD_FOLDER = 'files'  # Directory where uploaded files are stored
PASSWORD = os.getenv('UPPASS', 'up')  # Define the upload password

socketio = SocketIO(app)

FLASH_SCRIPT_PATH='./script.sh'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)  # Create folder if it doesn't exist

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    password = request.form.get('password')
    
    # Check if the password is correct
    if password != PASSWORD:
        flash('Incorrect password! Please try again.')
        return redirect(url_for('index'))
    
    if 'file' not in request.files:
        flash('No file part')
        return redirect(url_for('index'))
    
    file = request.files['file']
    
    if file.filename == '':
        flash('No selected file')
        return redirect(url_for('index'))
    
    if file:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        flash(f'File successfully uploaded to {file_path}')

        socketio.start_background_task(flash_microcontroller, file_path)
        return redirect(url_for('index'))
    
    """
    try:
         # Run the shell script with the file path as an argument
        result = subprocess.run([FLASH_SCRIPT_PATH, file_path], check=True, capture_output=True, text=True)
        print(result.stdout)
        flash(f'Microcontroller successfully flashed!\n{result.stdout}')
    except subprocess.CalledProcessError as e:
        flash(f'Error flashing microcontroller: {e.stderr}')
    except Exception as e:
        flash(f'An error occurred: {str(e)}')
        
    return redirect(url_for('index'))
    """

def flash_microcontroller(file_path):
    """Function to run the shell script and emit real-time output via WebSockets."""

    """
    try:
        process = subprocess.Popen([FLASH_SCRIPT_PATH, file_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # Stream output
        for line in iter(process.stdout.readline, ''):
            socketio.emit('terminal_output', {'output': line})

        process.wait()
        if process.returncode == 0:
            socketio.emit('terminal_output', {'output': 'Microcontroller successfully flashed!'})
        else:
            socketio.emit('terminal_output', {'output': 'Flashing failed. Check logs.'})
    except Exception as e:
        socketio.emit('terminal_output', {'output': f'An error occurred: {str(e)}'})
    """

    try:
        process = subprocess.Popen([FLASH_SCRIPT_PATH, file_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # Read both stdout and stderr
        stdout, stderr = process.communicate()

        # Emit the stdout and stderr via WebSocket
        if stdout:
            socketio.emit('terminal_output', {'output': stdout})
            print(stdout)  # Also print to the server console
        if stderr:
            socketio.emit('terminal_output', {'output': f'Error: {stderr}'})
            print(f"Error: {stderr}")  # Print error messages

        # Check if the process was successful
        if process.returncode == 0:
            socketio.emit('terminal_output', {'output': 'Microcontroller successfully flashed!'})
        else:
            socketio.emit('terminal_output', {'output': 'Flashing failed. Check logs.'})
    except Exception as e:
        socketio.emit('terminal_output', {'output': f'An error occurred: {str(e)}'})
        print(f"An error occurred: {str(e)}")


@app.route('/search', methods=['GET'])
def search():
    """Endpoint to search for programmers, parse the CSV, and return JSON data."""

    # Run the parse_stinfo.sh script
    try:
        subprocess.run([PARSE_SCRIPT_PATH], check=True)
    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Failed to run the script", "details": str(e)}), 500

    # After the script finishes, read the CSV file
    programmers = []

    try:
        with open(CSV_FILE_PATH, mode='r') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            for row in csv_reader:
                programmers.append({
                    'dev-type': row['dev-type'],
                    'serial': row['serial']
                })
    except FileNotFoundError:
        return jsonify({"error": "CSV file not found"}), 500
    except Exception as e:
        return jsonify({"error": "Error reading the CSV file", "details": str(e)}), 500

    # Return the list of programmers as JSON
    return jsonify({"programmers": programmers})



if __name__ == '__main__':
    #app.run(host='0.0.0.0', port=5000, debug=True)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

