// Parcel Rate Calculator JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    // Load rate data from JSON file
    await loadRateData();
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Rate calculator form handling
    const rateCalculatorForm = document.getElementById('rate-calculator-form');
    if (rateCalculatorForm) {
        rateCalculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateRates();
        });
    }

    // Real-time calculation on input change
    const distanceInput = document.getElementById('distance');
    const weightInput = document.getElementById('weight');
    
    if (distanceInput && weightInput) {
        distanceInput.addEventListener('input', function() {
            if (distanceInput.value && weightInput.value) {
                calculateRates();
            }
        });
        
        weightInput.addEventListener('input', function() {
            if (distanceInput.value && weightInput.value) {
                calculateRates();
            }
        });
    }
});

// Calculate rates based on distance and weight
function calculateRates() {
    const distance = parseFloat(document.getElementById('distance').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const serviceType = document.getElementById('service-type').value;
    
    if (!distance || !weight || distance <= 0 || weight <= 0) {
        showMessage('Please enter valid distance and weight values', 'error');
        return;
    }
    
    // Show loading state
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = `
        <div class="text-center py-8">
            <div class="loading mx-auto mb-4"></div>
            <p class="text-gray-600">Calculating rates...</p>
        </div>
    `;
    
    // Simulate calculation delay
    setTimeout(() => {
        const rates = calculateAllRates(distance, weight, serviceType);
        displayResults(rates, distance, weight);
    }, 1000);
}

// Calculate rates for all scales
function calculateAllRates(distance, weight, serviceType) {
    const rates = {};
    
    if (serviceType === 'all' || serviceType === 'L') {
        rates.L = calculateScaleRate(distance, weight, 'L');
    }
    
    if (serviceType === 'all' || serviceType === 'P') {
        rates.P = calculateScaleRate(distance, weight, 'P');
    }
    
    if (serviceType === 'all' || serviceType === 'R') {
        rates.R = calculateScaleRate(distance, weight, 'R');
    }
    
    if (serviceType === 'all' || serviceType === 'S') {
        rates.S = calculateScaleRate(distance, weight, 'S');
    }
    
    return rates;
}

// Railway rate slabs data - loaded from extracted PDF data
let rateSlabs = {};

// Load rate data from JSON file
async function loadRateData() {
    try {
        const response = await fetch('extracted_rates.json');
        if (!response.ok) {
            throw new Error('Failed to load rate data');
        }
        rateSlabs = await response.json();

    } catch (error) {
        console.error('Error loading rate data:', error);
        // Fallback to basic rates if JSON loading fails
        rateSlabs = {
            'L': { '1-50': { '1-10': 7.53, '11-20': 15.06, '21-30': 22.59, '31-40': 30.12, '41-50': 37.65, '51-60': 45.18, '61-70': 52.71, '71-80': 60.24, '81-90': 67.77, '91-100': 75.3 } },
            'P': { '1-50': { '1-10': 4.19, '11-20': 8.37, '21-30': 12.55, '31-40': 16.74, '41-50': 20.92, '51-60': 25.1, '61-70': 29.29, '71-80': 33.47, '81-90': 37.65, '91-100': 41.84 } },
            'R': { '1-50': { '1-10': 6.28, '11-20': 12.56, '21-30': 18.83, '31-40': 25.11, '41-50': 31.38, '51-60': 37.66, '61-70': 43.93, '71-80': 50.21, '81-90': 56.48, '91-100': 62.76 } },
            'S': { '1-50': { '1-10': 2.1, '11-20': 4.19, '21-30': 6.28, '31-40': 8.37, '41-50': 10.47, '51-60': 12.56, '61-70': 14.65, '71-80': 16.74, '81-90': 18.83, '91-100': 20.93 } }
        };
    }
}

// Calculate rate for specific scale using railway slab system
function calculateScaleRate(distance, weight, scale) {

    
    // Get distance slab
    const distanceSlab = getDistanceSlab(distance);
    
    // Get rates for this distance slab and scale
    const scaleRates = rateSlabs[scale]?.[distanceSlab];
    
    if (!scaleRates) {
        return {
            baseRate: 0,
            distanceRate: distance,
            weightMultiplier: weight,
            finalRate: 0,
            gst: 0,
            totalRate: 0,
            ratePerKg: 0,
            breakdown: []
        };
    }
    
    // Calculate rate breakdown by weight slabs
    const breakdown = calculateWeightSlabBreakdown(weight, scaleRates);
    const baseRate = breakdown.reduce((total, slab) => total + (slab.rate * slab.numberOfSlabs), 0);
    
    // Apply Development Surcharge (DSC) - 2% of base rate
    const dsc = baseRate * 0.02;
    const rateAfterDSC = baseRate + dsc;
    
    // Apply GST (5% for railway services) on rate after DSC
    const gst = rateAfterDSC * 0.05;
    const totalRate = rateAfterDSC + gst;
    
    return {
        baseRate: baseRate,
        dsc: dsc,
        rateAfterDSC: rateAfterDSC,
        distanceRate: distance,
        weightMultiplier: weight,
        finalRate: baseRate,
        gst: gst,
        totalRate: totalRate,
        ratePerKg: totalRate / weight,
        breakdown: breakdown
    };
}

// Get distance slab for given distance
function getDistanceSlab(distance) {
    // Find the appropriate distance slab for the given distance
    const distanceSlabs = Object.keys(rateSlabs.L || {}); // Use Scale L as reference
    
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

// Calculate weight slab breakdown
function calculateWeightSlabBreakdown(weight, scaleRates) {
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

// Display calculation results
function displayResults(rates, distance, weight) {
    const resultsContainer = document.getElementById('results-container');
    
    // Define scale names and colors at the top of the function
    const scaleNames = {
        'L': 'Luggage Scale',
        'P': 'Premier Scale',
        'R': 'Rajdhani Scale',
        'S': 'Standard Scale'
    };
    
    const scaleColors = {
        'L': 'blue',
        'P': 'green', 
        'R': 'purple',
        'S': 'orange'
    };
    
    let html = `
        <div class="bg-white rounded-lg p-6 mb-6">
            <h4 class="text-lg font-semibold mb-4">Calculation Summary</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="font-medium">Distance:</span> ${distance} km
                </div>
                <div>
                    <span class="font-medium">Weight:</span> ${weight} kg
                </div>
            </div>
        </div>
    `;
    
    // Add comparison table at the top if multiple scales
    if (Object.keys(rates).length > 1) {
        html += `
            <div class="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 class="text-lg font-semibold mb-4">Rate Comparison</h4>
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="bg-blue-600 text-white">
                                <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Service</th>
                                <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Total Rate</th>
                                <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Rate per kg</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(rates).map(scale => `
                                <tr class="bg-white">
                                    <td class="border border-gray-300 px-3 py-2 font-medium">${scaleNames[scale]}</td>
                                    <td class="border border-gray-300 px-3 py-2 text-center font-bold">₹${Math.ceil(rates[scale].totalRate)}</td>
                                    <td class="border border-gray-300 px-3 py-2 text-center">₹${rates[scale].ratePerKg.toFixed(2)}</td>
                                </tr>
                                ${scale === 'L' ? `
                                    <tr class="bg-blue-50">
                                        <td class="border border-gray-300 px-3 py-2 font-medium text-blue-600">Luggage (Luggage Scale)</td>
                                        <td class="border border-gray-300 px-3 py-2 text-center font-bold text-blue-600">₹${Math.ceil(rates[scale].totalRate * 1.5)}</td>
                                        <td class="border border-gray-300 px-3 py-2 text-center text-blue-600">₹${((rates[scale].totalRate * 1.5) / rates[scale].weightMultiplier).toFixed(2)}</td>
                                    </tr>
                                ` : ''}
                                ${scale === 'P' ? `
                                    <tr class="bg-green-50">
                                        <td class="border border-gray-300 px-3 py-2 font-medium text-green-600">JPP (Scale P)</td>
                                        <td class="border border-gray-300 px-3 py-2 text-center font-bold text-green-600">₹${Math.ceil(rates[scale].baseRate * 1.1 * 1.02 * 1.05)}</td>
                                        <td class="border border-gray-300 px-3 py-2 text-center text-green-600">₹${((rates[scale].baseRate * 1.1 * 1.02 * 1.05) / rates[scale].weightMultiplier).toFixed(2)}</td>
                                    </tr>
                                ` : ''}
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="mt-4 p-3 bg-blue-100 rounded">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        Rates are calculated based on official railway scale rates. Actual rates may vary based on specific routes and conditions.
                    </p>
                </div>
            </div>
        `;
    }
    
    // Display rates for each scale
    Object.keys(rates).forEach(scale => {
        const rate = rates[scale];
        const color = scaleColors[scale];
        const scaleName = scaleNames[scale];
        
        html += `
            <div class="bg-white rounded-lg p-6 shadow-md">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-xl font-semibold">${scaleName}</h4>
                    <div class="w-12 h-12 bg-${color}-600 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold">${scale}</span>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Distance:</span>
                        <span class="font-medium">${rate.distanceRate} km</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Weight:</span>
                        <span class="font-medium">${rate.weightMultiplier} kg</span>
                    </div>
                    

                    
                    <div class="flex justify-between">
                        <span class="text-gray-600">Base Rate:</span>
                        <span class="font-medium">₹${rate.baseRate.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">DSC (2%):</span>
                        <span class="font-medium">₹${rate.dsc.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Rate after DSC:</span>
                        <span class="font-medium">₹${rate.rateAfterDSC.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">GST (5%):</span>
                        <span class="font-medium">₹${rate.gst.toFixed(2)}</span>
                    </div>
                    <hr class="my-3">
                    ${scale === 'L' ? `
                        <div class="flex justify-between text-lg font-bold">
                            <span>Luggage Rate (1.5×):</span>
                            <span class="text-${color}-600">₹${(rate.totalRate * 1.5).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Luggage GST (5%):</span>
                            <span class="font-medium">₹${(rate.totalRate * 1.5 * 0.05).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-lg font-bold">
                            <span>Luggage Total:</span>
                            <span class="text-${color}-600">₹${Math.ceil(rate.totalRate * 1.5 * 1.05)}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Luggage Rate per kg:</span>
                            <span class="font-medium">₹${((rate.totalRate * 1.5 * 1.05) / rate.weightMultiplier).toFixed(2)}</span>
                        </div>
                        <hr class="my-3">
                    ` : ''}
                    
                    ${scale === 'P' ? `
                        <div class="flex justify-between text-lg font-bold">
                            <span>JPP Rate (P + 10%):</span>
                            <span class="text-${color}-600">₹${(rate.baseRate * 1.1).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">JPP DSC (2%):</span>
                            <span class="font-medium">₹${(rate.baseRate * 1.1 * 0.02).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">JPP Rate after DSC:</span>
                            <span class="font-medium">₹${(rate.baseRate * 1.1 * 1.02).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">JPP GST (5%):</span>
                            <span class="font-medium">₹${(rate.baseRate * 1.1 * 1.02 * 0.05).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-lg font-bold">
                            <span>JPP Total:</span>
                            <span class="text-${color}-600">₹${Math.ceil(rate.baseRate * 1.1 * 1.02 * 1.05)}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">JPP Rate per kg:</span>
                            <span class="font-medium">₹${((rate.baseRate * 1.1 * 1.02 * 1.05) / rate.weightMultiplier).toFixed(2)}</span>
                        </div>
                        <hr class="my-3">
                    ` : ''}
                    
                    <div class="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span class="text-${color}-600">₹${Math.ceil(rate.totalRate)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Rate per kg:</span>
                        <span class="font-medium">₹${rate.ratePerKg.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type} fixed top-20 right-4 z-50 max-w-sm`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Add WhatsApp integration
function initWhatsAppIntegration() {
    const whatsappBtn = document.createElement('a');
    whatsappBtn.href = 'https://wa.me/919731667962?text=Hi, I need help with parcel rate calculation.';
    whatsappBtn.target = '_blank';
    whatsappBtn.className = 'fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-300 z-40';
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp text-2xl"></i>';
    whatsappBtn.title = 'Chat with us on WhatsApp';
    
    document.body.appendChild(whatsappBtn);
}

// Initialize WhatsApp integration
initWhatsAppIntegration(); 