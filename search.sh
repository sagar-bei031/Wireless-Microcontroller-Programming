#!/data/data/com.termux/files/usr/bin/bash

# Define the output CSV file
OUTPUT_FILE="stlink_programmers.csv"

# Write the CSV header
echo "serial,flash,dev-type" > "$OUTPUT_FILE"

# Variables to store device information
serial=""
flash=""
dev_type=""

# Run the st-info --probe command and parse the output
timeout 10s /data/data/com.termux/files/home/sagar/bin/st-info --probe 2>/dev/null | while IFS= read -r line; do
    # Extract serial
    if echo "$line" | grep -q "serial:"; then
        serial=$(echo "$line" | sed 's/.*serial:\s*//')
    fi

    # Extract flash (only the integer part)
    if echo "$line" | grep -q "flash:"; then
        flash=$(echo "$line" | sed 's/.*flash:\s*\([0-9]*\).*/\1/')
    fi

    # Extract dev-type
    if echo "$line" | grep -q "dev-type:"; then
        dev_type=$(echo "$line" | sed 's/.*dev-type:\s*//')
    fi

    # Once all three values are captured, write them to the CSV file
    if [[ -n "$serial" && -n "$flash" && -n "$dev_type" ]]; then
        echo "$serial,$flash,$dev_type" >> "$OUTPUT_FILE"
        # Reset the variables for the next device
        serial=""
        flash=""
        dev_type=""
    fi
done

# Check if the timeout caused the command to fail
if [ $? -eq 124 ]; then
    echo "st-info command timed out. No data collected." >> "$OUTPUT_FILE"
fi

echo "Parsing complete. Data saved to $OUTPUT_FILE"

