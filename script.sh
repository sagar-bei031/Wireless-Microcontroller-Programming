#!/data/data/com.termux/files/usr/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <file_path> <serial_number> <reset_option>"
    exit 1
fi

# Assign arguments to variables
FILE=$1
SERIAL=$2
RST_OPTION=$3

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

# Conditionally add the --reset flag based on the third argument
if [ "$RST_OPTION" = "reset" ]; then
    /data/data/com.termux/files/home/sagar/bin/st-flash --reset --serial $SERIAL write $FILE 0x8000000
elif [ "$RST_OPTION" = "no-reset" ]; then
    /data/data/com.termux/files/home/sagar/bin/st-flash --serial $SERIAL write $FILE 0x8000000
else
    echo "Error: Invalid reset option. Use 'reset' or 'no-reset'."
    exit 1
fi

# Optional: You can add further actions or messages here

