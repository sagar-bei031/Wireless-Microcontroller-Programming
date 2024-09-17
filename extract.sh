#!/bin/bash

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <file_path> <serial_number> <flash_size>" 
    exit 1
fi

FILE=$1
SERIAL=$2
FLASH=$3

if [ -z "$SERIAL" ]; then
    echo "Error: Serial number must be provided!"
    exit 1
fi

# Print status
echo "Extracting binary from  serial $SERIAL as file $FILE of flash $FLASH ..."


st-flash --serial $SERIAL read $FILE 0x8000000 $FLASH

echo "File successfully extracted"

