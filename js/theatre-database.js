/**
 * Shared Theatre Database Module
 * Core functionality for IMAX theatre database pages
 */

class TheatreDatabase {
    constructor(config = {}) {
        this.csvFiles = config.csvFiles || [];
        this.region = config.region || null;
        this.enableComparison = config.enableComparison || false;
        this.showRegionColumn = config.showRegionColumn || false;
        this.dataPath = config.dataPath || 'data/';
        
        // Global state
        this.allTheatres = [];
        this.filteredTheatres = [];
        this.currentUnit = 'metric';
        this.isRestoringFromUrl = false;
        
        // Administrative division column mapping
        this.ADMIN_DIVISION_COLUMNS = ['Province', 'State', 'Region', 'District', 'Prefecture', 'Canton', 'Country', 'Emirate'];
        
        // Cache for loaded data
        this.dataCache = new Map();

        this.sortState = {
            field: null,
            direction: null
        };
        this.sortConfigByField = {};
    }

    // Initialize the application
    async initialize() {
        this.handleUrlRedirects();
        this.setupSortableHeaders();
        await this.loadData();
        this.setupEventListeners();
        this.handleUrlParameters();
    }

    // Handle backward compatibility redirects
    handleUrlRedirects() {
        const params = new URLSearchParams(window.location.search);
        
        // Handle ?region= parameter redirects (existing logic)
        const region = params.get('region');
        if (region && window.location.pathname.endsWith('database.html')) {
            const regionPages = {
                'americas': 'americas.html',
                'europe': 'europe.html',
                'asia': 'asia.html',
                'africa': 'africa.html',
                'oceania': 'oceania.html'
            };
            
            if (regionPages[region.toLowerCase()]) {
                const newUrl = new URL(regionPages[region.toLowerCase()], window.location);
                // Preserve other parameters
                params.delete('region');
                newUrl.search = params.toString();
                window.location.replace(newUrl);
                return;
            }
        }
    }

    // Load data based on configuration
    async loadData() {
        try {
            this.showLoading();
            this.allTheatres = [];
            
            // Use cached data if available
            const cacheKey = this.region || 'global';
            if (this.dataCache.has(cacheKey)) {
                this.allTheatres = this.dataCache.get(cacheKey);
                this.initializeInterface();
                return;
            }
            
            const filesToLoad = this.region ? 
                this.csvFiles.filter(file => file.region === this.region) : 
                this.csvFiles;
            
            console.log(`Loading ${filesToLoad.length} files for ${this.region || 'global'} view...`);
            
            for (const csvConfig of filesToLoad) {
                try {
                    const response = await fetch(`${this.dataPath}${csvConfig.filename}`);
                    if (!response.ok) {
                        console.warn(`Could not load ${csvConfig.filename}: ${response.status}`);
                        continue;
                    }
                    
                    const csvText = await response.text();
                    await this.parseCSV(csvText, csvConfig);
                    
                } catch (error) {
                    console.error(`Error loading ${csvConfig.filename}:`, error);
                }
            }
            
            // Cache the loaded data
            this.dataCache.set(cacheKey, [...this.allTheatres]);
            
            console.log(`Total theatres loaded: ${this.allTheatres.length}`);
            this.initializeInterface();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError(`Failed to load theatre data: ${error.message}`);
            this.hideLoading();
        }
    }

    // Parse CSV data
    parseCSV(csvText, csvConfig) {
        return new Promise((resolve) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.warn(`Parsing errors in ${csvConfig.filename}:`, results.errors);
                    }
                    
                    const processedData = results.data.map(row => {
                        let adminDivValue = '';
                        
                        if (csvConfig.adminDivisionColumn && row[csvConfig.adminDivisionColumn]) {
                            adminDivValue = row[csvConfig.adminDivisionColumn];
                        } else if (csvConfig.adminDivisionColumn === null) {
                            adminDivValue = '';
                        } else {
                            for (const col of this.ADMIN_DIVISION_COLUMNS) {
                                if (row[col]) {
                                    adminDivValue = row[col];
                                    break;
                                }
                            }
                        }
                        
                        const processedRow = {
                            ...row,
                            Region: csvConfig.region,
                            Country: csvConfig.country,
                            'Administrative Division': adminDivValue
                        };
                        
                        return processedRow;
                    });
                    
                    this.allTheatres = this.allTheatres.concat(processedData);
                    console.log(`Loaded ${processedData.length} theatres from ${csvConfig.filename}`);
                    resolve();
                }
            });
        });
    }

    // Initialize interface after data loading
    initializeInterface() {
        this.populateFilters();
        this.filteredTheatres = [...this.allTheatres];
        this.renderTable();
        this.updateStats();
        this.hideLoading();
    }

    // Setup event listeners
    setupEventListeners() {
        // Region filter
        const regionSelect = document.getElementById('regionSelect');
        if (regionSelect) {
            regionSelect.addEventListener('change', () => {
                this.updateCountryFilter();
                this.updateAdminDivisionFilter();
                this.updateCityFilter();
                this.applyFilters();
            });
        }

        // Country filter
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            countrySelect.addEventListener('change', () => {
                this.updateAdminDivisionFilter();
                this.updateCityFilter();
                this.applyFilters();
            });
        }

        // Admin division filter
        const adminDivSelect = document.getElementById('adminDivSelect');
        if (adminDivSelect) {
            adminDivSelect.addEventListener('change', () => {
                this.updateCityFilter();
                this.applyFilters();
            });
        }

        // City filter
        const citySelect = document.getElementById('citySelect');
        if (citySelect) {
            citySelect.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Projector filter
        const projectorFilter = document.getElementById('projectorFilter');
        if (projectorFilter) {
            projectorFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.applyFilters();
            });
        }

        // Unit toggle
        const unitOptions = document.querySelectorAll('.unit-option');
        unitOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.toggleUnits(e.target.dataset.unit);
            });
        });

        // Enhanced filters
        const screenSizeFilter = document.getElementById('screenSizeFilter');
        if (screenSizeFilter) {
            screenSizeFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        const aspectRatioFilter = document.getElementById('aspectRatioFilter');
        if (aspectRatioFilter) {
            aspectRatioFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        const filmCapabilityFilter = document.getElementById('filmCapabilityFilter');
        if (filmCapabilityFilter) {
            filmCapabilityFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    setupSortableHeaders() {
        const headers = document.querySelectorAll('#theatreTable thead th[data-sort-field]');
        headers.forEach(header => {
            const button = header.querySelector('.sort-button');
            const field = header.dataset.sortField;
            if (!button || !field) {
                return;
            }

            this.sortConfigByField[field] = {
                type: header.dataset.sortType || 'text'
            };

            header.setAttribute('aria-sort', 'none');

            button.addEventListener('click', () => {
                this.toggleSort(field);
            });
        });

        this.updateSortHeaders();
    }

    toggleSort(field) {
        if (this.sortState.field !== field || this.sortState.direction === null) {
            this.sortState = { field, direction: 'descending' };
        } else if (this.sortState.direction === 'descending') {
            this.sortState = { field, direction: 'ascending' };
        } else {
            this.sortState = { field: null, direction: null };
        }

        this.updateSortHeaders();
        this.renderTable();
    }

    updateSortHeaders() {
        const headers = document.querySelectorAll('#theatreTable thead th[data-sort-field]');

        headers.forEach(header => {
            const button = header.querySelector('.sort-button');
            const isActive = header.dataset.sortField === this.sortState.field && this.sortState.direction;
            const ariaSort = isActive ? this.sortState.direction : 'none';
            const nextDirection = this.getNextSortDirection(header.dataset.sortField);
            const nextAction = nextDirection || 'unsorted';
            const label = header.querySelector('.sort-label')?.textContent.trim() || header.dataset.sortField;

            header.setAttribute('aria-sort', ariaSort);

            if (button) {
                const labelText = `Sort by ${label} (${nextAction} next)`;
                button.setAttribute('title', labelText);
                button.setAttribute('aria-label', labelText);
            }
        });
    }

    getNextSortDirection(field) {
        if (this.sortState.field !== field || this.sortState.direction === null) {
            return 'descending';
        }

        if (this.sortState.direction === 'descending') {
            return 'ascending';
        }

        return null;
    }

    // Populate filter dropdowns
    populateFilters() {
        if (this.region) {
            // Regional page - hide region filter, populate others
            const regionSelect = document.getElementById('regionSelect');
            if (regionSelect) {
                regionSelect.style.display = 'none';
                regionSelect.parentElement.style.display = 'none';
            }
            this.populateRegionalFilters();
        } else {
            // Global page - populate all filters including region
            this.populateGlobalFilters();
        }
        
        // Populate projector filter (not dependent on location)
        const projectors = [...new Set(this.allTheatres.map(t => t['Digital Projector']).filter(Boolean))].sort();
        this.populateSelect('projectorFilter', projectors, 'All Projectors');
    }

    // Populate filters for regional pages
    populateRegionalFilters() {
        // Countries in this region
        const countries = [...new Set(this.allTheatres.map(t => t.Country).filter(Boolean))].sort();
        this.populateSelect('countrySelect', countries, 'All Countries/Areas');
        
        // Admin divisions (initially all)
        const adminDivs = [...new Set(this.allTheatres.map(t => t['Administrative Division']).filter(Boolean))].sort();
        this.populateSelect('adminDivSelect', adminDivs, 'All Provinces/States');
        
        // Cities (initially all)  
        const cities = [...new Set(this.allTheatres.map(t => t.City).filter(Boolean))].sort();
        this.populateSelect('citySelect', cities, 'All Cities');
    }

    // Populate filters for global page
    populateGlobalFilters() {
        // Regions
        const regions = [...new Set(this.allTheatres.map(t => t.Region))].sort();
        this.populateSelect('regionSelect', regions, 'Select region', true);
        
        // Don't populate dependent filters initially - wait for region selection
        this.clearDependentFilters();
    }

    // Utility to populate a select element
    populateSelect(elementId, options, defaultText = '', addAll = false) {
        const selectElement = document.getElementById(elementId);
        if (!selectElement) return;
        
        const firstOption = selectElement.querySelector('option');
        selectElement.innerHTML = '';
        
        if (firstOption && defaultText) {
            firstOption.textContent = defaultText;
            selectElement.appendChild(firstOption);
        }
        
        if (addAll) {
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'All Regions';
            selectElement.appendChild(allOption);
        }
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    }

    // Clear dependent filters
    clearDependentFilters() {
        ['countrySelect', 'adminDivSelect', 'citySelect'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const firstOption = select.querySelector('option');
                select.innerHTML = '';
                if (firstOption) {
                    select.appendChild(firstOption);
                }
            }
        });
    }

    // Update cascading filters
    updateCountryFilter() {
        const selectedRegion = document.getElementById('regionSelect')?.value;
        let countries;
        
        if (selectedRegion && selectedRegion !== 'all') {
            countries = [...new Set(
                this.allTheatres
                    .filter(t => t.Region === selectedRegion)
                    .map(t => t.Country)
                    .filter(Boolean)
            )].sort();
        } else if (selectedRegion === 'all') {
            countries = [...new Set(this.allTheatres.map(t => t.Country).filter(Boolean))].sort();
        } else {
            this.clearDependentFilters();
            return;
        }
        
        this.populateSelect('countrySelect', countries, 'All Countries/Areas');
        
        // Clear dependent filters
        const adminSelect = document.getElementById('adminDivSelect');
        const citySelect = document.getElementById('citySelect');
        if (adminSelect) {
            const firstOption = adminSelect.querySelector('option');
            adminSelect.innerHTML = '';
            if (firstOption) adminSelect.appendChild(firstOption);
        }
        if (citySelect) {
            const firstOption = citySelect.querySelector('option');
            citySelect.innerHTML = '';
            if (firstOption) citySelect.appendChild(firstOption);
        }
    }

    updateAdminDivisionFilter() {
        const selectedRegion = document.getElementById('regionSelect')?.value;
        const selectedCountry = document.getElementById('countrySelect')?.value;
        
        let filteredTheatres = this.allTheatres;
        
        if (selectedRegion && selectedRegion !== 'all') {
            filteredTheatres = filteredTheatres.filter(t => t.Region === selectedRegion);
        }
        if (selectedCountry) {
            filteredTheatres = filteredTheatres.filter(t => t.Country === selectedCountry);
        }
        
        const adminDivs = [...new Set(
            filteredTheatres.map(t => t['Administrative Division']).filter(Boolean)
        )].sort();
        
        this.populateSelect('adminDivSelect', adminDivs, 'All Provinces/States');
        
        // Clear city filter
        const citySelect = document.getElementById('citySelect');
        if (citySelect) {
            const firstOption = citySelect.querySelector('option');
            citySelect.innerHTML = '';
            if (firstOption) citySelect.appendChild(firstOption);
        }
    }

    updateCityFilter() {
        const selectedRegion = document.getElementById('regionSelect')?.value;
        const selectedCountry = document.getElementById('countrySelect')?.value;
        const selectedAdminDiv = document.getElementById('adminDivSelect')?.value;
        
        let filteredTheatres = this.allTheatres;
        
        if (selectedRegion && selectedRegion !== 'all') {
            filteredTheatres = filteredTheatres.filter(t => t.Region === selectedRegion);
        }
        if (selectedCountry) {
            filteredTheatres = filteredTheatres.filter(t => t.Country === selectedCountry);
        }
        if (selectedAdminDiv) {
            filteredTheatres = filteredTheatres.filter(t => t['Administrative Division'] === selectedAdminDiv);
        }
        
        const cities = [...new Set(
            filteredTheatres.map(t => t.City).filter(Boolean)
        )].sort();
        
        this.populateSelect('citySelect', cities, 'All Cities');
    }

    // Apply all active filters
    applyFilters() {
        let filtered = [...this.allTheatres];
        
        // Region filter (for global view)
        const selectedRegion = document.getElementById('regionSelect')?.value;
        if (selectedRegion && selectedRegion !== 'all' && selectedRegion !== '') {
            filtered = filtered.filter(t => t.Region === selectedRegion);
        }
        
        // Country filter
        const selectedCountry = document.getElementById('countrySelect')?.value;
        if (selectedCountry) {
            filtered = filtered.filter(t => t.Country === selectedCountry);
        }
        
        // Admin division filter
        const selectedAdminDiv = document.getElementById('adminDivSelect')?.value;
        if (selectedAdminDiv) {
            filtered = filtered.filter(t => t['Administrative Division'] === selectedAdminDiv);
        }
        
        // City filter
        const selectedCity = document.getElementById('citySelect')?.value;
        if (selectedCity) {
            filtered = filtered.filter(t => t.City === selectedCity);
        }
        
        // Projector filter
        const selectedProjector = document.getElementById('projectorFilter')?.value;
        if (selectedProjector) {
            filtered = filtered.filter(t => t['Digital Projector'] === selectedProjector);
        }
        
        // Search filter
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(t => 
                Object.values(t).some(value => 
                    value && value.toString().toLowerCase().includes(searchTerm)
                )
            );
        }
        
        // Screen size filter
        const selectedScreenSize = document.getElementById('screenSizeFilter')?.value;
        if (selectedScreenSize) {
            filtered = filtered.filter(t => this.matchesScreenSize(t, selectedScreenSize));
        }
        
        // Aspect ratio filter
        const selectedAspectRatio = document.getElementById('aspectRatioFilter')?.value;
        if (selectedAspectRatio) {
            filtered = filtered.filter(t => this.matchesAspectRatio(t, selectedAspectRatio));
        }
        
        // Film capability filter
        const selectedFilmCapability = document.getElementById('filmCapabilityFilter')?.value;
        if (selectedFilmCapability) {
            filtered = filtered.filter(t => this.matchesFilmCapability(t, selectedFilmCapability));
        }
        
        this.filteredTheatres = filtered;
        this.renderTable();
        this.updateStats();
        this.updateUrl();
    }

    // Persist the current filter state into the page URL (shareable / bookmarkable)
    updateUrl() {
        if (this.isRestoringFromUrl) return;

        const params = new URLSearchParams();
        const setParam = (key, value) => {
            if (value !== undefined && value !== null && value !== '') {
                params.set(key, value);
            }
        };

        // Region filter is only present/visible on the global (database.html) page
        const regionSelect = document.getElementById('regionSelect');
        if (regionSelect && regionSelect.parentElement.style.display !== 'none') {
            setParam('region', regionSelect.value);
        }

        setParam('country', document.getElementById('countrySelect')?.value);
        setParam('province', document.getElementById('adminDivSelect')?.value);
        setParam('city', document.getElementById('citySelect')?.value);
        setParam('projector', document.getElementById('projectorFilter')?.value);
        setParam('size', document.getElementById('screenSizeFilter')?.value);
        setParam('format', document.getElementById('aspectRatioFilter')?.value);
        setParam('film', document.getElementById('filmCapabilityFilter')?.value);
        setParam('search', document.getElementById('searchInput')?.value);

        if (this.currentUnit && this.currentUnit !== 'metric') {
            setParam('units', this.currentUnit);
        }

        const query = params.toString();
        const newUrl = `${window.location.pathname}${query ? '?' + query : ''}${window.location.hash}`;
        window.history.replaceState(null, '', newUrl);
    }

    // Enhanced filter helper methods
    matchesScreenSize(theatre, sizeFilter) {
        const height = parseFloat(theatre.Height);
        if (isNaN(height) || height === 0) return false;
        
        switch (sizeFilter) {
            case 'large': return height >= 16;
            case 'standard': return height >= 15 && height < 16;
            case 'small': return height < 15;
            default: return true;
        }
    }
    
    matchesAspectRatio(theatre, ratioFilter) {
        const aspectRatio = theatre['Screen Aspect Ratio (AR)'];
        if (!aspectRatio) return false;
        
        switch (ratioFilter) {
            case 'true-imax': return aspectRatio.includes('1.43:1');
            case 'imax-digital': return aspectRatio.includes('1.90:1');
            case 'dome': return aspectRatio.toLowerCase().includes('dome');
            default: return true;
        }
    }
    
    matchesFilmCapability(theatre, capabilityFilter) {
        const filmProjector = theatre['Film Projector'];
        if (!filmProjector) return false;
        
        switch (capabilityFilter) {
            case 'film-capable': return filmProjector !== 'No' && filmProjector !== 'N/A';
            case 'digital-only': return filmProjector === 'No' || filmProjector === 'N/A';
            default: return true;
        }
    }

    // Render the table
    renderTable() {
        const tableBody = document.getElementById('theatreTableBody');
        if (!tableBody) return;

        this.updateSortHeaders();
        
        if (this.filteredTheatres.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 2rem;">No theatres found matching current filters</td></tr>';
            this.hideTable();
            return;
        }
        
        const displayTheatres = this.getDisplayTheatres();

        const rows = displayTheatres.map(theatre => {
            const height = this.convertDimension(theatre.Height);
            const width = this.convertDimension(theatre.Width);
            
            return `
                <tr>
                    ${this.showRegionColumn ? `<td>${theatre.Region}</td>` : ''}
                    <td>${theatre.Country}</td>
                    <td>${theatre['Administrative Division'] || ''}</td>
                    <td>${theatre.City}</td>
                    <td>${theatre['Location Name']}</td>
                    <td>${theatre['Screen Aspect Ratio (AR)']}</td>
                    <td>${theatre['Digital Projector']}</td>
                    <td>${theatre['Maximum AR for digital projection']}</td>
                    <td>${theatre['Film Projector']}</td>
                    <td>${height}</td>
                    <td>${width}</td>
                    <td>${theatre['Commercial films shown?']}</td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = rows;
        this.showTable();
    }

    getDisplayTheatres() {
        if (!this.sortState.field || !this.sortState.direction) {
            return [...this.filteredTheatres];
        }

        const { field, direction } = this.sortState;
        const multiplier = direction === 'ascending' ? 1 : -1;

        return this.filteredTheatres
            .map((theatre, index) => ({ theatre, index }))
            .sort((a, b) => {
                const comparison = this.compareValues(
                    a.theatre[field],
                    b.theatre[field],
                    this.sortConfigByField[field]?.type || 'text'
                );

                if (comparison !== 0) {
                    return comparison * multiplier;
                }

                return a.index - b.index;
            })
            .map(item => item.theatre);
    }

    compareValues(valueA, valueB, type) {
        const normalizedA = this.normalizeSortValue(valueA, type);
        const normalizedB = this.normalizeSortValue(valueB, type);

        if (normalizedA === null && normalizedB === null) {
            return 0;
        }

        if (normalizedA === null) {
            return 1;
        }

        if (normalizedB === null) {
            return -1;
        }

        if (typeof normalizedA === 'number' && typeof normalizedB === 'number') {
            return normalizedA - normalizedB;
        }

        return String(normalizedA).localeCompare(String(normalizedB), undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    }

    normalizeSortValue(value, type) {
        if (value === null || value === undefined) {
            return null;
        }

        const text = value.toString().trim();
        if (!text) {
            return null;
        }

        switch (type) {
            case 'dimension': {
                const match = text.match(/-?\d+(?:\.\d+)?/);
                return match ? parseFloat(match[0]) : null;
            }
            case 'aspect-ratio': {
                const match = text.match(/-?\d+(?:\.\d+)?(?=:1)/);
                return match ? parseFloat(match[0]) : text.toLowerCase();
            }
            default:
                return text.toLowerCase();
        }
    }

    // Convert dimensions based on current unit
    convertDimension(dimension) {
        if (!dimension || !dimension.toString().includes('m')) return dimension;
        
        const value = parseFloat(dimension);
        if (isNaN(value)) return dimension;
        
        if (this.currentUnit === 'imperial') {
            const feet = (value * 3.28084).toFixed(1);
            return `${feet} ft`;
        }
        return dimension;
    }

    // Toggle units
    toggleUnits(unit) {
        this.currentUnit = unit;
        
        // Update UI
        document.querySelectorAll('.unit-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-unit="${unit}"]`).classList.add('active');

        this.renderTable();
        this.updateUrl();
    }

    // Reset all filters
    resetFilters() {
        [
            'regionSelect', 'countrySelect', 'adminDivSelect', 'citySelect',
            'projectorFilter', 'searchInput', 'screenSizeFilter',
            'aspectRatioFilter', 'filmCapabilityFilter'
        ].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        if (this.region) {
            this.populateRegionalFilters();
            this.filteredTheatres = [...this.allTheatres];
        } else {
            this.populateGlobalFilters();
            this.filteredTheatres = [...this.allTheatres];
        }
        
        this.renderTable();
        this.updateStats();
        this.updateUrl();
    }

    // Update statistics
    updateStats() {
        const totalElement = document.getElementById('totalTheatres');
        const regionsElement = document.getElementById('totalRegions');
        const citiesElement = document.getElementById('totalCities');
        const projectorsElement = document.getElementById('projectorTypes');
        
        if (totalElement) totalElement.textContent = this.filteredTheatres.length;
        
        if (regionsElement) {
            const regions = new Set(this.filteredTheatres.map(t => t.Country));
            regionsElement.textContent = regions.size;
        }
        
        if (citiesElement) {
            const cities = new Set(this.filteredTheatres.map(t => t.City));
            citiesElement.textContent = cities.size;
        }
        
        if (projectorsElement) {
            const projectors = new Set(this.filteredTheatres.map(t => t['Digital Projector']).filter(Boolean));
            projectorsElement.textContent = projectors.size;
        }
        
        // Show stats container
        const statsContainer = document.getElementById('statsContainer');
        if (statsContainer) {
            statsContainer.style.display = this.filteredTheatres.length > 0 ? 'grid' : 'none';
        }
    }

    // Export data
    exportData() {
        if (this.filteredTheatres.length === 0) {
            alert('No data to export. Please apply some filters first.');
            return;
        }
        
        const csv = Papa.unparse(this.getDisplayTheatres());
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imax-theatres-${this.region || 'global'}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Restore filter state from URL parameters on load
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        if ([...urlParams.keys()].length === 0) {
            return;
        }

        // Avoid rewriting the URL while we programmatically set filter values
        this.isRestoringFromUrl = true;

        // Units toggle (metric / imperial)
        const units = urlParams.get('units');
        if (units === 'imperial' || units === 'metric') {
            this.toggleUnits(units);
        }

        // Region filter (global page only; cascades into country options)
        const region = urlParams.get('region');
        const regionSelect = document.getElementById('regionSelect');
        if (region && regionSelect && regionSelect.parentElement.style.display !== 'none') {
            const regionValue = this.matchOptionValue(regionSelect, region);
            if (regionValue !== null) {
                regionSelect.value = regionValue;
                this.updateCountryFilter();
            }
        }

        // Country filter (cascades into province/state options)
        const country = urlParams.get('country');
        if (country) {
            const countrySelect = document.getElementById('countrySelect');
            if (countrySelect) {
                const countryValue = this.matchOptionValue(countrySelect, country, this.normalizeCountry(country));
                if (countryValue !== null) {
                    countrySelect.value = countryValue;
                    this.updateAdminDivisionFilter();
                }
            }
        }

        // Province / State filter (cascades into city options)
        const province = urlParams.get('province') || urlParams.get('state');
        if (province) {
            const adminSelect = document.getElementById('adminDivSelect');
            if (adminSelect) {
                const adminValue = this.matchOptionValue(adminSelect, province);
                if (adminValue !== null) {
                    adminSelect.value = adminValue;
                    this.updateCityFilter();
                }
            }
        }

        // City filter
        const city = urlParams.get('city');
        if (city) {
            const citySelect = document.getElementById('citySelect');
            if (citySelect) {
                const cityValue = this.matchOptionValue(citySelect, city);
                if (cityValue !== null) {
                    citySelect.value = cityValue;
                }
            }
        }

        // Non-cascading value filters
        this.restoreSelectValue('projectorFilter', urlParams.get('projector'));
        this.restoreSelectValue('screenSizeFilter', urlParams.get('size'));
        this.restoreSelectValue('aspectRatioFilter', urlParams.get('format'));
        this.restoreSelectValue('filmCapabilityFilter', urlParams.get('film'));

        // Free-text search
        const search = urlParams.get('search');
        if (search) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = search;
            }
        }

        this.isRestoringFromUrl = false;
        this.applyFilters();
    }

    // Find the option value in a select that best matches a raw URL value.
    // Tries an exact (case-insensitive) match first, then a partial match,
    // so both canonical values and short/slug-style values keep working.
    matchOptionValue(selectElement, rawValue, preferred = null) {
        if (!selectElement || !rawValue) {
            return null;
        }

        const candidates = [preferred, rawValue]
            .filter(Boolean)
            .map(value => value.toString().toLowerCase());
        const options = Array.from(selectElement.options).filter(option => option.value);

        for (const candidate of candidates) {
            const exact = options.find(option => option.value.toLowerCase() === candidate);
            if (exact) {
                return exact.value;
            }
        }

        for (const candidate of candidates) {
            const partial = options.find(option => option.value.toLowerCase().includes(candidate));
            if (partial) {
                return partial.value;
            }
        }

        return null;
    }

    // Restore a select whose values are fixed/technical (not location-dependent)
    restoreSelectValue(elementId, value) {
        if (!value) {
            return;
        }
        const select = document.getElementById(elementId);
        if (!select) {
            return;
        }
        const matched = this.matchOptionValue(select, value);
        if (matched !== null) {
            select.value = matched;
        }
    }

    // Backward-compatible mapping for legacy compact country slugs
    normalizeCountry(country) {
        const countryMap = {
            'canada': 'Canada',
            'unitedstates': 'United States',
            'unitedkingdom': 'United Kingdom'
        };
        return countryMap[country.toLowerCase()] || null;
    }

    // UI helper methods
    showLoading() {
        const loadingDiv = document.getElementById('loadingDiv');
        if (loadingDiv) loadingDiv.style.display = 'block';
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loadingDiv');
        if (loadingDiv) loadingDiv.style.display = 'none';
    }

    showTable() {
        const tableContainer = document.getElementById('tableContainer');
        const tableText = document.getElementById('tableText');
        if (tableContainer) tableContainer.style.display = 'block';
        if (tableText) tableText.style.display = 'block';
    }

    hideTable() {
        const tableContainer = document.getElementById('tableContainer');
        const tableText = document.getElementById('tableText');
        if (tableContainer) tableContainer.style.display = 'none';
        if (tableText) tableText.style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorDiv');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
}

// Global CSV files configuration
window.CSV_FILES = [
    // Americas
    { filename: 'americas/aruba.csv', region: 'Americas', country: 'Aruba', adminDivisionColumn: 'Region' },
    { filename: 'americas/bahamas.csv', region: 'Americas', country: 'Bahamas', adminDivisionColumn: 'Region' },
    { filename: 'americas/brazil.csv', region: 'Americas', country: 'Brazil', adminDivisionColumn: 'State' },
    { filename: 'americas/canada.csv', region: 'Americas', country: 'Canada', adminDivisionColumn: 'Province' },
    { filename: 'americas/colombia.csv', region: 'Americas', country: 'Colombia', adminDivisionColumn: 'Region' },
    { filename: 'americas/curacao.csv', region: 'Americas', country: 'Curaçao', adminDivisionColumn: 'Region' },
    { filename: 'americas/ecuador.csv', region: 'Americas', country: 'Ecuador', adminDivisionColumn: 'Region' },
    { filename: 'americas/mexico.csv', region: 'Americas', country: 'Mexico', adminDivisionColumn: 'State' },
    { filename: 'americas/peru.csv', region: 'Americas', country: 'Peru', adminDivisionColumn: 'Region' },
    { filename: 'americas/unitedstates.csv', region: 'Americas', country: 'United States', adminDivisionColumn: 'State' },
    
    // Asia
    { filename: 'asia/bahrain.csv', region: 'Asia', country: 'Bahrain', adminDivisionColumn: 'Region' },
    { filename: 'asia/china.csv', region: 'Asia', country: 'China', adminDivisionColumn: 'Province' },
    { filename: 'asia/hongkong.csv', region: 'Asia', country: 'Hong Kong', adminDivisionColumn: 'Region' },
    { filename: 'asia/india.csv', region: 'Asia', country: 'India', adminDivisionColumn: 'State' },
    { filename: 'asia/indonesia.csv', region: 'Asia', country: 'Indonesia', adminDivisionColumn: 'Province' },
    { filename: 'asia/japan.csv', region: 'Asia', country: 'Japan', adminDivisionColumn: 'Province' },
    { filename: 'asia/kuwait.csv', region: 'Asia', country: 'Kuwait', adminDivisionColumn: 'Region' },
    { filename: 'asia/malaysia.csv', region: 'Asia', country: 'Malaysia', adminDivisionColumn: 'State' },
    { filename: 'asia/oman.csv', region: 'Asia', country: 'Oman', adminDivisionColumn: 'Region' },
    { filename: 'asia/philippines.csv', region: 'Asia', country: 'Philippines', adminDivisionColumn: 'Region' },
    { filename: 'asia/qatar.csv', region: 'Asia', country: 'Qatar', adminDivisionColumn: 'Region' },
    { filename: 'asia/saudiarabia.csv', region: 'Asia', country: 'Saudi Arabia', adminDivisionColumn: 'Region' },
    { filename: 'asia/singapore.csv', region: 'Asia', country: 'Singapore', adminDivisionColumn: 'Region' },
    { filename: 'asia/southkorea.csv', region: 'Asia', country: 'South Korea', adminDivisionColumn: 'Province' },
    { filename: 'asia/taiwan.csv', region: 'Asia', country: 'Taiwan', adminDivisionColumn: 'Province' },
    { filename: 'asia/thailand.csv', region: 'Asia', country: 'Thailand', adminDivisionColumn: 'Region' },
    { filename: 'asia/unitedarabemirates.csv', region: 'Asia', country: 'United Arab Emirates', adminDivisionColumn: 'Province' },
    { filename: 'asia/vietnam.csv', region: 'Asia', country: 'Vietnam', adminDivisionColumn: 'Region' },
    
    // Europe
    { filename: 'europe/austria.csv', region: 'Europe', country: 'Austria', adminDivisionColumn: 'State' },
    { filename: 'europe/belgium.csv', region: 'Europe', country: 'Belgium', adminDivisionColumn: 'Region' },
    { filename: 'europe/czechia.csv', region: 'Europe', country: 'Czechia', adminDivisionColumn: 'Region' },
    { filename: 'europe/finland.csv', region: 'Europe', country: 'Finland', adminDivisionColumn: 'Region' },
    { filename: 'europe/france.csv', region: 'Europe', country: 'France', adminDivisionColumn: 'Region' },
    { filename: 'europe/germany.csv', region: 'Europe', country: 'Germany', adminDivisionColumn: null },
    { filename: 'europe/italy.csv', region: 'Europe', country: 'Italy', adminDivisionColumn: 'Region' },
    { filename: 'europe/latvia.csv', region: 'Europe', country: 'Latvia', adminDivisionColumn: 'Region' },
    { filename: 'europe/luxembourg.csv', region: 'Europe', country: 'Luxembourg', adminDivisionColumn: 'Region' },
    { filename: 'europe/netherlands.csv', region: 'Europe', country: 'Netherlands', adminDivisionColumn: 'Province' },
    { filename: 'europe/norway.csv', region: 'Europe', country: 'Norway', adminDivisionColumn: 'Region' },
    { filename: 'europe/poland.csv', region: 'Europe', country: 'Poland', adminDivisionColumn: 'Region' },
    { filename: 'europe/portugal.csv', region: 'Europe', country: 'Portugal', adminDivisionColumn: 'Region' },
    { filename: 'europe/serbia.csv', region: 'Europe', country: 'Serbia', adminDivisionColumn: 'Region' },
    { filename: 'europe/spain.csv', region: 'Europe', country: 'Spain', adminDivisionColumn: 'Region' },
    { filename: 'europe/sweden.csv', region: 'Europe', country: 'Sweden', adminDivisionColumn: 'Region' },
    { filename: 'europe/switzerland.csv', region: 'Europe', country: 'Switzerland', adminDivisionColumn: null },
    { filename: 'europe/ukraine.csv', region: 'Europe', country: 'Ukraine', adminDivisionColumn: 'Region' },
    { filename: 'europe/unitedkingdom.csv', region: 'Europe', country: 'United Kingdom', adminDivisionColumn: 'Country' },
    
    // Africa
    { filename: 'africa/morocco.csv', region: 'Africa', country: 'Morocco', adminDivisionColumn: 'Region' },
    { filename: 'africa/southafrica.csv', region: 'Africa', country: 'South Africa', adminDivisionColumn: 'Province' },
    
    // Oceania
    { filename: 'oceania/australia.csv', region: 'Oceania', country: 'Australia', adminDivisionColumn: 'State' },
    { filename: 'oceania/newzealand.csv', region: 'Oceania', country: 'New Zealand', adminDivisionColumn: 'Region' }
];
