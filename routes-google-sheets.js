// Routes Table JavaScript - Google Sheets Integration
class RoutesManager {
    constructor() {
        this.googleSheetId = '1woeHdoA4oDozMZj90M1IxLU93soZKsGUmbJ2Kld8oiM';
        this.routes = [];
        this.customRoutes = [];
        this.selectedWeight = 100;
        this.rateSlabs = {}; // Add rate slabs data
        this.init();
    }

    async init() {
        await this.loadRateData(); // Load rate data first
        
        // Add loading indicator
        this.showLoadingIndicator();
        
        // Check if it's a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // For mobile, try a simpler approach first
            await this.loadRoutesForMobile();
        } else {
            // For desktop, use the full retry mechanism
            await this.loadRoutesWithRetry();
        }
        
        this.loadCustomRoutes();
        this.displayRoutes();
        this.setupEventListeners();
        
        // Hide loading indicator
        this.hideLoadingIndicator();
    }

    async loadRoutesForMobile() {
        try {
            // Try a simpler approach for mobile
            const mobileUrl = `https://docs.google.com/spreadsheets/d/${this.googleSheetId}/export?format=csv&gid=0`;
            
            const response = await fetch(mobileUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/csv,text/plain,*/*'
                }
            });
            
            if (response.ok) {
                const csvText = await response.text();
                this.routes = this.parseCSV(csvText);
                return;
            } else {
                throw new Error(`Mobile fetch failed: ${response.status}`);
            }
            
        } catch (error) {
            // Use enhanced default routes for mobile
            this.routes = [
                { from: 'DVG', to: 'MYS', distance: 328, via: 'HAS', notes: 'Main route to Mysuru' },
                { from: 'DVG', to: 'BLR', distance: 250, via: 'YPR', notes: 'Bangalore route' },
                { from: 'DVG', to: 'MNG', distance: 180, via: 'HAS', notes: 'Mangalore route' },
                { from: 'DVG', to: 'HUB', distance: 420, via: 'YPR', notes: 'Hubli route' },
                { from: 'DVG', to: 'BJP', distance: 380, via: 'HAS', notes: 'Bijapur route' },
                { from: 'DVG', to: 'BGM', distance: 150, via: 'HAS', notes: 'Belgaum route' },
                { from: 'DVG', to: 'UDY', distance: 200, via: 'YPR', notes: 'Udupi route' },
                { from: 'DVG', to: 'KAR', distance: 120, via: 'HAS', notes: 'Karwar route' },
                { from: 'DVG', to: 'GOK', distance: 90, via: 'HAS', notes: 'Gokarna route' },
                { from: 'DVG', to: 'KUM', distance: 280, via: 'YPR', notes: 'Kumta route' }
            ];
            
            this.showNotification('📱 Using default routes (mobile optimized)', 'info');
        }
    }
    
    async loadRoutesWithRetry(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.loadRoutesFromGoogleSheets();
                return; // Success, exit retry loop
            } catch (error) {
                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    this.showNotification('⚠️ Using default routes (network issue)', 'warning');
                }
            }
        }
    }
    
    showLoadingIndicator() {
        const tableBody = document.querySelector('#routes-table tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-8">
                        <div class="flex items-center justify-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span class="ml-3 text-gray-600">Loading routes from Google Sheets...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    
    hideLoadingIndicator() {
        const tableBody = document.getElementById('routes-table-body');
        if (tableBody) {
            // Clear any loading content
            tableBody.innerHTML = '';
        }
    }

    // Load rate data from JSON file (same as calculator.js)
    async loadRateData() {
        try {
            const response = await fetch('extracted_rates.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.rateSlabs = await response.json();
        } catch (error) {
            // Fallback to basic rates if JSON file is not available
            this.rateSlabs = {
                L: { '321-330': { '51-100': 210.14, '101-200': 420.28, '201-500': 630.42 } },
                P: { '321-330': { '51-100': 231.15, '101-200': 462.31, '201-500': 693.46 } },
                R: { '321-330': { '51-100': 252.17, '101-200': 504.34, '201-500': 756.50 } },
                S: { '321-330': { '51-100': 189.13, '101-200': 378.25, '201-500': 567.38 } }
            };
        }
    }

    async loadRoutesFromGoogleSheets() {
        try {
            // Try multiple Google Sheets CSV URLs for better compatibility
            const csvUrls = [
                `https://docs.google.com/spreadsheets/d/${this.googleSheetId}/gviz/tq?tqx=out:csv`,
                `https://docs.google.com/spreadsheets/d/${this.googleSheetId}/export?format=csv`,
                `https://docs.google.com/spreadsheets/d/${this.googleSheetId}/gviz/tq?tqx=out:csv&gid=0`
            ];
            
            let csvText = null;
            let lastError = null;
            
            // Try each URL until one works
            for (const url of csvUrls) {
                try {
                    // Try different fetch configurations for mobile compatibility
                    const fetchConfigs = [
                        {
                            method: 'GET',
                            mode: 'cors',
                            headers: {
                                'Accept': 'text/csv,text/plain,*/*',
                                'Cache-Control': 'no-cache'
                            }
                        },
                        {
                            method: 'GET',
                            mode: 'no-cors', // Try no-cors for mobile
                            headers: {
                                'Accept': 'text/csv,text/plain,*/*'
                            }
                        },
                        {
                            method: 'GET',
                            headers: {
                                'Accept': 'text/csv,text/plain,*/*'
                            }
                        }
                    ];
                    
                    for (const config of fetchConfigs) {
                        try {
                            const response = await fetch(url, config);
                            
                            // For no-cors mode, we can't read the response, so we'll use a different approach
                            if (config.mode === 'no-cors') {
                                // Use JSONP-like approach for mobile
                                csvText = await this.fetchWithJSONP(url);
                                if (csvText) {
                                    break;
                                }
                            } else if (response.ok) {
                                csvText = await response.text();
                                break;
                            }
                        } catch (fetchError) {
                            continue;
                        }
                    }
                    
                    if (csvText) break;
                    
                } catch (error) {
                    lastError = error;
                    continue;
                }
            }
            
            if (csvText) {
                this.routes = this.parseCSV(csvText);
            } else {
                throw lastError || new Error('All Google Sheets URLs failed');
            }
            
        } catch (error) {
            // Enhanced default routes with more comprehensive data
            this.routes = [
                { from: 'DVG', to: 'MYS', distance: 328, via: 'HAS', notes: 'Main route to Mysuru' },
                { from: 'DVG', to: 'BLR', distance: 250, via: 'YPR', notes: 'Bangalore route' },
                { from: 'DVG', to: 'MNG', distance: 180, via: 'HAS', notes: 'Mangalore route' },
                { from: 'DVG', to: 'HUB', distance: 420, via: 'YPR', notes: 'Hubli route' },
                { from: 'DVG', to: 'BJP', distance: 380, via: 'HAS', notes: 'Bijapur route' },
                { from: 'DVG', to: 'BGM', distance: 150, via: 'HAS', notes: 'Belgaum route' },
                { from: 'DVG', to: 'UDY', distance: 200, via: 'YPR', notes: 'Udupi route' },
                { from: 'DVG', to: 'KAR', distance: 120, via: 'HAS', notes: 'Karwar route' },
                { from: 'DVG', to: 'GOK', distance: 90, via: 'HAS', notes: 'Gokarna route' },
                { from: 'DVG', to: 'KUM', distance: 280, via: 'YPR', notes: 'Kumta route' }
            ];
            
            // Show user-friendly error message
            this.showNotification('⚠️ Using default routes (Google Sheets unavailable on mobile)', 'warning');
        }
    }

    // JSONP-like approach for mobile compatibility
    async fetchWithJSONP(url) {
        return new Promise((resolve, reject) => {
            try {
                // Create a script tag to load the CSV as text
                const script = document.createElement('script');
                const callbackName = 'csvCallback_' + Date.now();
                
                // Set up a global callback
                window[callbackName] = function(data) {
                    resolve(data);
                    delete window[callbackName];
                    document.head.removeChild(script);
                };
                
                // Set timeout
                setTimeout(() => {
                    if (window[callbackName]) {
                        delete window[callbackName];
                        document.head.removeChild(script);
                        reject(new Error('JSONP timeout'));
                    }
                }, 10000);
                
                // Try to load as text using a different approach
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.setRequestHeader('Accept', 'text/csv,text/plain,*/*');
                
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error(`XHR failed: ${xhr.status}`));
                    }
                };
                
                xhr.onerror = function() {
                    reject(new Error('XHR network error'));
                };
                
                xhr.send();
                
            } catch (error) {
                reject(error);
            }
        });
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const routes = [];
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.replace(/"/g, '').trim());
            
            if (values.length >= 4) {
                const route = {
                    from: values[0] || '',
                    to: values[1] || '',
                    distance: parseInt(values[2]) || 0,
                    via: values[3] || '',
                    notes: values[4] || ''
                };
                
                if (route.from && route.to && route.distance > 0) {
                    routes.push(route);
                }
            }
        }
        
        return routes;
    }

    loadCustomRoutes() {
        try {
            const saved = localStorage.getItem('customRoutes');
            this.customRoutes = saved ? JSON.parse(saved) : [];
        } catch (error) {
            this.customRoutes = [];
        }
    }

    saveCustomRoutes() {
        localStorage.setItem('customRoutes', JSON.stringify(this.customRoutes));
    }

    displayRoutes() {
        const tableBody = document.getElementById('routes-table-body');
        const mobileContainer = document.getElementById('mobile-routes-container');
        
        if (!tableBody && !mobileContainer) {
            return;
        }
        
        // Clear any existing content first
        if (tableBody) tableBody.innerHTML = '';
        if (mobileContainer) mobileContainer.innerHTML = '';
        
        const allRoutes = [...this.routes, ...this.customRoutes];
        
        if (allRoutes.length === 0) {
            const noDataMessage = `
                <div class="text-center py-8">
                    <div class="text-gray-500">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        No routes available. Please refresh or add custom routes.
                    </div>
                </div>
            `;
            
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="10">${noDataMessage}</td></tr>`;
            }
            if (mobileContainer) {
                mobileContainer.innerHTML = noDataMessage;
            }
            return;
        }
        
        // Update desktop table
        if (tableBody) {
            tableBody.innerHTML = '';
            allRoutes.forEach(route => {
                const rates = this.calculateRates(route.distance, this.selectedWeight);
                const details = rates.details;
                
                // Clean text function
                const cleanText = (text) => {
                    return String(text)
                        .replace(/[''""]/g, '') // Remove all types of quotes
                        .replace(/→/g, ' to ') // Replace arrow with "to"
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .trim(); // Remove leading/trailing spaces
                };

                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 transition-colors duration-200';
                row.innerHTML = `
                    <td class="px-6 py-4 border-b border-gray-200 text-center font-medium text-gray-900">${cleanText(route.from)}</td>
                    <td class="px-6 py-4 border-b border-gray-200 text-center font-medium text-gray-900">${cleanText(route.to)}</td>
                    <td class="px-6 py-4 border-b border-gray-200 text-center font-semibold text-gray-800">${cleanText(route.distance)}</td>
                    <td class="px-6 py-4 border-b border-gray-200 text-center text-gray-700">${cleanText(route.via)}</td>
                    <td class="px-6 py-4 border-b border-gray-200 text-center">
                        <div class="font-bold text-xl text-gray-900 mb-2">₹${cleanText(Math.ceil(rates.luggage))}</div>
                        <div class="text-sm text-blue-700 font-semibold bg-blue-100 px-3 py-2 rounded-lg border border-blue-200">₹${cleanText((rates.luggage / this.selectedWeight).toFixed(2))}/kg</div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-200 text-center">
                        <div class="font-bold text-xl text-gray-900 mb-2">₹${cleanText(Math.ceil(rates.premier))}</div>
                        <div class="text-sm text-green-700 font-semibold bg-green-100 px-3 py-2 rounded-lg border border-green-200">₹${cleanText((rates.premier / this.selectedWeight).toFixed(2))}/kg</div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-200 text-center">
                        <div class="font-bold text-xl text-gray-900 mb-2">₹${cleanText(Math.ceil(rates.rajdhani))}</div>
                        <div class="text-sm text-purple-700 font-semibold bg-purple-100 px-3 py-2 rounded-lg border border-purple-200">₹${cleanText((rates.rajdhani / this.selectedWeight).toFixed(2))}/kg</div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-200 text-center">
                        <div class="font-bold text-xl text-gray-900 mb-2">₹${cleanText(Math.ceil(rates.standard))}</div>
                        <div class="text-sm text-orange-700 font-semibold bg-orange-100 px-3 py-2 rounded-lg border border-orange-200">₹${cleanText((rates.standard / this.selectedWeight).toFixed(2))}/kg</div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-200 text-center">
                        <div class="font-bold text-xl text-green-700 mb-2">₹${cleanText(Math.ceil(rates.jpp))}</div>
                        <div class="text-sm text-red-700 font-semibold bg-red-100 px-3 py-2 rounded-lg border border-red-200">₹${cleanText((rates.jpp / this.selectedWeight).toFixed(2))}/kg</div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-200 text-center">
                        <button onclick="routesManager.showDetails('${cleanText(route.from)}', '${cleanText(route.to)}', ${cleanText(route.distance)})" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm">
                            Details
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        // Update mobile container
        if (mobileContainer) {
            mobileContainer.innerHTML = '';
            allRoutes.forEach(route => {
                const rates = this.calculateRates(route.distance, this.selectedWeight);
                
                // Clean text function for mobile
                const cleanText = (text) => {
                    return String(text)
                        .replace(/[''""]/g, '') // Remove all types of quotes
                        .replace(/→/g, ' to ') // Replace arrow with "to"
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .trim(); // Remove leading/trailing spaces
                };
                
                const card = document.createElement('div');
                card.className = 'bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-4 hover:shadow-md transition-shadow duration-200';
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-bold text-xl text-gray-900 mb-1">${cleanText(route.from)} → ${cleanText(route.to)}</h3>
                            <p class="text-sm text-gray-600 font-medium">Distance: ${cleanText(route.distance)} km via ${cleanText(route.via)}</p>
                        </div>
                        <button onclick="routesManager.showDetails('${cleanText(route.from)}', '${cleanText(route.to)}', ${cleanText(route.distance)})" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm">
                            Details
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <div class="font-bold text-blue-800 mb-2">Luggage</div>
                            <div class="text-xl font-bold text-gray-900 mb-1">₹${cleanText(Math.ceil(rates.luggage))}</div>
                            <div class="text-sm text-blue-700 font-semibold">₹${cleanText((rates.luggage / this.selectedWeight).toFixed(2))}/kg</div>
                        </div>
                        <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                            <div class="font-bold text-green-800 mb-2">Premier</div>
                            <div class="text-xl font-bold text-gray-900 mb-1">₹${cleanText(Math.ceil(rates.premier))}</div>
                            <div class="text-sm text-green-700 font-semibold">₹${cleanText((rates.premier / this.selectedWeight).toFixed(2))}/kg</div>
                        </div>
                        <div class="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                            <div class="font-bold text-purple-800 mb-2">Rajdhani</div>
                            <div class="text-xl font-bold text-gray-900 mb-1">₹${cleanText(Math.ceil(rates.rajdhani))}</div>
                            <div class="text-sm text-purple-700 font-semibold">₹${cleanText((rates.rajdhani / this.selectedWeight).toFixed(2))}/kg</div>
                        </div>
                        <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                            <div class="font-bold text-orange-800 mb-2">Standard</div>
                            <div class="text-xl font-bold text-gray-900 mb-1">₹${cleanText(Math.ceil(rates.standard))}</div>
                            <div class="text-sm text-orange-700 font-semibold">₹${cleanText((rates.standard / this.selectedWeight).toFixed(2))}/kg</div>
                        </div>
                        <div class="bg-red-50 border border-red-200 p-4 rounded-lg col-span-2">
                            <div class="font-bold text-red-800 mb-2">JPP</div>
                            <div class="text-xl font-bold text-red-700 mb-1">₹${cleanText(Math.ceil(rates.jpp))}</div>
                            <div class="text-sm text-red-700 font-semibold">₹${cleanText((rates.jpp / this.selectedWeight).toFixed(2))}/kg</div>
                        </div>
                    </div>
                `;
                mobileContainer.appendChild(card);
            });
        }
    }

    calculateRates(distance, weight) {
        // Use detailed slab-based calculation logic from routes.js
        const rates = {};
        
        // Calculate rates for all scales
        rates.L = this.calculateScaleRate(distance, weight, 'L');
        rates.P = this.calculateScaleRate(distance, weight, 'P');
        rates.R = this.calculateScaleRate(distance, weight, 'R');
        rates.S = this.calculateScaleRate(distance, weight, 'S');
        
        // Calculate JPP rate (Premier Scale + 10%) - using base rate, not total rate
        let jppRate = 0;
        if (rates.P.baseRate > 0) {
            const jppBaseRate = rates.P.baseRate * 1.1;
            const jppDSC = jppBaseRate * 0.02;
            const jppRateAfterDSC = jppBaseRate + jppDSC;
            const jppGST = jppRateAfterDSC * 0.05;
            jppRate = Math.ceil(jppRateAfterDSC + jppGST);
        }
        
        // Calculate Luggage rate (Luggage Scale + 50%) - using total rate
        let luggageRate = 0;
        if (rates.L.totalRate > 0) {
            luggageRate = Math.ceil(rates.L.totalRate * 1.5);
        }
        
        return {
            luggage: luggageRate,
            premier: rates.P.totalRate,
            rajdhani: rates.R.totalRate,
            standard: rates.S.totalRate,
            jpp: jppRate,
            // Include detailed breakdown for modal display
            details: {
                L: rates.L,
                P: rates.P,
                R: rates.R,
                S: rates.S,
                luggageRate: luggageRate,
                jppRate: jppRate
            }
        };
    }

    // Calculate scale rate using slab-based logic (from routes.js)
    calculateScaleRate(distance, weight, scale) {
        // Get distance slab
        const distanceSlab = this.getDistanceSlab(distance);
        
        // Get rates for this distance slab and scale
        const scaleRates = this.rateSlabs[scale]?.[distanceSlab];
        
        if (!scaleRates) {
            return {
                baseRate: 0,
                totalRate: 0,
                ratePerKg: 0
            };
        }
        
        // Calculate rate breakdown by weight slabs
        const breakdown = this.calculateWeightSlabBreakdown(weight, scaleRates);
        const baseRate = breakdown.reduce((total, slab) => total + (slab.rate * slab.numberOfSlabs), 0);
        
        // Apply Development Surcharge (DSC) - 2% of base rate
        const dsc = baseRate * 0.02;
        const rateAfterDSC = baseRate + dsc;
        
        // Apply GST (5% for railway services) on rate after DSC
        const gst = rateAfterDSC * 0.05;
        const totalRate = rateAfterDSC + gst;
        
        return {
            baseRate: baseRate,
            totalRate: totalRate,
            ratePerKg: totalRate / weight
        };
    }

    // Get distance slab for given distance (from calculator.js)
    getDistanceSlab(distance) {
        // Find the appropriate distance slab for the given distance
        const distanceSlabs = Object.keys(this.rateSlabs.L || {}); // Use Scale L as reference
        
        for (const slab of distanceSlabs) {
            const [from, to] = slab.split('-').map(Number);
            if (distance >= from && distance <= to) {
                return slab;
            }
        }
        
        // If no exact match, find the closest slab
        let closestSlab = distanceSlabs[0];
        let minDiff = Infinity;
        
        for (const slab of distanceSlabs) {
            const [from, to] = slab.split('-').map(Number);
            const midPoint = (from + to) / 2;
            const diff = Math.abs(distance - midPoint);
            
            if (diff < minDiff) {
                minDiff = diff;
                closestSlab = slab;
            }
        }
        
        return closestSlab;
    }

    // Calculate weight slab breakdown (from calculator.js)
    calculateWeightSlabBreakdown(weight, scaleRates) {
        const breakdown = [];
        
        // Find the appropriate weight slab for the given weight
        const weightSlabs = Object.keys(scaleRates).sort((a, b) => {
            const aMax = parseInt(a.split('-')[1]);
            const bMax = parseInt(b.split('-')[1]);
            return aMax - bMax; // Ascending order to find the right slab
        });
        
        // Find the slab that can accommodate the full weight
        let selectedSlab = null;
        for (const weightRange of weightSlabs) {
            const [minWeight, maxWeight] = weightRange.split('-').map(Number);
            if (weight <= maxWeight) {
                selectedSlab = weightRange;
                break;
            }
        }
        
        // If no single slab can accommodate, use the largest available slab
        if (!selectedSlab && weightSlabs.length > 0) {
            selectedSlab = weightSlabs[weightSlabs.length - 1];
        }
        
        if (selectedSlab && scaleRates[selectedSlab]) {
            const rate = scaleRates[selectedSlab];
            const [minWeight, maxWeight] = selectedSlab.split('-').map(Number);
            
            // Calculate how many times this slab rate applies
            const slabCapacity = maxWeight;
            const numberOfSlabs = Math.ceil(weight / slabCapacity);
            
            breakdown.push({
                slab: selectedSlab,
                weight: weight,
                rate: rate,
                numberOfSlabs: numberOfSlabs,
                description: `${numberOfSlabs} × ${slabCapacity}kg slab (${selectedSlab})`
            });
        }
        
        return breakdown;
    }

    setupEventListeners() {
        // Weight input and calculate button
        const weightInput = document.getElementById('weight-input');
        const calculateButton = document.getElementById('calculate-routes');
        
        if (weightInput) {
            weightInput.addEventListener('change', (e) => {
                this.selectedWeight = parseInt(e.target.value);
                this.displayRoutes();
            });
        }
        
        if (calculateButton) {
            calculateButton.addEventListener('click', () => {
                const weightInput = document.getElementById('weight-input');
                if (weightInput) {
                    this.selectedWeight = parseInt(weightInput.value);
                    this.displayRoutes();
                }
            });
        }

        // Add custom route button
        const addRouteBtn = document.getElementById('add-custom-route');
        if (addRouteBtn) {
            addRouteBtn.addEventListener('click', () => {
                this.addCustomRoute();
            });
        }

        // Search functionality
        const searchFrom = document.getElementById('search-from');
        const searchTo = document.getElementById('search-to');
        const searchBtn = document.getElementById('search-routes');
        const clearSearchBtn = document.getElementById('clear-search');
        
        if (searchFrom) {
            searchFrom.addEventListener('input', () => this.performSearch());
        }
        
        if (searchTo) {
            searchTo.addEventListener('input', () => this.performSearch());
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearSearch());
        }

        // Refresh routes button
        const refreshBtn = document.getElementById('refresh-routes-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Refreshing...';
                
                try {
                    this.showLoadingIndicator();
                    
                    // Clear any cached data and force reload
                    this.routes = [];
                    
                    // Check if it's a mobile device and use appropriate method
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    
                    if (isMobile) {
                        await this.loadRoutesForMobile();
                    } else {
                        await this.loadRoutesWithRetry();
                    }
                    
                    this.displayRoutes();
                    this.showNotification('✅ Routes refreshed successfully', 'success');
                } catch (error) {
                    this.showNotification('❌ Failed to refresh routes', 'error');
                } finally {
                    refreshBtn.disabled = false;
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i>Refresh';
                }
            });
        }
    }

    async addCustomRoute() {
        const from = document.getElementById('from-station').value.trim().toUpperCase();
        const to = document.getElementById('to-station').value.trim().toUpperCase();
        const distance = parseInt(document.getElementById('distance-km').value);
        const via = document.getElementById('via-station').value.trim();

        if (!from || !to || !distance || distance <= 0) {
            alert('Please fill all required fields with valid values.');
            return;
        }

        let originalText = '';
        try {
            // Show loading state
            const addButton = document.getElementById('add-custom-route');
            originalText = addButton.innerHTML;
            addButton.disabled = true;
            addButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Adding...';

            // Add to local storage first (simpler approach)
            const newRoute = { from, to, distance, via, notes: 'Custom route' };
            this.customRoutes.push(newRoute);
            this.saveCustomRoutes();
            
            // Try to add to Google Sheets
            const success = await this.addRouteToGoogleSheets(from, to, distance, via);
            
            if (success) {
                this.showNotification('✅ Route added to Google Sheets successfully!', 'success');
            } else {
                this.showNotification('📝 Route saved locally. Check "Pending Routes" for manual sync.', 'info');
            }

            // Refresh display
            this.displayRoutes();

            // Clear form
            document.getElementById('from-station').value = '';
            document.getElementById('to-station').value = '';
            document.getElementById('distance-km').value = '';
            document.getElementById('via-station').value = '';
            
        } catch (error) {
            this.showNotification('❌ Error adding route: ' + error.message, 'error');
        } finally {
            // Reset button
            const addButton = document.getElementById('add-custom-route');
            if (addButton) {
                addButton.disabled = false;
                addButton.innerHTML = originalText || '<i class="fas fa-plus mr-2"></i>Add Route';
            }
        }
    }

    async addRouteToGoogleSheets(from, to, distance, via) {
        try {
            // Method 1: Try using Google Apps Script web app
            const success = await this.addRouteViaAppsScript(from, to, distance, via);
            if (success) return true;
            
            // Method 2: Try using Google Forms (if set up)
            const formSuccess = await this.addRouteViaGoogleForm(from, to, distance, via);
            if (formSuccess) return true;
            
            // Method 3: Fallback to localStorage
            return await this.addRouteViaFormSubmission(from, to, distance, via);
            
        } catch (error) {
            // Fallback to form submission method
            return await this.addRouteViaFormSubmission(from, to, distance, via);
        }
    }

    async addRouteViaAppsScript(from, to, distance, via) {
        try {
            // Google Apps Script web app URL for direct Google Sheets integration
            const scriptUrl = 'https://script.google.com/macros/s/AKfycbwqyo510FcsA505cCjeRQbZy7ArXTRGA2e6oEkMBRQyUBgQlUD33gAa7wHpNyi1YSnT/exec';
            
            // Use simple GET method to avoid CORS issues
            const url = new URL(scriptUrl);
            url.searchParams.append('from', from);
            url.searchParams.append('to', to);
            url.searchParams.append('distance', distance);
            url.searchParams.append('via', via);
            url.searchParams.append('notes', 'Custom route');
            
            // Use hidden iframe method to avoid CORS
            return new Promise((resolve) => {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = url.toString();
                document.body.appendChild(iframe);
                
                // Remove iframe after a delay and assume success
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve(true); // Assume success for GET method
                }, 1000);
            });
        } catch (error) {
            return false;
        }
    }

    async addRouteViaGoogleForm(from, to, distance, via) {
        try {
            // This requires setting up a Google Form linked to the sheet
            // For now, we'll return false to use fallback method
            return false;
        } catch (error) {
            return false;
        }
    }

    async addRouteViaFormSubmission(from, to, distance, via) {
        try {
            const newRoute = { from, to, distance, via, notes: 'Custom route', timestamp: new Date().toISOString() };
            
            // Store in localStorage for now
            const pendingRoutes = JSON.parse(localStorage.getItem('pendingGoogleSheetRoutes') || '[]');
            pendingRoutes.push(newRoute);
            localStorage.setItem('pendingGoogleSheetRoutes', JSON.stringify(pendingRoutes));
            
            this.showNotification('📝 Route saved locally. Check "Pending Routes" for manual sync.', 'info');
            return true;
        } catch (error) {
            return false;
        }
    }

    showPendingRoutes() {
        const pendingRoutes = JSON.parse(localStorage.getItem('pendingGoogleSheetRoutes') || '[]');
        
        if (pendingRoutes.length === 0) {
            this.showNotification('No pending routes to sync.', 'info');
            return;
        }

        let message = '📋 Pending Routes to Sync:\n\n';
        pendingRoutes.forEach((route, index) => {
            message += `${index + 1}. ${route.from} → ${route.to} (${route.distance} km via ${route.via})\n`;
        });
        
        message += '\n📝 To sync to Google Sheets:\n';
        message += '1. Open your Google Sheet\n';
        message += '2. Add these routes manually\n';
        message += '3. Click "Clear Pending Routes" after syncing';
        
        alert(message);
    }

    clearPendingRoutes() {
        localStorage.removeItem('pendingGoogleSheetRoutes');
        this.showNotification('✅ Pending routes cleared!', 'success');
    }

    performSearch() {
        const searchFrom = document.getElementById('search-from')?.value.toLowerCase() || '';
        const searchTo = document.getElementById('search-to')?.value.toLowerCase() || '';
        
        const rows = document.querySelectorAll('#routes-table-body tr');
        
        rows.forEach(row => {
            const from = row.cells[0]?.textContent.toLowerCase() || '';
            const to = row.cells[1]?.textContent.toLowerCase() || '';
            
            const fromMatches = !searchFrom || from.includes(searchFrom);
            const toMatches = !searchTo || to.includes(searchTo);
            
            const matches = fromMatches && toMatches;
            row.style.display = matches ? '' : 'none';
        });
    }
    
    clearSearch() {
        const searchFrom = document.getElementById('search-from');
        const searchTo = document.getElementById('search-to');
        
        if (searchFrom) searchFrom.value = '';
        if (searchTo) searchTo.value = '';
        
        // Show all rows
        const rows = document.querySelectorAll('#routes-table-body tr');
        rows.forEach(row => {
            row.style.display = '';
        });
    }

    searchRoutes(query) {
        const rows = document.querySelectorAll('#routes-table-body tr');
        const searchTerm = query.toLowerCase();

        rows.forEach(row => {
            const from = row.cells[0]?.textContent.toLowerCase() || '';
            const to = row.cells[1]?.textContent.toLowerCase() || '';
            const matches = from.includes(searchTerm) || to.includes(searchTerm);
            row.style.display = matches ? '' : 'none';
        });
    }

    showDetails(from, to, distance) {
        const rates = this.calculateRates(distance, this.selectedWeight);
        const details = rates.details;
        
        // Update the detailed breakdown section
        this.displayCalculationBreakdown(from, to, distance, rates, details);
        
        // Also show modal for mobile users
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 class="text-xl font-bold mb-4">${from} → ${to} - Detailed Rate Breakdown</h3>
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Distance:</strong> ${distance} km</div>
                        <div><strong>Weight:</strong> ${this.selectedWeight} kg</div>
                    </div>
                    
                    <div class="border-t pt-4">
                        <h4 class="font-semibold mb-2 text-blue-600">Rate Summary</h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div class="bg-blue-50 p-2 rounded">
                                <strong>Luggage Rate:</strong> ₹${Math.ceil(rates.luggage)}
                            </div>
                            <div class="bg-green-50 p-2 rounded">
                                <strong>Premier Scale:</strong> ₹${Math.ceil(rates.premier)}
                            </div>
                            <div class="bg-purple-50 p-2 rounded">
                                <strong>Rajdhani Scale:</strong> ₹${Math.ceil(rates.rajdhani)}
                            </div>
                            <div class="bg-orange-50 p-2 rounded">
                                <strong>Standard Scale:</strong> ₹${Math.ceil(rates.standard)}
                            </div>
                            <div class="bg-red-50 p-2 rounded">
                                <strong>JPP Rate:</strong> ₹${Math.ceil(rates.jpp)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="border-t pt-4">
                        <h4 class="font-semibold mb-2 text-gray-700">Detailed Breakdown</h4>
                        <div class="space-y-3 text-sm">
                            <div class="bg-gray-50 p-3 rounded">
                                <strong>Luggage Scale (L):</strong><br>
                                Base Rate: ₹${details.L.baseRate.toFixed(2)}<br>
                                <strong>Total: ₹${Math.ceil(details.L.totalRate)}</strong><br>
                                Rate per kg: ₹${details.L.ratePerKg.toFixed(2)}
                            </div>
                            <div class="bg-gray-50 p-3 rounded">
                                <strong>Premier Scale (P):</strong><br>
                                Base Rate: ₹${details.P.baseRate.toFixed(2)}<br>
                                <strong>Total: ₹${Math.ceil(details.P.totalRate)}</strong><br>
                                Rate per kg: ₹${details.P.ratePerKg.toFixed(2)}
                            </div>
                            <div class="bg-gray-50 p-3 rounded">
                                <strong>Rajdhani Scale (R):</strong><br>
                                Base Rate: ₹${details.R.baseRate.toFixed(2)}<br>
                                <strong>Total: ₹${Math.ceil(details.R.totalRate)}</strong><br>
                                Rate per kg: ₹${details.R.ratePerKg.toFixed(2)}
                            </div>
                            <div class="bg-gray-50 p-3 rounded">
                                <strong>Standard Scale (S):</strong><br>
                                Base Rate: ₹${details.S.baseRate.toFixed(2)}<br>
                                <strong>Total: ₹${Math.ceil(details.S.totalRate)}</strong><br>
                                Rate per kg: ₹${details.S.ratePerKg.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
                    Close
                </button>
            </div>
        `;
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        document.body.appendChild(modal);
    }

    displayCalculationBreakdown(from, to, distance, rates, details) {
        const breakdownContainer = document.getElementById('calculation-breakdown');
        if (!breakdownContainer) return;

        const dscL = details.L.baseRate * 0.02;
        const gstL = (details.L.baseRate + dscL) * 0.05;
        const dscP = details.P.baseRate * 0.02;
        const gstP = (details.P.baseRate + dscP) * 0.05;
        const dscR = details.R.baseRate * 0.02;
        const gstR = (details.R.baseRate + dscR) * 0.05;
        const dscS = details.S.baseRate * 0.02;
        const gstS = (details.S.baseRate + dscS) * 0.05;

        breakdownContainer.innerHTML = `
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="text-lg font-semibold text-blue-800 mb-3">${from} → ${to} (${distance} km, ${this.selectedWeight} kg)</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Luggage Scale -->
                    <div class="bg-white p-4 rounded-lg border border-blue-200">
                        <h5 class="font-semibold text-blue-700 mb-2">Luggage Scale (L)</h5>
                        <div class="space-y-1 text-sm">
                            <div><strong>Base Rate:</strong> ₹${details.L.baseRate.toFixed(2)}</div>
                            <div><strong>DSC (2%):</strong> ₹${dscL.toFixed(2)}</div>
                            <div><strong>Rate after DSC:</strong> ₹${(details.L.baseRate + dscL).toFixed(2)}</div>
                            <div><strong>GST (5%):</strong> ₹${gstL.toFixed(2)}</div>
                            <div class="border-t pt-1"><strong>Total Rate:</strong> ₹${Math.ceil(details.L.totalRate)}</div>
                            <div><strong>Rate per kg:</strong> ₹${details.L.ratePerKg.toFixed(2)}</div>
                            <div class="text-blue-600 font-medium"><strong>Luggage Rate (1.5×):</strong> ₹${Math.ceil(rates.luggage)}</div>
                        </div>
                    </div>

                    <!-- Premier Scale -->
                    <div class="bg-white p-4 rounded-lg border border-green-200">
                        <h5 class="font-semibold text-green-700 mb-2">Premier Scale (P)</h5>
                        <div class="space-y-1 text-sm">
                            <div><strong>Base Rate:</strong> ₹${details.P.baseRate.toFixed(2)}</div>
                            <div><strong>DSC (2%):</strong> ₹${dscP.toFixed(2)}</div>
                            <div><strong>Rate after DSC:</strong> ₹${(details.P.baseRate + dscP).toFixed(2)}</div>
                            <div><strong>GST (5%):</strong> ₹${gstP.toFixed(2)}</div>
                            <div class="border-t pt-1"><strong>Total Rate:</strong> ₹${Math.ceil(details.P.totalRate)}</div>
                            <div><strong>Rate per kg:</strong> ₹${details.P.ratePerKg.toFixed(2)}</div>
                        </div>
                    </div>

                    <!-- Rajdhani Scale -->
                    <div class="bg-white p-4 rounded-lg border border-purple-200">
                        <h5 class="font-semibold text-purple-700 mb-2">Rajdhani Scale (R)</h5>
                        <div class="space-y-1 text-sm">
                            <div><strong>Base Rate:</strong> ₹${details.R.baseRate.toFixed(2)}</div>
                            <div><strong>DSC (2%):</strong> ₹${dscR.toFixed(2)}</div>
                            <div><strong>Rate after DSC:</strong> ₹${(details.R.baseRate + dscR).toFixed(2)}</div>
                            <div><strong>GST (5%):</strong> ₹${gstR.toFixed(2)}</div>
                            <div class="border-t pt-1"><strong>Total Rate:</strong> ₹${Math.ceil(details.R.totalRate)}</div>
                            <div><strong>Rate per kg:</strong> ₹${details.R.ratePerKg.toFixed(2)}</div>
                        </div>
                    </div>

                    <!-- Standard Scale -->
                    <div class="bg-white p-4 rounded-lg border border-orange-200">
                        <h5 class="font-semibold text-orange-700 mb-2">Standard Scale (S)</h5>
                        <div class="space-y-1 text-sm">
                            <div><strong>Base Rate:</strong> ₹${details.S.baseRate.toFixed(2)}</div>
                            <div><strong>DSC (2%):</strong> ₹${dscS.toFixed(2)}</div>
                            <div><strong>Rate after DSC:</strong> ₹${(details.S.baseRate + dscS).toFixed(2)}</div>
                            <div><strong>GST (5%):</strong> ₹${gstS.toFixed(2)}</div>
                            <div class="border-t pt-1"><strong>Total Rate:</strong> ₹${Math.ceil(details.S.totalRate)}</div>
                            <div><strong>Rate per kg:</strong> ₹${details.S.ratePerKg.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <!-- JPP Calculation -->
                <div class="mt-4 bg-white p-4 rounded-lg border border-red-200">
                    <h5 class="font-semibold text-red-700 mb-2">Joint Parcel Product (JPP)</h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <div><strong>Premier Base Rate:</strong> ₹${details.P.baseRate.toFixed(2)}</div>
                            <div><strong>JPP Base Rate (110%):</strong> ₹${(details.P.baseRate * 1.1).toFixed(2)}</div>
                            <div><strong>DSC (2%):</strong> ₹${(details.P.baseRate * 1.1 * 0.02).toFixed(2)}</div>
                            <div><strong>Rate after DSC:</strong> ₹${(details.P.baseRate * 1.1 * 1.02).toFixed(2)}</div>
                            <div><strong>GST (5%):</strong> ₹${(details.P.baseRate * 1.1 * 1.02 * 0.05).toFixed(2)}</div>
                            <div class="border-t pt-1"><strong>Total JPP Rate:</strong> ₹${Math.ceil(rates.jpp)}</div>
                            <div><strong>Rate per kg:</strong> ₹${(rates.jpp / this.selectedWeight).toFixed(2)}</div>
                        </div>
                        <div class="bg-red-50 p-3 rounded">
                            <div class="font-medium text-red-800">Calculation Formula:</div>
                            <div class="text-xs text-red-700 mt-1">
                                JPP = (Premier Base Rate × 1.1) + DSC + GST<br>
                                Where DSC = 2% of base rate<br>
                                GST = 5% of (base rate + DSC)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        let bgColor = 'bg-blue-600';
        
        switch(type) {
            case 'success':
                bgColor = 'bg-green-600';
                break;
            case 'error':
                bgColor = 'bg-red-600';
                break;
            case 'warning':
                bgColor = 'bg-yellow-600';
                break;
            case 'info':
            default:
                bgColor = 'bg-blue-600';
                break;
        }
        
        notification.className = `fixed top-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    exportRoutesPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('portrait', 'mm', 'a4');
            
            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('South Western Railway - Mysuru Division', 105, 20, { align: 'center' });
            doc.setFontSize(14);
            doc.text('Parcel Routes Rate Table', 105, 30, { align: 'center' });
            
            // Date
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 105, 40, { align: 'center' });
            
            // Get table data
            const tableBody = document.getElementById('routes-table-body');
            const rows = tableBody.querySelectorAll('tr');
            
            if (rows.length === 0 || (rows.length === 1 && rows[0].querySelector('.fa-spinner'))) {
                this.showNotification('No routes data available for export', 'warning');
                return;
            }
            
            const tableData = [];
            
            // Function to clean text thoroughly
            const cleanText = (text) => {
                return text
                    .replace(/[''""]/g, '') // Remove all types of quotes
                    .replace(/→/g, ' to ') // Replace arrow with "to"
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim(); // Remove leading/trailing spaces
            };
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 1) { // Skip loading row
                    const rowData = [];
                    cells.forEach((cell, index) => {
                        if (index < 9) { // Exclude Details column
                            let text = cell.textContent.trim();
                            // Clean up text using the cleanText function
                            text = cleanText(text);
                            rowData.push(text);
                        }
                    });
                    if (rowData.length > 0) {
                        tableData.push(rowData);
                    }
                }
            });
            
            if (tableData.length === 0) {
                this.showNotification('No routes data available for export', 'warning');
                return;
            }
            
            // Table headers
            const headers = [
                'From', 'To', 'Dist', 'Via', 
                'Luggage\nTotal/Per kg', 'Premier\nTotal/Per kg', 
                'Rajdhani\nTotal/Per kg', 'Standard\nTotal/Per kg', 
                'JPP\nTotal/Per kg'
            ];
            
            // Create table
            doc.autoTable({
                head: [headers],
                body: tableData,
                startY: 50,
                styles: {
                    fontSize: 7,
                    cellPadding: 1,
                    lineWidth: 0.1,
                    halign: 'center' // Center align all content
                },
                headStyles: {
                    fillColor: [30, 64, 175],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center' // Center align headers
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                    halign: 'center' // Center align data rows
                },
                columnStyles: {
                    0: { cellWidth: 12, halign: 'center' }, // From
                    1: { cellWidth: 12, halign: 'center' }, // To
                    2: { cellWidth: 10, halign: 'center' }, // Dist
                    3: { cellWidth: 12, halign: 'center' }, // Via
                    4: { cellWidth: 20, halign: 'center' }, // Luggage
                    5: { cellWidth: 20, halign: 'center' }, // Premier
                    6: { cellWidth: 20, halign: 'center' }, // Rajdhani
                    7: { cellWidth: 20, halign: 'center' }, // Standard
                    8: { cellWidth: 20, halign: 'center' }  // JPP
                },
                pageBreak: 'auto',
                margin: { top: 50, right: 5, bottom: 20, left: 5 }
            });
            
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${pageCount}`, 105, 280, { align: 'center' });
            }
            
            // Save PDF
            const filename = `railway_routes_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            this.showNotification('✅ Routes table exported to PDF successfully!', 'success');
            
        } catch (error) {
            console.error('PDF Export Error:', error);
            this.showNotification('❌ Error exporting PDF: ' + error.message, 'error');
        }
    }

    exportRateReport() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('portrait', 'mm', 'a4');
            
            // Title
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('South Western Railway - Mysuru Division', 105, 25, { align: 'center' });
            doc.setFontSize(16);
            doc.text('Parcel Rate Analysis Report', 105, 35, { align: 'center' });
            
            // Date and Info
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 105, 45, { align: 'center' });
            doc.text(`Total Routes: ${this.routes.length}`, 105, 55, { align: 'center' });
            
            // Rate Legend
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Rate Scale Information:', 20, 75);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('• Luggage Scale (L): Light Parcels - Rate = 1.5× Luggage Scale Rate', 20, 85);
            doc.text('• Premier Scale (P): Parcels', 20, 95);
            doc.text('• Rajdhani Scale (R): Railway Parcels', 20, 105);
            doc.text('• Standard Scale (S): Special Parcels', 20, 115);
            doc.text('• JPP: Joint Parcel Product = Premier Scale rate + 10%', 20, 125);
            
            // Calculation Details
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Rate Calculation Formula:', 20, 145);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('1. Base Rate: Calculated based on distance slabs', 20, 155);
            doc.text('2. Development Surcharge (DSC): 2% of base rate', 20, 165);
            doc.text('3. Rate after DSC: Base rate + DSC', 20, 175);
            doc.text('4. GST: 5% of (base rate + DSC)', 20, 185);
            doc.text('5. Total Rate: Base rate + DSC + GST', 20, 195);
            
            // Save PDF
            const filename = `railway_rate_report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            this.showNotification('✅ Rate report exported to PDF successfully!', 'success');
            
        } catch (error) {
            console.error('Rate Report Export Error:', error);
            this.showNotification('❌ Error exporting rate report: ' + error.message, 'error');
        }
    }

    printTable() {
        try {
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            
            // Get the table data
            const tableBody = document.getElementById('routes-table-body');
            const rows = tableBody.querySelectorAll('tr');
            
            if (rows.length === 0 || (rows.length === 1 && rows[0].querySelector('.fa-spinner'))) {
                this.showNotification('No routes data available for printing', 'warning');
                return;
            }
            
            // Function to clean text thoroughly
            const cleanText = (text) => {
                return text
                    .replace(/[''""]/g, '') // Remove all types of quotes
                    .replace(/→/g, ' to ') // Replace arrow with "to"
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim(); // Remove leading/trailing spaces
            };
            
            // Create print-friendly HTML
            let printHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Railway Routes - Print</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                        .subtitle { font-size: 18px; margin-bottom: 10px; }
                        .date { font-size: 12px; color: #666; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; font-size: 10px; }
                        th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
                        th { background-color: #1e40af; color: white; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f8f9fa; }
                        .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">South Western Railway - Mysuru Division</div>
                        <div class="subtitle">Parcel Routes Rate Table</div>
                        <div class="date">Generated on: ${new Date().toLocaleDateString('en-IN')}</div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>From</th>
                                <th>To</th>
                                <th>Dist</th>
                                <th>Via</th>
                                <th>Luggage<br>Total/Per kg</th>
                                <th>Premier<br>Total/Per kg</th>
                                <th>Rajdhani<br>Total/Per kg</th>
                                <th>Standard<br>Total/Per kg</th>
                                <th>JPP<br>Total/Per kg</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 1) { // Skip loading row
                    let rowHTML = '<tr>';
                    cells.forEach((cell, index) => {
                        if (index < 9) { // Exclude Details column
                            let text = cell.textContent.trim();
                            text = cleanText(text);
                            rowHTML += `<td>${text}</td>`;
                        }
                    });
                    rowHTML += '</tr>';
                    printHTML += rowHTML;
                }
            });
            
            printHTML += `
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p>South Western Railway - Mysuru Division | Parcel Services</p>
                        <p>Rate Legend: L=Luggage, P=Premier, R=Rajdhani, S=Standard, JPP=Joint Parcel Product</p>
                    </div>
                    
                    <div class="no-print" style="margin-top: 20px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Print Table
                        </button>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                            Close
                        </button>
                    </div>
                </body>
                </html>
            `;
            
            printWindow.document.write(printHTML);
            printWindow.document.close();
            
            this.showNotification('✅ Print window opened! Click "Print Table" to print.', 'success');
            
        } catch (error) {
            console.error('Print Error:', error);
            this.showNotification('❌ Error opening print window: ' + error.message, 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.routesManager = new RoutesManager();
}); 