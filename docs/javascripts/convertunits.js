// Conversion factor
const metersToFeet = 3.28084;

// Map to store original cell values
let originalValues = new Map();

// Function to convert table values
function convertTableValues() {
    // Select all tables
    let tables = document.querySelectorAll('table');

    // Iterate over each table
    tables.forEach((table) => {
        // Select all rows in the current table, skipping the first row
        let rows = Array.from(table.querySelectorAll('tr')).slice(1);

        // Iterate over each row
        rows.forEach((row) => {
            // Select the 7th and 8th cells in the current row
            let widthCell = row.cells[6]; // Index is 0-based, so 6 is the 7th cell
            let heightCell = row.cells[7]; // Index is 0-based, so 7 is the 8th cell

            // Store the original values
            if (!originalValues.has(widthCell)) {
                originalValues.set(widthCell, widthCell.textContent);
            }
            if (!originalValues.has(heightCell)) {
                originalValues.set(heightCell, heightCell.textContent);
            }

            // Get the length in meters from the cell's content
            let widthInMeters = parseFloat(widthCell.textContent);
            let heightInMeters = parseFloat(heightCell.textContent);

            // Check if the values are numbers
            if (isNaN(widthInMeters) || isNaN(heightInMeters)) {
                console.error('Invalid number in table cell');
                return;
            }

            // Convert the length to feet
            let widthInFeet = widthInMeters * metersToFeet;
            let heightInFeet = heightInMeters * metersToFeet;

            // Calculate the whole feet part and the inches part
            let widthFeet = Math.floor(widthInFeet);
            let widthInches = Math.round((widthInFeet - widthFeet) * 12);
            let heightFeet = Math.floor(heightInFeet);
            let heightInches = Math.round((heightInFeet - heightFeet) * 12);

            // Modify the content of the cell
            widthCell.textContent = widthFeet + "' " + widthInches + '"';
            heightCell.textContent = heightFeet + "' " + heightInches + '"';
        });
    });
}

// Function to revert table values
function revertTableValues() {
    for (let [cell, originalValue] of originalValues.entries()) {
        cell.textContent = originalValue;
    }
}

// Attach the functions to the button's click event
let convertButton = document.getElementById('convertButton');
convertButton.addEventListener('click', function() {
    if (convertButton.textContent === 'Imperial') {
        convertTableValues();
        convertButton.textContent = 'Metric';
    } else {
        revertTableValues();
        convertButton.textContent = 'Imperial';
    }
});

// Attach the functions to the button's change event
// let convertButton = document.getElementById('convertButton');
// convertButton.addEventListener('change', function() {
//     if (convertButton.checked) {
//         convertTableValues();
//         document.body.setAttribute("units", "imperial")
//     } else {
//         revertTableValues();
//         document.body.setAttribute("units", "metric")
//     }
// });
