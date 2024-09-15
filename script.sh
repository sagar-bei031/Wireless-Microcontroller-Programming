#!/data/data/com.termux/files/usr/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <file_path> <serial_number>"
    exit 1
fi

# Assign arguments to variables
FILE=$1
SERIAL=$2

# Validate file existence
if [ ! -f "$FILE" ]; then
    echo "Error: File '$FILE' not found!"
    exit 1
fi

# Optionally validate the serial number if needed (e.g., check format)
# For example, checking if serial number is not empty
if [ -z "$SERIAL" ]; then
    echo "Error: Serial number must be provided!"
    exit 1
fi

# Print status
echo "Flashing microcontroller with file $FILE using serial number $SERIAL..."

# Run the flash command
/data/data/com.termux/files/home/sagar/bin/st-flash --reset --serial $SERIAL write $FILE 0x8000000

# Optional: You can add further actions or messages here

