# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a community-driven, open-source database of IMAX theatres worldwide with an interactive web interface. The project enables users to explore and analyze IMAX theatre data with advanced filtering capabilities, including projector types, screen formats, and geographic regions.

## Technology Stack

- **Frontend**: HTML5, CSS3, vanilla JavaScript (ES6+)
- **Libraries**: jQuery, DataTables.js, PapaParse (CSV parsing)
- **Data Storage**: CSV files in `data/` directory
- **Deployment**: Static website (GitHub Pages compatible)
- **Validation**: Python scripts for data quality assurance

## Development Commands

### Data Validation
```bash
# Validate all CSV files in data/ directory
python scripts/validate_data.py

# Validate specific file
python scripts/validate_data.py data/canada.csv

# Validate multiple specific files
python scripts/validate_data.py data/canada.csv data/unitedstates.csv
```

### Local Development Server
```bash
# Python 3
python -m http.server 8000

# Python 2  
python -m SimpleHTTPServer 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## Architecture & File Structure

### Core Files
- `index.html` - Main landing page with navigation cards and regional overview
- `database.html` - Global theatre database browser with filtering/search
- **Regional Pages**: `americas.html`, `asia.html`, `europe.html`, `africa.html`, `oceania.html`
- `data/` - CSV files organized by region in subdirectories (`americas/`, `asia/`, `europe/`, `africa/`, `oceania/`)
- `js/theatre-database.js` - Shared JavaScript module for database functionality
- `css/` - Organized stylesheets (`shared.css`, `database.css`, `index.css`)
- `scripts/validate_data.py` - Python data validation script

### Data Architecture
- **Flexible Administrative Divisions**: Supports Province/State/Region/District/Prefecture/Canton/Emirate columns
- **Standardized CSV Format**: Consistent column structure across all data files
- **Regional Organization**: Files organized in subdirectories by region (e.g., `americas/canada.csv`, `asia/japan.csv`)
- **50+ Country Coverage**: Comprehensive global dataset across all continents

### CSV Data Schema
Required columns:
- Administrative division (one of: Province, State, Region, District)
- City, Location Name
- Screen Aspect Ratio (AR) - formats: `1.43:1`, `1.90:1`, `Dome 1.43:1`
- Digital Projector, Maximum AR for digital projection
- Film Projector, Height, Width (with "m" suffix)
- Commercial films shown? (Yes/No/Limited)

### JavaScript Architecture
- **Shared Module**: `js/theatre-database.js` contains `TheatreDatabase` class used by all pages
- **Features**:
  - PapaParse for CSV parsing with error handling
  - Dynamic table rendering with filtering
  - **Cascading Filter System**: Region → Country/Area → Province/State → City hierarchy
  - Unit conversion (metric/imperial)
  - Export functionality (CSV with timestamps)
  - URL parameter handling and redirects for backward compatibility
  - Data caching for performance optimization
  - Advanced search across all fields

## Data Management

### Adding New Regional Data
1. Create new CSV file in appropriate `data/[region]/` subdirectory (e.g., `data/europe/unitedkingdom.csv`)
2. Update `window.CSV_FILES` array in `js/theatre-database.js` with new file configuration
3. Validate data using `python scripts/validate_data.py data/[region]/[country].csv`
4. Test locally on both global database and regional pages before committing

### Data Quality Standards
- All dimensions must include "m" suffix (e.g., "18.29 m")
- Administrative divisions should use standard abbreviations where appropriate
- Theatre names should include official branding and "&" or "and" as used by venue
- Unknown values: use "Unk" or "Unknown" consistently

### Validation Process
The Python validation script (`scripts/validate_data.py`) checks:
- Required column presence with flexible administrative division support
- Data format consistency (dimensions, aspect ratios)
- Duplicate theatre detection
- Reasonable dimension ranges
- Business logic validation

## Development Guidelines

### File Organization
- Static assets in root directory
- Regional data in `data/` with clear naming convention
- Documentation in markdown files
- Scripts in `scripts/` directory

### CSS Architecture
- Single-file CSS embedded in HTML for simplicity
- CSS custom properties for theming
- Responsive design with mobile-first approach
- Dark theme with IMAX-inspired blue accent colors

### Adding New Features
1. Maintain compatibility with existing CSV data structure
2. Test with sample data and real data files
3. Ensure mobile responsiveness
4. Validate with data validation script
5. Update documentation if schema changes

### Browser Compatibility
- Target modern browsers (Chrome/Edge 70+, Firefox 65+, Safari 12+)
- Graceful degradation for older browsers
- Mobile browser support essential

## Common Development Tasks

### Adding a New Country/Region
1. Create CSV file in appropriate region: `data/[region]/newcountry.csv`
2. Add entry to `window.CSV_FILES` array in `js/theatre-database.js`:
   ```javascript
   {
     filename: '[region]/newcountry.csv',
     region: 'Region Name',
     country: 'Country Name', 
     adminDivisionColumn: 'State' // or Province/Region/District/Prefecture/Canton/null
   }
   ```
3. Validate: `python scripts/validate_data.py data/[region]/newcountry.csv`

### Updating Theatre Data
1. Edit appropriate CSV file in `data/[region]/` subdirectory
2. Run validation: `python scripts/validate_data.py` (validates all files) or specific file
3. Test locally in both global database and relevant regional page
4. Commit changes

### Debugging Data Issues
1. Check browser console for JavaScript errors
2. Validate CSV files: `python scripts/validate_data.py`
3. Verify CSV encoding is UTF-8
4. Check for extra commas or malformed CSV structure

## Filter System Implementation

### Cascading Filter Logic
All database pages (global and regional) implement a hierarchical filter system that prevents invalid geographical combinations:

**Important**: The system uses "Country/Area" terminology instead of just "Country" to remain diplomatically neutral regarding territories with complex geopolitical status (e.g., Taiwan, Hong Kong, etc.).

**Filter Hierarchy**: 
- **Global Page**: Region → Country/Area → Province/State → City  
- **Regional Pages**: Country/Area → Province/State → City

**Key Functions**:
- `updateCountryFilter()` - Filters Country/Area options based on selected Region
- `updateAdminDivisionFilter()` - Filters Province/State options based on selected Region and Country/Area
- `updateCityFilter()` - Filters City options based on selected Region, Country/Area, and Province/State
- Dependent filters are automatically reset when parent filters change
- Reset button repopulates all filter options to show complete datasets

**Behavior**:
- Selecting "Americas" shows countries/areas like Canada and United States in Country/Area dropdown
- Selecting "Asia" shows countries/areas like China, Taiwan, Japan, etc. (using neutral "Country/Area" terminology)
- Selecting "Canada" shows only Canadian provinces in Province/State dropdown
- Selecting "United States" shows only US states in Province/State dropdown
- Selecting a province/state shows only cities from that administrative division
- Invalid combinations (e.g., Americas + Canada + Texas) are prevented by design

**Event Handling**:
- Region changes trigger reset of Country/Area, Province/State and City filters + repopulation
- Country/Area changes trigger reset of Province/State and City filters + repopulation
- Province/State changes trigger reset of City filter + repopulation
- All changes immediately update the theatre table results

## Current Project Status

### Database Coverage (as of January 2026)
- **51 countries/territories** across 5 continents
- **483 individual theatre records** validated and quality-assured
- **Regional organization**: Data files organized in `data/[region]/[country].csv` structure
- **Full validation**: All CSV files pass data quality validation via `scripts/validate_data.py`

### Completed Major Features
- ✅ **Regional Landing Pages**: Individual pages for Americas, Asia, Europe, Africa, Oceania
- ✅ **Shared JavaScript Architecture**: `js/theatre-database.js` module used across all pages
- ✅ **Advanced Filtering System**: Hierarchical region → country → province → city filters
- ✅ **Data Validation Pipeline**: Python script validates 51 countries with flexible administrative divisions
- ✅ **Mobile-Responsive Design**: Works across desktop and mobile browsers
- ✅ **Export Functionality**: CSV export with timestamps for user data downloads

### Architecture Highlights
- **Modular Design**: Shared CSS and JavaScript across multiple HTML pages
- **Flexible Data Schema**: Supports Province/State/Region/District/Prefecture/Canton/Emirate columns
- **Performance Optimized**: Data caching, lazy loading for regional pages
- **Quality Assured**: Comprehensive validation of dimensions, aspect ratios, business rules

## Project Roadmap & Tasks

### High Priority

#### 1. Performance Optimization
**Status**: ⚠️ NEEDS ATTENTION
**Description**: Basic optimizations complete, but loading indicators and pagination needed.

**Completed**:
- ✅ Added caching mechanism for loaded data in TheatreDatabase class
- ✅ Implemented lazy loading - regional pages only load relevant data
- ✅ Optimized CSS loading with separate stylesheet files

**Remaining Work**:
- ❌ Add loading progress indicator showing file loading status
- ❌ Consider pagination or virtual scrolling for very large datasets (US has 170+ theatres)
- ❌ Add loading spinners for CSV file loading
- ❌ Implement progressive data loading for better perceived performance

### Medium Priority

#### 2. User Experience Improvements
**Status**: Functional but could be enhanced
**Description**: Improve the overall user experience.

**Ideas to Explore**:
- Add theatre detail modal/popup with full information
- Implement "Favorite theatres" functionality with local storage
- Add "Find nearest theatre" with geolocation
- Export options: PDF, Excel formats
- Print-friendly view
- Mobile app-like experience with PWA features

#### 3. Data Enrichment
**Status**: Basic data available
**Description**: Add more detailed information about theatres.

**Potential Additions**:
- Theatre photos/images
- Seating capacity information
- Opening dates and renovation history
- Current movie showtimes integration
- Theatre contact information and booking links
- Accessibility information

### Low Priority / Future Enhancements

#### 4. Interactive Features
- Map view integration (Google Maps/OpenStreetMap)
- User reviews and ratings system
- Theatre comparison tool
- Statistics dashboard (charts, graphs)
- Social sharing features

#### 5. Technical Improvements
- Implement proper TypeScript for better code maintainability
- Add unit tests for filtering logic
- Set up automated deployment pipeline
- Add analytics tracking
- Implement proper error handling and user feedback
- SEO optimization for regional pages

#### 6. Content Management
- Admin interface for data updates
- User contribution system for theatre information
- Change tracking and audit logs
- Data backup and recovery system
- API endpoints for third-party access

## Recently Completed Tasks

### Regional Landing Pages (✅ COMPLETED)
- ✅ Created `americas.html`, `asia.html`, `europe.html`, `africa.html`, `oceania.html`
- ✅ Each page displays region-specific theatres with filtering and search
- ✅ Implemented regional navigation switcher and breadcrumbs
- ✅ Added region-specific statistics and country counts
- ✅ Full integration with shared JavaScript module

### Data Validation Script Updates (✅ COMPLETED)
- ✅ Update script to recursively search subdirectories (`data/americas/`, `data/asia/`, etc.)
- ✅ Handle countries like Germany and Switzerland that have no Province/State columns
- ✅ Add validation for new administrative division types (Prefecture, Canton, Emirate, Governorate)
- ✅ Test validation across all 51 data files in regional subdirectories (476 total records)
- ✅ Fixed data quality issues in Thailand and Vietnam CSV files

### Enhanced Filtering & Search (✅ COMPLETED)
- ✅ Screen size range filters ("Large >20m", "Standard 15-20m", "Small <15m")
- ✅ Aspect ratio grouping ("1.43:1 True IMAX", "1.90:1 IMAX Digital", "Dome")
- ✅ "Film-capable" vs "Digital-only" quick filters
- ✅ Hierarchical geographic filtering (Region → Country → Province → City)
- ✅ Real-time search across all data fields
- ✅ Professional terminology throughout