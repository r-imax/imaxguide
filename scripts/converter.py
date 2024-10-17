"""Module to convert measurements in CSV tables."""

import os
import shutil
import pandas as pd


# Function to convert meters to feet and inches
def meters_to_feet_inches(meters):
    """Process conversion of meters to foot inches."""
    feet = int(meters / 0.3048)
    inches = (meters / 0.3048 % 1) * 12
    return f"{feet} ft {round(inches, 2)} in"


# Define the source and destination directories
source_dir = 'docs/assets/csv/metric'
imperial_dir = 'docs/assets/csv/imperial'

# Create the 'imperial' directory if it doesn't exist
if not os.path.exists(imperial_dir):
    os.makedirs(imperial_dir)
    print("Created imperial directory.")

# Walk through the source directory
for root, dirs, files in os.walk(source_dir):
    # Create corresponding directories in the imperial directory
    for curdir in dirs:
        os.makedirs(os.path.join(imperial_dir, os.path.relpath(os.path.join(root, curdir), source_dir)), exist_ok=True)
        print("Created subdirectory", curdir)

    # Process each CSV file
    for file in files:
        if file.endswith('.csv'):
            # Define the full file paths
            source_file = os.path.join(root, file)
            relative_path = os.path.relpath(source_file, source_dir)
            destination_file = os.path.join(imperial_dir, relative_path)

            # Copy the file to the imperial directory
            shutil.copy(source_file, destination_file)

            # Read and process the CSV file
            df = pd.read_csv(destination_file)
            df['Height'] = df['Height'].str.replace(' m', '').astype(float).apply(meters_to_feet_inches)
            df['Width'] = df['Width'].str.replace(' m', '').astype(float).apply(meters_to_feet_inches)

            # Save the updated DataFrame back to the CSV file
            df.to_csv(destination_file, index=False)
            print("Converted", source_file)

print("Conversion complete!")
