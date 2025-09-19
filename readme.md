# IMAX Theatre Database

A comprehensive, open-source database of IMAX theatres worldwide with an interactive web interface for exploring and analyzing theatre data.

## 🎬 Features

- **Enhanced Filtering System**: Screen size (Large >20m, Standard 15-20m, Small <15m), format (1.43:1 True IMAX, 1.90:1 IMAX Digital, Dome), and film capability filters
- **Regional Pages**: Dedicated pages for Americas, Europe, Asia, Africa, and Oceania with optimized performance
- **Interactive Table**: Sort, filter, and search through IMAX theatre data with real-time results
- **Hierarchical Filtering**: Cascading region → country → province/state → city filter system
- **Equipment Filters**: Filter by projector type, screen format, and technical capabilities
- **Export Functionality**: Download filtered data as CSV with timestamps
- **Responsive Design**: Mobile-first design that works perfectly on all devices
- **Data Quality Assured**: Comprehensive validation pipeline ensures data accuracy
- **Open Source**: Community-driven data collection and maintenance

## 📊 Current Data

- **51 Countries/Territories** across 5 continents
- **476+ Individual Theatre Records** with comprehensive details
- **Americas**: 10 countries (US, Canada, Mexico, Brazil, Colombia, etc.)
- **Asia**: 18 countries/territories (China, Japan, India, UAE, etc.)
- **Europe**: 19 countries (Germany, UK, France, Italy, etc.)
- **Oceania**: 2 countries (Australia, New Zealand)
- **Africa**: 2 countries (South Africa, Morocco)

## 🚀 Quick Start (Local Development)

### Prerequisites
- A local web server (Python, Node.js, or any HTTP server)
- Python 3.x (for data validation)

### Setup

1. **Clone this repository**
```bash
git clone https://github.com/your-username/imax-theatre-database.git
cd imax-theatre-database
```

2. **Data is already included** - 51 countries with 476+ theatres in `data/` directory organized by region:
```
data/
├── americas/
│   ├── canada.csv
│   ├── unitedstates.csv
│   └── [8 more countries]
├── asia/
│   ├── china.csv
│   ├── japan.csv
│   └── [16 more countries]
└── [europe, africa, oceania]/
```

3. **Validate data quality** (optional)
```bash
python scripts/validate_data.py
```

4. **Start a local web server**

**Option A: Python**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B: Node.js**
```bash
npx serve .
```

**Option C: PHP**
```bash
php -S localhost:8000
```

4. **Open your browser**
Navigate to `http://localhost:8000`

## 📁 Project Structure

```
imax-theatre-data/
├── index.html              # Main website
├── data/                   # CSV data files
│   ├── Canada.csv
│   ├── United States.csv
│   └── README.md
├── docs/                   # Documentation
│   └── DATA_FORMAT.md
├── scripts/                # Utility scripts
│   ├── validate_data.py
│   └── process_csvs.py
├── .github/                # GitHub Actions
│   └── workflows/
│       └── deploy.yml
├── README.md
├── .gitignore
└── LICENSE
```

## 📝 Data Format

CSV files should include these columns:

| Column | Description | Example |
|--------|-------------|---------|
| Province/State/Region/District | Administrative division | `Ontario`, `CA`, `England`, `NSW` |
| City | City name | `Toronto`, `Los Angeles`, `London` |
| Location Name | Theatre name | `Scotiabank Toronto & IMAX` |
| Screen Aspect Ratio (AR) | Screen format | `1.43:1`, `1.90:1`, `Dome 1.43:1` |
| Digital Projector | Digital projector type | `IMAX GT Laser`, `IMAX CoLa` |
| Maximum AR for digital projection | Max digital aspect ratio | `1.43:1`, `1.90:1` |
| Film Projector | Film projector info | `IMAX SR 15/70 mm`, `No` |
| Height | Screen height | `18.29 m` |
| Width | Screen width | `25.91 m` |
| Commercial films shown? | Commercial operation | `Yes`, `No`, `Limited` |

**Note**: The administrative division column can be named `Province`, `State`, `Region`, or `District` depending on your country's system. The website automatically handles all variants.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Adding New Data
1. Fork this repository
2. Add your CSV file to the `data/` directory
3. Update the `csvFiles` array in `index.html` to include your region
4. Submit a pull request

### Reporting Issues
- Theatre information is incorrect
- Missing theatres in your area
- Website bugs or feature requests

### Code Contributions
- Improvements to the web interface
- Data validation scripts
- Documentation updates

## 🔧 Technical Details

### Built With
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Libraries**: jQuery, DataTables.js, PapaParse
- **Deployment**: GitHub Pages
- **CI/CD**: GitHub Actions

### Browser Support
- Chrome/Edge 70+
- Firefox 65+
- Safari 12+
- Mobile browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- IMAX Corporation for their theatre technology
- Theatre operators and cinema chains for location data
- Contributors who help maintain and expand this database
- Open source community for tools and libraries

## 📞 Contact

- **Issues**: [GitHub Issues](https://github.com/your-username/imax-theatre-data/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/imax-theatre-data/discussions)
- **Email**: your-email@example.com

---

**Note**: This is an unofficial database maintained by volunteers. Theatre information may change frequently. Please verify details with individual theatres before visiting.