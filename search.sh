#!/bin/bash

# Define the output CSV file
OUTPUT_FILE="stlink_programmers.csv"

# Initialize an associative array to keep track of dev-type counts
declare -A dev_type_count

# Write the CSV header
echo "dev-type,serial" > "$OUTPUT_FILE"

# Variables to hold the current serial and dev-type
serial=""
dev_type=""

# Run the st-info --probe command and parse the output
/data/data/com.termux/files/home/sagar/bin/st-info --probe | while IFS= read -r line; do
    # Check if the line contains a serial
    if [[ "$line" =~ serial:\ +([A-Fa-f0-9]+) ]]; then
        serial="${BASH_REMATCH[1]}"
    fi

    # Check if the line contains a dev-type
    if [[ "$line" =~ dev-type:\ +([A-Za-z0-9_]+) ]]; then
        dev_type="${BASH_REMATCH[1]}"

        # Check if this dev-type has already been seen
        if [[ -n "${dev_type_count[$dev_type]}" ]]; then
            # Increment the count and append the suffix to the dev-type
            suffix="${dev_type_count[$dev_type]}"
            new_dev_type="${dev_type}_$suffix"
            dev_type_count[$dev_type]=$((suffix + 1))
        else
            # First time seeing this dev-type, start the count
            new_dev_type="$dev_type"
            dev_type_count[$dev_type]=1
        fi

        # Write the dev-type and serial to the CSV file
        echo "$new_dev_type,$serial" >> "$OUTPUT_FILE"
    fi
done

echo "Parsing complete. Data saved to $OUTPUT_FILE"

