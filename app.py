from flask import Flask, render_template, request, redirect, url_for, flash
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Used to handle flash messages
UPLOAD_FOLDER = 'files'  # Directory where uploaded files are stored
PASSWORD = os.getenv('UPPASS', 'up')  # Define the upload password

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
        return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

