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
        console.log('Initializing Routes Manager with Google Sheets...');
        await this.loadRateData(); // Load rate data first
        
        // Add loading indicator
        this.showLoadingIndicator();
        
        // Try to load routes with retry mechanism
        await this.loadRoutesWithRetry();
        
        this.loadCustomRoutes();
        this.displayRoutes();
        this.setupEventListeners();
        
        // Hide loading indicator
        this.hideLoadingIndicator();
    }
    
    async loadRoutesWithRetry(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt} of ${maxRetries} to load routes...`);
                await this.loadRoutesFromGoogleSheets();
                return; // Success, exit retry loop
            } catch (error) {
                console.warn(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('All retry attempts failed, using default routes');
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
        // Loading indicator will be replaced when displayRoutes() is called
    }

    // Load rate data from JSON file (same as calculator.js)
    async loadRateData() {
        try {
            const response = await fetch('extracted_rates.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.rateSlabs = await response.json();
            console.log('✅ Rate data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading rate data:', error);
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
            console.log('Fetching routes from Google Sheets...');
            
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
                    console.log(`Trying URL: ${url}`);
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Accept': 'text/csv,text/plain,*/*',
                            'Cache-Control': 'no-cache'
                        }
                    });
                    
                    if (response.ok) {
                        csvText = await response.text();
                        console.log(`✅ Success with URL: ${url}`);
                        break;
                    } else {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.warn(`❌ Failed with URL ${url}:`, error.message);
                    lastError = error;
                    continue;
                }
            }
            
            if (csvText) {
                this.routes = this.parseCSV(csvText);
                console.log(`✅ Loaded ${this.routes.length} routes from Google Sheets`);
            } else {
                throw lastError || new Error('All Google Sheets URLs failed');
            }
            
        } catch (error) {
            console.error('❌ Error loading from Google Sheets:', error);
            console.log('🔄 Using default routes');
            
            // Enhanced default routes
            this.routes = [
                { from: 'DVG', to: 'MYS', distance: 328, via: 'HAS', notes: 'Main route' },
                { from: 'DVG', to: 'BLR', distance: 250, via: 'YPR', notes: 'Bangalore route' },
                { from: 'DVG', to: 'MNG', distance: 180, via: 'HAS', notes: 'Mangalore route' },
                { from: 'DVG', to: 'HUB', distance: 420, via: 'YPR', notes: 'Hubli route' },
                { from: 'DVG', to: 'BJP', distance: 380, via: 'HAS', notes: 'Bijapur route' }
            ];
            
            // Show user-friendly error message
            this.showNotification('⚠️ Using default routes (Google Sheets unavailable)', 'warning');
        }
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
        if (!tableBody) return;

        tableBody.innerHTML = '';
        const allRoutes = [...this.routes, ...this.customRoutes];
        
        console.log('Displaying routes with weight:', this.selectedWeight);
        
        allRoutes.forEach(route => {
            const rates = this.calculateRates(route.distance, this.selectedWeight);
            const details = rates.details;
            
            console.log(`Route ${route.from}-${route.to}:`, {
                luggage: rates.luggage,
                premier: rates.premier,
                luggagePerKg: (rates.luggage / this.selectedWeight).toFixed(2)
            });
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-3 border-b">${route.from}</td>
                <td class="px-4 py-3 border-b">${route.to}</td>
                <td class="px-4 py-3 border-b text-center">${route.distance}</td>
                <td class="px-4 py-3 border-b">${route.via}</td>
                <td class="px-4 py-3 border-b text-center">
                    <div class="font-bold text-lg">₹${Math.ceil(rates.luggage)}</div>
                    <div class="text-sm text-blue-600 font-medium mt-1 bg-blue-50 px-2 py-1 rounded border">₹${(rates.luggage / this.selectedWeight).toFixed(2)}/kg</div>
                </td>
                <td class="px-4 py-3 border-b text-center">
                    <div class="font-bold text-lg">₹${Math.ceil(rates.premier)}</div>
                    <div class="text-sm text-green-600 font-medium mt-1 bg-green-50 px-2 py-1 rounded border">₹${(rates.premier / this.selectedWeight).toFixed(2)}/kg</div>
                </td>
                <td class="px-4 py-3 border-b text-center">
                    <div class="font-bold text-lg">₹${Math.ceil(rates.rajdhani)}</div>
                    <div class="text-sm text-purple-600 font-medium mt-1 bg-purple-50 px-2 py-1 rounded border">₹${(rates.rajdhani / this.selectedWeight).toFixed(2)}/kg</div>
                </td>
                <td class="px-4 py-3 border-b text-center">
                    <div class="font-bold text-lg">₹${Math.ceil(rates.standard)}</div>
                    <div class="text-sm text-orange-600 font-medium mt-1 bg-orange-50 px-2 py-1 rounded border">₹${(rates.standard / this.selectedWeight).toFixed(2)}/kg</div>
                </td>
                <td class="px-4 py-3 border-b text-center">
                    <div class="font-bold text-green-600 text-lg">₹${Math.ceil(rates.jpp)}</div>
                    <div class="text-sm text-red-600 font-medium mt-1 bg-red-50 px-2 py-1 rounded border">₹${(rates.jpp / this.selectedWeight).toFixed(2)}/kg</div>
                </td>
                <td class="px-4 py-3 border-b text-center">
                    <button onclick="routesManager.showDetails('${route.from}', '${route.to}', ${route.distance})" 
                            class="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        Details
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
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

        // Custom route form
        const form = document.getElementById('custom-route-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCustomRoute();
            });
        }

        // Search
        const search = document.getElementById('route-search');
        if (search) {
            search.addEventListener('input', (e) => this.searchRoutes(e.target.value));
        }

        // Refresh routes button
        const refreshBtn = document.getElementById('refresh-routes-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                console.log('Manual refresh requested...');
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Refreshing...';
                
                try {
                    this.showLoadingIndicator();
                    await this.loadRoutesWithRetry();
                    this.displayRoutes();
                    this.showNotification('✅ Routes refreshed successfully', 'success');
                } catch (error) {
                    console.error('Refresh failed:', error);
                    this.showNotification('❌ Failed to refresh routes', 'error');
                } finally {
                    refreshBtn.disabled = false;
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i>Refresh';
                }
            });
        }
    }

    addCustomRoute() {
        const from = document.getElementById('from-station').value.trim().toUpperCase();
        const to = document.getElementById('to-station').value.trim().toUpperCase();
        const distance = parseInt(document.getElementById('distance').value);
        const via = document.getElementById('via-station').value.trim();

        if (!from || !to || !distance || distance <= 0) {
            alert('Please fill all required fields with valid values.');
            return;
        }

        const newRoute = { from, to, distance, via, notes: 'Custom route' };
        this.customRoutes.push(newRoute);
        this.saveCustomRoutes();
        this.displayRoutes();

        // Clear form
        document.getElementById('custom-route-form').reset();
        this.showNotification('Route added successfully!');
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

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.routesManager = new RoutesManager();
}); 