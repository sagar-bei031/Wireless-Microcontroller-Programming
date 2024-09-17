from flask import Flask, jsonify, render_template, request, send_file, redirect, url_for, flash, session
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
EXTRACT_SCRIPT_PATH = './extract.sh'  # Ensure this path is correct
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

@app.route('/extract')
def extract_page():
    return render_template('extract.html')

@socketio.on('connect')
def handle_connect():
    # Assign the user to a room based on their session ID
    room = request.sid
    session['sid'] = room
    join_room(room)
    print(f'User connected and joined room: {room}')

@app.route('/upload', methods=['POST'])
def upload_file():
    serial = request.form.get('serial')
    reset_option = request.form.get('flashOption')
    selected_file = request.form.get('filename')
    sid = request.form.get('sid')

    if not sid:
        flash('SID not found')
        return redirect(url_for('index'))

    if not selected_file or not serial:
        flash('No file or device selected')
        return redirect(url_for('index'))

    file_path = os.path.join(SAVE_FOLDER, selected_file)

    # Start the flashing process and pass the sid for WebSocket messages
    socketio.start_background_task(flash_microcontroller, file_path, serial, reset_option, sid)
    return jsonify({"status": "success"})

def flash_microcontroller(file_path, serial, reset_option, room):
    """Function to run the shell script and emit real-time output via WebSockets."""
    try:
        process = subprocess.Popen([FLASH_SCRIPT_PATH, file_path, serial, reset_option], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()

        if stdout:
            socketio.emit('terminal_output', {'output': stdout}, room=room)
        if stderr:
            socketio.emit('terminal_output', {'output': f'Error: {stderr}'}, room=room)

        if process.returncode == 0:
            socketio.emit('terminal_output', {'output': 'Microcontroller successfully flashed!'}, room=room)
        else:
            socketio.emit('terminal_output', {'output': 'Flashing failed. Check logs.'}, room=room)
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
                    'serial': row['serial'],
                    'flash': row['flash']
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

@app.route('/get_saved_files', methods=['GET'])
def get_saved_files():
    """API to return a list of saved .bin files."""
    try:
        files = [f for f in os.listdir(SAVE_FOLDER) if f.endswith('.bin')]
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete_file/<filename>', methods=['DELETE'])
def delete_file(filename):
    """API to delete a file by its name."""
    file_path = os.path.join(SAVE_FOLDER, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'File not found'}), 404

@app.route('/rename_file/<filename>', methods=['PUT'])
def rename_file(filename):
    """API to rename a file."""
    data = request.json
    new_name = data.get('new_name')

    if not new_name or not new_name.endswith('.bin'):
        return jsonify({'error': 'Invalid new file name. Must end with .bin'}), 400

    old_file_path = os.path.join(SAVE_FOLDER, filename)
    new_file_path = os.path.join(SAVE_FOLDER, new_name)

    if os.path.exists(old_file_path):
        if not os.path.exists(new_file_path):  # Ensure the new name doesn't exist
            try:
                os.rename(old_file_path, new_file_path)
                return jsonify({'success': True})
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        else:
            return jsonify({'error': 'A file with the new name already exists'}), 400
    else:
        return jsonify({'error': 'File not found'}), 404

@app.route('/download_file/<filename>', methods=['GET'])
def download_file(filename):
    """Endpoint to serve a file for download."""
    file_path = os.path.join(SAVE_FOLDER, filename)

    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return jsonify({'error': 'File not found'}), 404

@app.route('/extract', methods=['POST'])
def extract_file():
    serial = request.form.get('serial')
    filename = request.form.get('filename')
    flash = request.form.get('flash')
    sid = request.form.get('sid')

    if not sid:
        return jsonify({'error': 'SID not found'}), 400

    if filename == '' or not serial:
        return jsonify({'error': 'No file or device selected'}), 400

    file_path = os.path.join(SAVE_FOLDER, filename)

    try:
        # Start the extraction process and pass the sid for WebSocket messages
        socketio.start_background_task(extract_binary, file_path, serial, flash, sid)
        return jsonify({"status": "success"})  # Return JSON success response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def extract_binary(file_path, serial, flash, sid):
    try:
        process = subprocess.Popen([EXTRACT_SCRIPT_PATH, file_path, serial, flash], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()

        if stdout:
            socketio.emit('terminal_output', {'output': stdout}, room=sid)
        if stderr:
            socketio.emit('terminal_output', {'output': f'Error: {stderr}'}, room=sid)

        if process.returncode == 0:
            socketio.emit('terminal_output', {'output': 'Binary successfully extracted!'}, room=sid)
        else:
            socketio.emit('terminal_output', {'output': 'Extracting failed. Check logs.'}, room=sid)
    except Exception as e:
        socketio.emit('terminal_output', {'output': f'An error occurred: {str(e)}'}, room=sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

