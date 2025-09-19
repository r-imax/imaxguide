#!/usr/bin/env python3
"""
IMAX Theatre Data Validator

This script validates CSV files in the data/ directory to ensure they meet
the required format and data quality standards.

Usage:
    python scripts/validate_data.py
    python scripts/validate_data.py --file data/Canada.csv
"""

import csv
import os
import sys
import argparse
from pathlib import Path
import re

# Required column headers (flexible administrative division naming)
REQUIRED_COLUMNS = {
    # At least one of these administrative division columns is required (null allowed for some countries)
    'administrative_division_columns': {'Province', 'State', 'Region', 'District', 'Prefecture', 'Canton', 'Country', 'Emirate', 'Province/State', 'Governorate'},
    # These columns are always required
    'always_required': {
        'City',
        'Location Name',
        'Screen Aspect Ratio (AR)',
        'Digital Projector',
        'Maximum AR for digital projection',
        'Film Projector',
        'Height',
        'Width',
        'Commercial films shown?'
    }
}

# Valid values for specific columns
VALID_VALUES = {
    'Commercial films shown?': {'Yes', 'No', 'Limited', 'Unknown', 'Unk'},
    'Screen Aspect Ratio (AR)': {
        '1.43:1', '1.90:1', 'Dome 1.43:1', 'Unk', 'Unknown', 'N/A'
    },
    'Digital Projector': {
        'IMAX CoLa', 'IMAX Digital', 'IMAX Laser XT', 'IMAX GT Laser',
        'IMAX Laser for Dome', 'IMAX Dome with Laser', 'N/A', 'No', 'None', 'Unknown'
    }
}

# Patterns for validation
PATTERNS = {
    'height': re.compile(r'^\d+\.?\d*\s*m$|^0\s*m$'),  # e.g., "18.29 m" or "0 m"
    'width': re.compile(r'^\d+\.?\d*\s*m$'),           # e.g., "25.91 m"
    'aspect_ratio': re.compile(r'^\d+\.?\d*:\d+\.?\d*$|^Dome\s+\d+\.?\d*:\d+\.?\d*$|^Unk$|^Unknown$|^N/A$')
}

class DataValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.stats = {
            'files_processed': 0,
            'total_rows': 0,
            'errors': 0,
            'warnings': 0
        }
    
    def validate_file(self, filepath):
        """Validate a single CSV file."""
        print(f"\n📁 Validating: {filepath}")
        
        if not os.path.exists(filepath):
            self.add_error(f"File not found: {filepath}")
            return False
        
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                # Check if file is empty
                if os.path.getsize(filepath) == 0:
                    self.add_error(f"File is empty: {filepath}")
                    return False
                
                # Read CSV
                csv_reader = csv.DictReader(file)
                headers = csv_reader.fieldnames
                
                if not headers:
                    self.add_error(f"No headers found in {filepath}")
                    return False
                
                # Validate headers
                self.validate_headers(headers, filepath)
                
                # Validate rows
                row_count = 0
                for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (header is row 1)
                    row_count += 1
                    self.validate_row(row, row_num, filepath)
                
                self.stats['files_processed'] += 1
                self.stats['total_rows'] += row_count
                
                print(f"✅ Processed {row_count} rows")
                return True
                
        except UnicodeDecodeError:
            self.add_error(f"File encoding error in {filepath}. Please ensure UTF-8 encoding.")
            return False
        except Exception as e:
            self.add_error(f"Error reading {filepath}: {str(e)}")
            return False
    
    def validate_headers(self, headers, filepath):
        """Validate CSV headers with flexible administrative division support."""
        headers_set = set(h.strip() for h in headers if h)
        
        # Check for administrative division column (any one of these is acceptable)
        admin_cols = REQUIRED_COLUMNS['administrative_division_columns']
        found_admin_cols = admin_cols.intersection(headers_set)
        
        # Many countries don't have administrative divisions due to small size
        # Check if this is a special case based on filename
        filename = os.path.basename(filepath).lower()
        no_admin_div_countries = {
            # Europe - many small countries without administrative divisions
            'germany.csv', 'switzerland.csv', 'finland.csv', 'france.csv', 
            'italy.csv', 'latvia.csv', 'luxembourg.csv', 'netherlands.csv', 
            'norway.csv', 'poland.csv', 'portugal.csv', 'serbia.csv', 
            'spain.csv', 'sweden.csv', 'ukraine.csv', 'unitedkingdom.csv',
            'austria.csv', 'belgium.csv', 'czechia.csv',
            # Africa
            'morocco.csv', 'southafrica.csv',
            # Oceania
            'newzealand.csv'
        }
        
        if not found_admin_cols and filename not in no_admin_div_countries:
            self.add_error(f"File must have at least one administrative division column in {filepath}: {', '.join(admin_cols)}")
        elif found_admin_cols and filename in no_admin_div_countries:
            self.add_warning(f"File {filepath} has administrative division columns but is in no-admin-div list: {', '.join(found_admin_cols)}")
        elif len(found_admin_cols) > 1:
            self.add_warning(f"File has multiple administrative division columns in {filepath}: {', '.join(found_admin_cols)}. Consider using just one.")
        
        # Check for other required columns
        missing_headers = REQUIRED_COLUMNS['always_required'] - headers_set
        if missing_headers:
            self.add_error(f"Missing required columns in {filepath}: {', '.join(missing_headers)}")
        
        # Check for extra/unexpected headers
        expected_headers = REQUIRED_COLUMNS['always_required'] | admin_cols
        extra_headers = headers_set - expected_headers
        if extra_headers:
            self.add_warning(f"Unexpected columns in {filepath}: {', '.join(extra_headers)}")
        
        # Log which administrative division column is being used
        if found_admin_cols:
            admin_col = list(found_admin_cols)[0]  # Use the first one found
            print(f"📍 Using '{admin_col}' as administrative division column in {filepath}")
        elif filename in no_admin_div_countries:
            print(f"📍 No administrative division column (expected for {filename})")
    
    def validate_row(self, row, row_num, filepath):
        """Validate a single data row."""
        location = f"{filepath}:row {row_num}"
        
        # Check for empty required fields
        required_fields = ['City', 'Location Name', 'Digital Projector']
        for field in required_fields:
            if field in row and not row[field].strip():
                self.add_error(f"Empty required field '{field}' at {location}")
        
        # Validate specific field formats
        if 'Height' in row:
            self.validate_dimension(row['Height'], 'Height', location)
        
        if 'Width' in row:
            self.validate_dimension(row['Width'], 'Width', location)
        
        if 'Screen Aspect Ratio (AR)' in row:
            self.validate_aspect_ratio(row['Screen Aspect Ratio (AR)'], location)
        
        # Validate against allowed values
        for field, valid_values in VALID_VALUES.items():
            if field in row and row[field].strip():
                if row[field].strip() not in valid_values:
                    self.add_warning(f"Unexpected value '{row[field]}' for '{field}' at {location}")
        
        # Business logic validations
        self.validate_business_rules(row, location)
    
    def validate_dimension(self, value, field_name, location):
        """Validate height/width dimensions."""
        if not value.strip():
            return  # Empty is handled elsewhere
        
        pattern = PATTERNS['height'] if field_name == 'Height' else PATTERNS['width']
        if not pattern.match(value.strip()):
            self.add_error(f"Invalid {field_name} format '{value}' at {location}. Expected format: '18.29 m'")
    
    def validate_aspect_ratio(self, value, location):
        """Validate aspect ratio format."""
        if not value.strip():
            return
        
        if not PATTERNS['aspect_ratio'].match(value.strip()):
            self.add_error(f"Invalid aspect ratio format '{value}' at {location}. Expected: '1.43:1' or 'Dome 1.43:1'")
    
    def validate_business_rules(self, row, location):
        """Validate business logic rules."""
        # If Film Projector is not "No", should have some film capability info
        film_proj = row.get('Film Projector', '').strip()
        if film_proj and film_proj != 'No' and film_proj in ['', 'Unknown', 'N/A']:
            self.add_warning(f"Film projector info unclear at {location}")
        
        # Dome theatres should have height of 0 or empty
        aspect_ratio = row.get('Screen Aspect Ratio (AR)', '').strip()
        height = row.get('Height', '').strip()
        if 'Dome' in aspect_ratio and height and not height.startswith('0'):
            self.add_warning(f"Dome theatre should have height 0 at {location}")
    
    def add_error(self, message):
        """Add an error message."""
        self.errors.append(f"❌ ERROR: {message}")
        self.stats['errors'] += 1
        print(f"❌ {message}")
    
    def add_warning(self, message):
        """Add a warning message."""
        self.warnings.append(f"⚠️  WARNING: {message}")
        self.stats['warnings'] += 1
        print(f"⚠️  {message}")
    
    def print_summary(self):
        """Print validation summary."""
        print("\n" + "="*60)
        print("📊 VALIDATION SUMMARY")
        print("="*60)
        print(f"Files processed: {self.stats['files_processed']}")
        print(f"Total rows: {self.stats['total_rows']}")
        print(f"Errors: {self.stats['errors']}")
        print(f"Warnings: {self.stats['warnings']}")
        
        if self.stats['errors'] == 0:
            print("\n✅ All validations passed!")
        else:
            print(f"\n❌ {self.stats['errors']} errors found - please fix before deployment")
        
        if self.stats['warnings'] > 0:
            print(f"⚠️  {self.stats['warnings']} warnings - review recommended")
        
        return self.stats['errors'] == 0

def main():
    parser = argparse.ArgumentParser(description='Validate IMAX theatre CSV data')
    parser.add_argument('--file', help='Validate specific file')
    parser.add_argument('--data-dir', default='data', help='Data directory path')
    args = parser.parse_args()
    
    validator = DataValidator()
    
    if args.file:
        # Validate single file
        success = validator.validate_file(args.file)
    else:
        # Validate all CSV files in data directory (including subdirectories)
        data_dir = Path(args.data_dir)
        if not data_dir.exists():
            print(f"❌ Data directory not found: {data_dir}")
            sys.exit(1)
        
        # Search recursively for CSV files
        csv_files = list(data_dir.rglob('*.csv'))
        if not csv_files:
            print(f"❌ No CSV files found in {data_dir} (searched recursively)")
            sys.exit(1)
        
        # Filter out readme.md files and other non-data files
        csv_files = [f for f in csv_files if f.name.lower() != 'readme.md']
        
        print(f"🔍 Found {len(csv_files)} CSV files to validate (searching subdirectories)")
        
        success = True
        for csv_file in sorted(csv_files):
            if not validator.validate_file(csv_file):
                success = False
    
    # Print summary
    overall_success = validator.print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if overall_success else 1)

if __name__ == '__main__':
    main()