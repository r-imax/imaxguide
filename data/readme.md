# 📊 IMAX Theatre Database - Data Directory

This directory contains CSV files with IMAX theatre data organized by region/country.

## 📁 File Naming Convention

Use lowercase names with no spaces:
- ✅ `canada.csv`
- ✅ `unitedstates.csv` 
- ✅ `unitedkingdom.csv`
- ❌ `Canada.csv`
- ❌ `United States.csv`

## 📋 Required CSV Format

Each CSV file must include these columns:

### Administrative Division Column (One Required)
Choose the most appropriate for your region:
- `Province` - For Canada, etc.
- `State` - For United States, Australia, etc.
- `Region` - For United Kingdom, etc.
- `District` - For other administrative divisions

### Always Required Columns
- `City` - Theatre city/town
- `Location Name` - Full theatre name
- `Screen Aspect Ratio (AR)` - Format: `1.43:1`, `1.90:1`, `Dome 1.43:1`
- `Digital Projector` - Equipment type
- `Maximum AR for digital projection` - Max digital format
- `Film Projector` - Film capability or "No"
- `Height` - Screen height with "m" suffix (e.g., `18.29 m`)
- `Width` - Screen width with "m" suffix (e.g., `25.91 m`)
- `Commercial films shown?` - `Yes`, `No`, or `Limited`

## ✅ Example CSV Structure

```csv
Province,City,Location Name,Screen Aspect Ratio (AR),Digital Projector,Maximum AR for digital projection,Film Projector,Height,Width,Commercial films shown?
Ontario,Toronto,Scotiabank Toronto IMAX,1.43:1,IMAX GT Laser,1.43:1,IMAX SR 15/70 mm,18.29 m,25.91 m,Yes
British Columbia,Vancouver,Science World IMAX,Dome 1.43:1,IMAX CoLa,1.90:1,IMAX SR 15/70 mm,18.00 m,18.00 m,No
```

## 🔧 Data Validation

Before adding new files, run the validation script:

```bash
# Validate all CSV files
python scripts/validate_data.py

# Validate specific file
python scripts/validate_data.py data/yournewfile.csv
```

## 📊 Data Quality Guidelines

### Administrative Divisions
- Use standard abbreviations where appropriate (e.g., `CA` for California)
- Be consistent within each file
- Use official names/codes when possible

### Theatre Names
- Include full official name
- Include "&" or "and" as used by the theatre
- Include "IMAX" in the name if it's part of the official branding

### Projector Types
Current known types include:
- `IMAX GT Laser` - Latest 4K laser projection
- `IMAX Laser XT` - Enhanced laser system
- `IMAX CoLa` - Commercial laser
- `IMAX Digital` - Legacy xenon digital
- `IMAX SR 15/70 mm` - Film projection
- `IMAX GT3D 15/70 mm` - 3D film projection
- `No` - For film projector field when not available

### Screen Dimensions
- Always include "m" suffix for meters
- Use decimal format: `18.29 m` not `18.3 m`
- For dome screens, height and width may be the same
- Use `0 m` if dimension is unknown

### Aspect Ratios
- Standard formats: `1.43:1`, `1.90:1`
- Dome format: `Dome 1.43:1`
- Unknown: `Unk` or `Unknown`

## 🌍 Regional Organization

### Current Files
- `canada.csv` - Canadian IMAX theatres
- `unitedstates.csv` - US IMAX theatres

### Planned Files
- `unitedkingdom.csv` - UK and Ireland
- `australia.csv` - Australia and New Zealand  
- `germany.csv` - Germany, Austria, Switzerland
- `france.csv` - France and French territories
- `japan.csv` - Japan
- `china.csv` - China and Hong Kong
- `southkorea.csv` - South Korea

## 🤝 Contributing Data

1. **Research** theatre specifications from official sources
2. **Format** data according to this specification
3. **Validate** using the validation script
4. **Test** locally before submitting
5. **Submit** via pull request with detailed sources

## 📚 Data Sources

### Reliable Sources
- Official IMAX theatre websites
- Cinema chain websites
- IMAX Corporation press releases
- Theatre technical specifications
- Industry trade publications

### Avoid
- User-generated content without verification
- Outdated information
- Unofficial fan sites without sources
- Wikipedia (use their sources instead)

## 🔍 Data Verification

When adding new data:
- Cross-reference multiple sources
- Verify technical specifications
- Check for recent renovations or changes
- Confirm current operational status
- Note any limitations or special conditions

## 📞 Help & Support

If you need help with data formatting:
- Check existing CSV files for examples
- Run validation script for specific error messages
- Open an issue on GitHub with questions
- Contact maintainers for guidance