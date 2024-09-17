from flask import Flask, jsonify, render_template, request, redirect, url_for, flash, session
from flask_socketio import SocketIO, emit, join_room
import os
import subprocess
import csv

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Used to handle flash messages
UPLOAD_FOLDER = 'files'  # Directory where uploaded files are stored
PASSWORD = os.getenv('UPPASS', 'up')  # Define the upload password
PARSE_SCRIPT_PATH = './search.sh'
CSV_FILE_PATH = './stlink_programmers.csv'
FLASH_SCRIPT_PATH = './upload.sh' 
SAVE_FOLDER = 'saved_bins'

socketio = SocketIO(app)

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)  # Create folder if it doesn't exist

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stm32')
def stm32():
    return render_template('stm32.html')

@app.route('/save_binary')
def save_binary_page():
    return render_template('save_binary.html')

@socketio.on('connect')
def handle_connect():
    # Assign the user to a room based on their session ID
    room = request.sid
    session['sid']=room
    join_room(room)
    print(f'User connected and joined room: {room}')


@app.route('/upload', methods=['POST'])
def upload_file():
    serial = request.form.get('serial')
    reset_option = request.form.get('flashOption')
    sid = request.form.get('sid')  # Get the sid from the form

    if not sid:
        flash('SID not found')
        return redirect(url_for('index'))

    if 'file' not in request.files or not serial:
        flash('No file or device selected')
        return redirect(url_for('index'))

    file = request.files['file']
    if file.filename == '':
        flash('No selected file')
        return redirect(url_for('index'))

    if file:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        flash(f'File successfully uploaded to {file_path} for device {serial}')

        # Start the flashing process and pass the sid for WebSocket messages
        socketio.start_background_task(flash_microcontroller, file_path, serial, reset_option, sid)
        return jsonify({"status": "success"})
    else:
        return jsonify({"error": "Flashing failed"}), 400


def flash_microcontroller(file_path, serial, reset_option, room):
    """Function to run the shell script and emit real-time output via WebSockets."""
    try:
        process = subprocess.Popen([FLASH_SCRIPT_PATH, file_path, serial, reset_option], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()

        if stdout:
            socketio.emit('terminal_output', {'output': stdout})
        if stderr:
            socketio.emit('terminal_output', {'output': f'Error: {stderr}'})

        if process.returncode == 0:
            socketio.emit('terminal_output', {'output': 'Microcontroller successfully flashed!'})
        else:
            socketio.emit('terminal_output', {'output': 'Flashing failed. Check logs.'})
    except Exception as e:
        socketio.emit('terminal_output', {'output': f'An error occurred: {str(e)}'}, room=room)

@app.route('/search', methods=['GET'])
def search():
    """Endpoint to search for programmers, parse the CSV, and return JSON data."""
    try:
        subprocess.run([PARSE_SCRIPT_PATH], check=True)
    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Failed to run the script", "details": str(e)}), 500

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

    return jsonify({"programmers": programmers})


@app.route('/save-bin', methods=['POST'])
def save_binary():
    if 'binary_file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['binary_file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Ensure the file has a .bin extension
    if not file.filename.endswith('.bin'):
        return jsonify({'error': 'Invalid file type. Only .bin files are allowed.'}), 400

    # Save the file to the 'files' directory
    file_path = os.path.join(SAVE_FOLDER, file.filename)
    try:
        file.save(file_path)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

