// Select all tables
let tables = document.querySelectorAll('table');

// Iterate over each table
tables.forEach((table) => {
    // Select all rows in the current table, skipping the first row
    let rows = Array.from(table.querySelectorAll('tr')).slice(1);

    // Iterate over each row
    rows.forEach((row) => {
        // Select the 7th cell in the current row
        let width = row.cells[6]; // Index is 0-based, so 6 is the 7th cell
        let height = row.cells[7]; // Index is 0-based, so 6 is the 7th cell
        // Get the length in meters from the cell's content
        let widthInMeters = parseFloat(width.textContent);
        let heightInMeters = parseFloat(height.textContent);


        // Convert the length to feet (1 meter is approximately 3.28084 feet)
        let widthInFeet = widthInMeters * 3.28084;
        let heightInFeet = heightInMeters * 3.28084;
        // Calculate the whole feet part and the inches part
        let widthFeet = Math.floor(widthInFeet);
        let widthInches = Math.round((widthInFeet - widthFeet) * 12);
        let heightFeet = Math.floor(heightInFeet);
        let heightInches = Math.round((heightInFeet - heightFeet) * 12);

        // Modify the content of the cell
        width.textContent = widthFeet + "' " + widthInches + '"';
        height.textContent = heightFeet + "' " + heightInches + '"';
    });
});
