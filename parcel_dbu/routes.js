// Routes Table JavaScript

// Railway rate slabs data - loaded from extracted PDF data
let rateSlabs = {};

// Default route data from DVG to various destinations
const defaultRoutes = [
    { from: 'DVG', to: 'MYS', distance: 328, via: 'HAS' },
    { from: 'DVG', to: 'MYA', distance: 372, via: 'HAS' },
    { from: 'DVG', to: 'MYS', distance: 464, via: 'SBC' },
    { from: 'DVG', to: 'MYA', distance: 419, via: 'SBC' },
    { from: 'DVG', to: 'HAS', distance: 207, via: 'ASK' },
    { from: 'DVG', to: 'BJP', distance: 392, via: '' },
    { from: 'DVG', to: 'BGK', distance: 295, via: '' },
    { from: 'DVG', to: 'GDG', distance: 201, via: '' },
    { from: 'DVG', to: 'UBL', distance: 144, via: '' },
    { from: 'DVG', to: 'HVR', distance: 68, via: '' },
    { from: 'DVG', to: 'RNR', distance: 36, via: '' },
    { from: 'DVG', to: 'HRR', distance: 23, via: '' },
    { from: 'DVG', to: 'RRB', distance: 115, via: '' },
    { from: 'DVG', to: 'ASK', distance: 160, via: '' },
    { from: 'DVG', to: 'TK', distance: 257, via: '' },
    { from: 'DVG', to: 'SBC', distance: 326, via: '' },
    { from: 'DVG', to: 'BYD', distance: 54, via: '' },
    { from: 'DVG', to: 'HPT', distance: 286, via: 'UBL' },
    { from: 'DVG', to: 'HPT', distance: 144, via: 'AVC' },
    { from: 'DVG', to: 'DWR', distance: 164, via: '' },
    { from: 'DVG', to: 'BGM', distance: 285, via: '' },
    { from: 'DVG', to: 'HAS', distance: 207, via: '' },
    { from: 'DVG', to: 'SKLR', distance: 249, via: '' },
    { from: 'DVG', to: 'BAY', distance: 209, via: 'AVC' },
    { from: 'DVG', to: 'BAY', distance: 351, via: 'UBL' }
];

// Route data - combines default routes with custom routes from localStorage
let routes = [];

// Load routes from localStorage or use default routes
function loadRoutes() {
    try {
        const savedRoutes = localStorage.getItem('customRoutes');
        if (savedRoutes) {
            const customRoutes = JSON.parse(savedRoutes);
            routes = [...defaultRoutes, ...customRoutes];
        } else {
            routes = [...defaultRoutes];
        }
    } catch (error) {
        console.error('Error loading routes from localStorage:', error);
        routes = [...defaultRoutes];
    }
}

// Save custom routes to localStorage
function saveCustomRoutes(customRoutes) {
    try {
        localStorage.setItem('customRoutes', JSON.stringify(customRoutes));
    } catch (error) {
        console.error('Error saving routes to localStorage:', error);
    }
}

// Get custom routes (routes that are not in defaultRoutes)
function getCustomRoutes() {
    return routes.filter(route => {
        return !defaultRoutes.some(defaultRoute => 
            defaultRoute.from === route.from && 
            defaultRoute.to === route.to && 
            defaultRoute.distance === route.distance
        );
    });
}

// Export routes to PDF file
function exportRoutesToFile() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('South Western Railway - Mysuru Division', 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Parcel Route Table & Rate Information', 105, 22, { align: 'center' });
        
        // Add export date
        doc.setFontSize(9);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 28, { align: 'center' });
        
        // Add summary information
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 20, 38);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const customRoutes = getCustomRoutes();
        doc.text(`Total Routes: ${routes.length}`, 20, 45);
        doc.text(`Default Routes: ${defaultRoutes.length}`, 20, 50);
        doc.text(`Custom Routes: ${customRoutes.length}`, 20, 55);
        
        // Add route table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Route Details', 20, 65);
        
        // Prepare table data
        const tableData = routes.map((route, index) => [
            index + 1,
            route.from,
            route.to,
            route.distance + ' km',
            route.via || '-'
        ]);
        
        // Add table
        doc.autoTable({
            startY: 70,
            head: [['#', 'From', 'To', 'Distance', 'Via']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246], // Blue color
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 10
            },
            styles: {
                fontSize: 9,
                cellPadding: 1,
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 8, halign: 'center' }, // #
                1: { cellWidth: 20, halign: 'center' }, // From
                2: { cellWidth: 20, halign: 'center' }, // To
                3: { cellWidth: 20, halign: 'center' }, // Distance
                4: { cellWidth: 20, halign: 'center' }  // Via
            },
            pageBreak: 'auto',
            margin: { top: 10, right: 10, bottom: 10, left: 10 }
        });
        
        // Add custom routes section if any
        if (customRoutes.length > 0) {
            const currentY = doc.lastAutoTable.finalY + 5;
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Custom Routes (User Added)', 20, currentY);
            
            const customTableData = customRoutes.map((route, index) => [
                index + 1,
                route.from,
                route.to,
                route.distance + ' km',
                route.via || '-',
                'Custom'
            ]);
            
            doc.autoTable({
                startY: currentY + 3,
                head: [['#', 'From', 'To', 'Distance', 'Via', 'Type']],
                body: customTableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [34, 197, 94], // Green color for custom routes
                    textColor: 255,
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 22 },
                    2: { cellWidth: 22 },
                    3: { cellWidth: 22 },
                    4: { cellWidth: 22 },
                    5: { cellWidth: 22 }
                }
            });
        }
        
        // Add rate information
        const rateY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Rate Scale Information', 20, rateY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('• Luggage Scale (L): Light parcels with luggage rate = 1.5× base rate', 20, rateY + 8);
        doc.text('• Premier Scale (P): Standard parcels with JPP rate = base rate + 10%', 20, rateY + 15);
        doc.text('• Rajdhani Scale (R): Premium parcels for Rajdhani trains', 20, rateY + 22);
        doc.text('• Standard Scale (S): Basic parcels for regular trains', 20, rateY + 29);
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
            doc.text('South Western Railway - Mysuru Division', 105, doc.internal.pageSize.height - 5, { align: 'center' });
        }
        
        // Save the PDF
        const fileName = `railway_routes_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showMessage('Routes exported to PDF successfully!', 'success');
    } catch (error) {
        console.error('Error exporting routes to PDF:', error);
        showMessage('Error exporting routes to PDF', 'error');
    }
}

// Export detailed rate report to PDF
function exportDetailedRateReport() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('South Western Railway - Mysuru Division', 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Detailed Parcel Rate Report', 105, 22, { align: 'center' });
        
        // Add export date
        doc.setFontSize(9);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 28, { align: 'center' });
        
        // Get current weight
        const weight = parseInt(document.getElementById('weight-input')?.value) || 100;
        
        // Add weight information
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rate Calculation Weight: ${weight} kg`, 20, 38);
        
        // Calculate rates for all routes
        const routeRates = calculateAllRouteRates(weight);
        
        // Add rate table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailed Rate Comparison', 20, 48);
        
        // Prepare detailed table data
        const detailedTableData = routeRates.map((route, index) => {
            const luggageRate = Math.ceil(Number(route.scaleL.totalRate));
            const premierRate = Math.ceil(Number(route.scaleP.totalRate));
            const rajdhaniRate = Math.ceil(Number(route.scaleR.totalRate));
            const standardRate = Math.ceil(Number(route.scaleS.totalRate));
            const jppRate = Math.ceil(Number(route.jppRate));
            
            return [
                index + 1,
                route.from,
                route.to,
                route.distance + ' km',
                luggageRate.toString(),
                premierRate.toString(),
                rajdhaniRate.toString(),
                standardRate.toString(),
                jppRate.toString()
            ];
        });
        
        // Add detailed table
        doc.autoTable({
            startY: 52,
            head: [['#', 'From', 'To', 'Dist', 'Luggage (₹)', 'Premier (₹)', 'Rajdhani (₹)', 'Standard (₹)', 'JPP (₹)']],
            body: detailedTableData,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246], // Blue color
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 9
            },
            styles: {
                fontSize: 8,
                cellPadding: 1,
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 6, halign: 'center' },   // #
                1: { cellWidth: 15, halign: 'center' },  // From
                2: { cellWidth: 15, halign: 'center' },  // To
                3: { cellWidth: 12, halign: 'center' },  // Dist
                4: { cellWidth: 16, halign: 'right' },   // Luggage
                5: { cellWidth: 16, halign: 'right' },   // Premier
                6: { cellWidth: 16, halign: 'right' },   // Rajdhani
                7: { cellWidth: 16, halign: 'right' },   // Standard
                8: { cellWidth: 16, halign: 'right' }    // JPP
            },
            didParseCell: function(data) {
                // Ensure all cell content is properly formatted as strings
                if (data.cell.text) {
                    data.cell.text = String(data.cell.text);
                }
            },
            pageBreak: 'auto',
            margin: { top: 10, right: 10, bottom: 10, left: 10 }
        });
        
        // Add rate per kg table
        const currentY = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Rate per KG Comparison', 20, currentY);
        
        const perKgTableData = routeRates.map((route, index) => {
            const luggagePerKg = Number(route.scaleL.ratePerKg).toFixed(2);
            const premierPerKg = Number(route.scaleP.ratePerKg).toFixed(2);
            const rajdhaniPerKg = Number(route.scaleR.ratePerKg).toFixed(2);
            const standardPerKg = Number(route.scaleS.ratePerKg).toFixed(2);
            const jppPerKg = Number(route.jppRate / weight).toFixed(2);
            
            return [
                index + 1,
                route.from + ' to ' + route.to,
                luggagePerKg,
                premierPerKg,
                rajdhaniPerKg,
                standardPerKg,
                jppPerKg
            ];
        });
        
        doc.autoTable({
            startY: currentY + 3,
            head: [['#', 'Route', 'Luggage/KG (₹)', 'Premier/KG (₹)', 'Rajdhani/KG (₹)', 'Standard/KG (₹)', 'JPP/KG (₹)']],
            body: perKgTableData,
            theme: 'grid',
            headStyles: {
                fillColor: [34, 197, 94], // Green color
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 9
            },
            styles: {
                fontSize: 8,
                cellPadding: 1,
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 8, halign: 'center' },   // #
                1: { cellWidth: 35, halign: 'center' },  // Route
                2: { cellWidth: 20, halign: 'right' },   // Luggage/KG
                3: { cellWidth: 20, halign: 'right' },   // Premier/KG
                4: { cellWidth: 20, halign: 'right' },   // Rajdhani/KG
                5: { cellWidth: 20, halign: 'right' },   // Standard/KG
                6: { cellWidth: 20, halign: 'right' }    // JPP/KG
            },
            didParseCell: function(data) {
                // Ensure all cell content is properly formatted as strings
                if (data.cell.text) {
                    data.cell.text = String(data.cell.text);
                }
            },
            pageBreak: 'auto',
            margin: { top: 10, right: 10, bottom: 10, left: 10 }
        });
        
        // Add rate information
        const infoY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Rate Information', 20, infoY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('• Luggage Scale: Base rate + 1.5× for luggage items', 20, infoY + 8);
        doc.text('• Premier Scale: Standard parcel rates', 20, infoY + 15);
        doc.text('• JPP Rate: Premier Scale + 10% (Joint Parcel Product)', 20, infoY + 22);
        doc.text('• Rajdhani Scale: Premium rates for Rajdhani trains', 20, infoY + 29);
        doc.text('• Standard Scale: Basic rates for regular trains', 20, infoY + 36);
        doc.text('• All rates include 5% GST and are rounded up to next ₹1', 20, infoY + 43);
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
            doc.text('South Western Railway - Mysuru Division', 105, doc.internal.pageSize.height - 5, { align: 'center' });
        }
        
        // Save the PDF
        const fileName = `railway_rates_detailed_${weight}kg_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showMessage('Detailed rate report exported to PDF successfully!', 'success');
    } catch (error) {
        console.error('Error exporting detailed rate report:', error);
        showMessage('Error exporting detailed rate report', 'error');
    }
}

// Clear all custom routes
function clearCustomRoutes() {
    if (confirm('Are you sure you want to clear all custom routes? This action cannot be undone.')) {
        routes = [...defaultRoutes];
        localStorage.removeItem('customRoutes');
        
        const weight = parseInt(document.getElementById('weight-input')?.value) || 100;
        const routeRates = calculateAllRouteRates(weight);
        displayRouteTable(routeRates);
        
        showMessage('All custom routes cleared successfully!', 'success');
    }
}

// Generate updated routes.js file content
function generateUpdatedRoutesJS() {
    const customRoutes = getCustomRoutes();
    
    let jsContent = `// Routes Table JavaScript

// Railway rate slabs data - loaded from extracted PDF data
let rateSlabs = {};

// Route data from DVG to various destinations (Updated with custom routes)
let routes = [
    // Default routes
    { from: 'DVG', to: 'MYS', distance: 328, via: 'HAS' },
    { from: 'DVG', to: 'MYA', distance: 372, via: 'HAS' },
    { from: 'DVG', to: 'MYS', distance: 464, via: 'SBC' },
    { from: 'DVG', to: 'MYA', distance: 419, via: 'SBC' },
    { from: 'DVG', to: 'HAS', distance: 207, via: 'ASK' },
    { from: 'DVG', to: 'BJP', distance: 392, via: '' },
    { from: 'DVG', to: 'BGK', distance: 295, via: '' },
    { from: 'DVG', to: 'GDG', distance: 201, via: '' },
    { from: 'DVG', to: 'UBL', distance: 144, via: '' },
    { from: 'DVG', to: 'HVR', distance: 68, via: '' },
    { from: 'DVG', to: 'RNR', distance: 36, via: '' },
    { from: 'DVG', to: 'HRR', distance: 23, via: '' },
    { from: 'DVG', to: 'RRB', distance: 115, via: '' },
    { from: 'DVG', to: 'ASK', distance: 160, via: '' },
    { from: 'DVG', to: 'TK', distance: 257, via: '' },
    { from: 'DVG', to: 'SBC', distance: 326, via: '' },
    { from: 'DVG', to: 'BYD', distance: 54, via: '' },
    { from: 'DVG', to: 'HPT', distance: 286, via: 'UBL' },
    { from: 'DVG', to: 'HPT', distance: 144, via: 'AVC' },
    { from: 'DVG', to: 'DWR', distance: 164, via: '' },
    { from: 'DVG', to: 'BGM', distance: 285, via: '' },
    { from: 'DVG', to: 'HAS', distance: 207, via: '' },
    { from: 'DVG', to: 'SKLR', distance: 249, via: '' },
    { from: 'DVG', to: 'BAY', distance: 209, via: 'AVC' },
    { from: 'DVG', to: 'BAY', distance: 351, via: 'UBL' }`;
    
    // Add custom routes
    if (customRoutes.length > 0) {
        jsContent += `,
    // Custom routes added by users
    ${customRoutes.map(route => 
        `{ from: '${route.from}', to: '${route.to}', distance: ${route.distance}, via: '${route.via}' }`
    ).join(',\n    ')}`;
    }
    
    jsContent += `
];

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

// Rest of the functions remain the same...
// (This is a simplified version - you would need to include all the other functions)`;

    return jsContent;
}

// Export updated routes.js file
function exportUpdatedRoutesJS() {
    try {
        const jsContent = generateUpdatedRoutesJS();
        const dataBlob = new Blob([jsContent], {type: 'application/javascript'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `routes_updated_${new Date().toISOString().split('T')[0]}.js`;
        link.click();
        
        showMessage('Updated routes.js file exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting routes.js:', error);
        showMessage('Error exporting routes.js file', 'error');
    }
}

// Show custom routes summary
function showCustomRoutesSummary() {
    const customRoutes = getCustomRoutes();
    
    if (customRoutes.length === 0) {
        showMessage('No custom routes have been added yet.', 'info');
        return;
    }
    
    let summary = `Custom Routes Summary (${customRoutes.length} routes):\\n\\n`;
    customRoutes.forEach((route, index) => {
        summary += `${index + 1}. ${route.from} → ${route.to} (${route.distance}km)`;
        if (route.via) {
            summary += ` via ${route.via}`;
        }
        summary += '\\n';
    });
    
    // Create a modal to show the summary
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Custom Routes Summary</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <pre class="text-sm text-gray-700 whitespace-pre-wrap">${summary}</pre>
            <div class="mt-4 flex gap-2">
                <button onclick="exportUpdatedRoutesJS()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    <i class="fas fa-download mr-2"></i>Export Updated routes.js
                </button>
                <button onclick="this.closest('.fixed').remove()" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Save route addition timestamp for tracking
function saveRouteAddition(route) {
    try {
        const additions = JSON.parse(localStorage.getItem('routeAdditions') || '[]');
        additions.push({
            route: route,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        localStorage.setItem('routeAdditions', JSON.stringify(additions));
    } catch (error) {
        console.error('Error saving route addition:', error);
    }
}

// Show recent route additions
function showRecentAdditions() {
    try {
        const additions = JSON.parse(localStorage.getItem('routeAdditions') || '[]');
        
        if (additions.length === 0) {
            showMessage('No recent route additions found.', 'info');
            return;
        }
        
        let summary = `Recent Route Additions (${additions.length} total):\\n\\n`;
        additions.slice(-10).reverse().forEach((addition, index) => {
            const date = new Date(addition.timestamp).toLocaleString();
            const route = addition.route;
            summary += `${index + 1}. ${route.from} → ${route.to} (${route.distance}km)`;
            if (route.via) {
                summary += ` via ${route.via}`;
            }
            summary += ` - Added: ${date}\\n`;
        });
        
        // Create a modal to show recent additions
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-96 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Recent Route Additions</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <pre class="text-sm text-gray-700 whitespace-pre-wrap">${summary}</pre>
                <div class="mt-4 flex gap-2">
                    <button onclick="clearRouteAdditions()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        <i class="fas fa-trash mr-2"></i>Clear History
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error showing recent additions:', error);
        showMessage('Error loading recent additions', 'error');
    }
}

// Clear route additions history
function clearRouteAdditions() {
    if (confirm('Are you sure you want to clear the route additions history?')) {
        localStorage.removeItem('routeAdditions');
        showMessage('Route additions history cleared!', 'success');
        // Close the modal
        document.querySelector('.fixed').remove();
    }
}

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

// Calculate rate for specific scale using railway slab system
function calculateScaleRate(distance, weight, scale) {
    // Get distance slab
    const distanceSlab = getDistanceSlab(distance);
    
    // Get rates for this distance slab and scale
    const scaleRates = rateSlabs[scale]?.[distanceSlab];
    
    if (!scaleRates) {
        return {
            baseRate: 0,
            totalRate: 0,
            ratePerKg: 0
        };
    }
    
    // Calculate rate breakdown by weight slabs
    const breakdown = calculateWeightSlabBreakdown(weight, scaleRates);
    const baseRate = breakdown.reduce((total, slab) => total + (slab.rate * slab.numberOfSlabs), 0);
    
    // Apply GST (5% for railway services)
            const dsc = baseRate * 0.02;
        const rateAfterDSC = baseRate + dsc;
        const gst = rateAfterDSC * 0.05;
            const totalRate = rateAfterDSC + gst;
    
    return {
        baseRate: baseRate,
        totalRate: totalRate,
        ratePerKg: totalRate / weight
    };
}

// Calculate rates for all routes
function calculateAllRouteRates(weight) {
    const routeRates = [];
    
    routes.forEach(route => {
        const rates = {
            from: route.from,
            to: route.to,
            distance: route.distance,
            via: route.via,
            scaleL: calculateScaleRate(route.distance, weight, 'L'),
            scaleP: calculateScaleRate(route.distance, weight, 'P'),
            scaleR: calculateScaleRate(route.distance, weight, 'R'),
            scaleS: calculateScaleRate(route.distance, weight, 'S'),
            jppRate: 0
        };
        
        // Calculate JPP rate (Premier Scale + 10%)
        if (rates.scaleP.baseRate > 0) {
            const jppBaseRate = rates.scaleP.baseRate * 1.1;
            const jppDSC = jppBaseRate * 0.02;
            const jppRateAfterDSC = jppBaseRate + jppDSC;
            const jppGST = jppRateAfterDSC * 0.05;
            rates.jppRate = jppRateAfterDSC + jppGST;
        }
        
        // Calculate Luggage rate (Luggage Scale + 50%)
        if (rates.scaleL.totalRate > 0) {
            rates.luggageRate = rates.scaleL.totalRate * 1.5;
        }
        
        routeRates.push(rates);
    });
    
    return routeRates;
}

// Display route table
function displayRouteTable(routeRates) {
    const tableBody = document.getElementById('routes-table-body');
    const mobileContainer = document.getElementById('mobile-routes-container');
    
    if (!routeRates || routeRates.length === 0) {
        const errorHtml = `
            <tr>
                <td colspan="9" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <div>No route data available. Please check if rate data is loaded properly.</div>
                </td>
            </tr>
        `;
        tableBody.innerHTML = errorHtml;
        mobileContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <div>No route data available. Please check if rate data is loaded properly.</div>
            </div>
        `;
        return;
    }
    
    // Desktop table HTML
    let tableHtml = '';
    
    // Mobile cards HTML
    let mobileHtml = '';
    
    routeRates.forEach((route, index) => {
        // Handle cases where rates might be 0 or undefined
        const scaleLTotal = route.scaleL?.totalRate || 0;
        const scalePTotal = route.scaleP?.totalRate || 0;
        const scaleRTotal = route.scaleR?.totalRate || 0;
        const scaleSTotal = route.scaleS?.totalRate || 0;
        const jppTotal = route.jppRate || 0;
        
        const scaleLRatePerKg = route.scaleL?.ratePerKg || 0;
        const scalePRatePerKg = route.scaleP?.ratePerKg || 0;
        const scaleRRatePerKg = route.scaleR?.ratePerKg || 0;
        const scaleSRatePerKg = route.scaleS?.ratePerKg || 0;
        
        // Desktop table row
        tableHtml += `
            <tr class="hover:bg-gray-50">
                <td class="border border-gray-300 px-2 py-2 font-medium text-xs">${route.from}</td>
                <td class="border border-gray-300 px-2 py-2 font-medium text-xs">${route.to}</td>
                <td class="border border-gray-300 px-2 py-2 text-center text-xs">${route.distance}</td>
                <td class="border border-gray-300 px-2 py-2 text-xs">${route.via || '-'}</td>
                <td class="border border-gray-300 px-2 py-2 text-center">
                    <div class="font-bold text-xs">₹${Math.ceil(scaleLTotal)}</div>
                    <div class="text-xs text-gray-600">₹${scaleLRatePerKg.toFixed(2)}/kg</div>
                    ${route.luggageRate ? `
                        <div class="text-xs text-blue-600 font-medium">L: ₹${Math.ceil(route.luggageRate)}</div>
                    ` : ''}
                </td>
                <td class="border border-gray-300 px-2 py-2 text-center">
                    <div class="font-bold text-xs">₹${Math.ceil(scalePTotal)}</div>
                    <div class="text-xs text-gray-600">₹${scalePRatePerKg.toFixed(2)}/kg</div>
                </td>
                <td class="border border-gray-300 px-2 py-2 text-center">
                    <div class="font-bold text-xs">₹${Math.ceil(scaleRTotal)}</div>
                    <div class="text-xs text-gray-600">₹${scaleRRatePerKg.toFixed(2)}/kg</div>
                </td>
                <td class="border border-gray-300 px-2 py-2 text-center">
                    <div class="font-bold text-xs">₹${Math.ceil(scaleSTotal)}</div>
                    <div class="text-xs text-gray-600">₹${scaleSRatePerKg.toFixed(2)}/kg</div>
                </td>
                <td class="border border-gray-300 px-2 py-2 text-center">
                    <div class="font-bold text-green-600 text-xs">₹${Math.ceil(jppTotal)}</div>
                    <div class="text-xs text-gray-600">₹${(jppTotal / 100).toFixed(2)}/kg</div>
                </td>
            </tr>
        `;
        
        // Mobile card
        mobileHtml += `
            <div class="border-b border-gray-200 p-4">
                <div class="flex justify-between items-center mb-2">
                    <div class="font-semibold text-blue-600">${route.from} → ${route.to}</div>
                    <div class="text-sm text-gray-500">${route.distance}km</div>
                </div>
                ${route.via ? `<div class="text-xs text-gray-500 mb-3">Via: ${route.via}</div>` : ''}
                
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="bg-blue-50 p-2 rounded">
                        <div class="font-semibold text-blue-800">Luggage</div>
                        <div class="font-bold">₹${Math.ceil(scaleLTotal)}</div>
                        <div class="text-gray-600">₹${scaleLRatePerKg.toFixed(2)}/kg</div>
                        ${route.luggageRate ? `
                            <div class="text-blue-600 font-medium">L: ₹${Math.ceil(route.luggageRate)}</div>
                        ` : ''}
                    </div>
                    <div class="bg-green-50 p-2 rounded">
                        <div class="font-semibold text-green-800">Premier</div>
                        <div class="font-bold">₹${Math.ceil(scalePTotal)}</div>
                        <div class="text-gray-600">₹${scalePRatePerKg.toFixed(2)}/kg</div>
                    </div>
                    <div class="bg-purple-50 p-2 rounded">
                        <div class="font-semibold text-purple-800">Rajdhani</div>
                        <div class="font-bold">₹${Math.ceil(scaleRTotal)}</div>
                        <div class="text-gray-600">₹${scaleRRatePerKg.toFixed(2)}/kg</div>
                    </div>
                    <div class="bg-orange-50 p-2 rounded">
                        <div class="font-semibold text-orange-800">Standard</div>
                        <div class="font-bold">₹${Math.ceil(scaleSTotal)}</div>
                        <div class="text-gray-600">₹${scaleSRatePerKg.toFixed(2)}/kg</div>
                    </div>
                </div>
                
                <div class="mt-2 bg-emerald-50 p-2 rounded">
                    <div class="font-semibold text-emerald-800 text-xs">JPP Rate</div>
                    <div class="font-bold text-emerald-600">₹${Math.ceil(jppTotal)}</div>
                    <div class="text-gray-600 text-xs">₹${(jppTotal / 100).toFixed(2)}/kg</div>
                </div>
            </div>
        `;
    });
    
    tableBody.innerHTML = tableHtml;
    mobileContainer.innerHTML = mobileHtml;
}

// Display custom route result
function displayCustomRouteResult(route, weight) {
    // Create or update custom route result section
    let customResultSection = document.getElementById('custom-route-result');
    
    if (!customResultSection) {
        customResultSection = document.createElement('div');
        customResultSection.id = 'custom-route-result';
        customResultSection.className = 'bg-white rounded-lg p-6 mb-8 shadow-md';
        
        // Insert before the route table
        const routeTable = document.querySelector('.bg-white.rounded-lg.shadow-md.overflow-hidden');
        routeTable.parentNode.insertBefore(customResultSection, routeTable);
    }
    
    customResultSection.innerHTML = `
        <h2 class="text-xl font-semibold mb-4">Custom Route Result</h2>
        <div class="bg-purple-50 rounded-lg p-4 mb-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>From:</strong> ${route.from}</div>
                <div><strong>To:</strong> ${route.to}</div>
                <div><strong>Distance:</strong> ${route.distance} km</div>
                <div><strong>Via:</strong> ${route.via || 'Direct'}</div>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 text-center">
                <h3 class="font-semibold text-blue-800 mb-2">Luggage Scale</h3>
                <div class="text-2xl font-bold text-blue-600">₹${Math.ceil(route.scaleL.totalRate)}</div>
                <div class="text-sm text-gray-600">₹${route.scaleL.ratePerKg.toFixed(2)}/kg</div>
            </div>
            <div class="bg-green-50 rounded-lg p-4 text-center">
                <h3 class="font-semibold text-green-800 mb-2">Premier Scale</h3>
                <div class="text-2xl font-bold text-green-600">₹${Math.ceil(route.scaleP.totalRate)}</div>
                <div class="text-sm text-gray-600">₹${route.scaleP.ratePerKg.toFixed(2)}/kg</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-4 text-center">
                <h3 class="font-semibold text-purple-800 mb-2">Rajdhani Scale</h3>
                <div class="text-2xl font-bold text-purple-600">₹${Math.ceil(route.scaleR.totalRate)}</div>
                <div class="text-sm text-gray-600">₹${route.scaleR.ratePerKg.toFixed(2)}/kg</div>
            </div>
            <div class="bg-orange-50 rounded-lg p-4 text-center">
                <h3 class="font-semibold text-orange-800 mb-2">Standard Scale</h3>
                <div class="text-2xl font-bold text-orange-600">₹${Math.ceil(route.scaleS.totalRate)}</div>
                <div class="text-sm text-gray-600">₹${route.scaleS.ratePerKg.toFixed(2)}/kg</div>
            </div>
            <div class="bg-emerald-50 rounded-lg p-4 text-center">
                <h3 class="font-semibold text-emerald-800 mb-2">JPP Rate</h3>
                <div class="text-2xl font-bold text-emerald-600">₹${Math.ceil(route.jppRate)}</div>
                <div class="text-sm text-gray-600">₹${(route.jppRate / weight).toFixed(2)}/kg</div>
            </div>
        </div>
        <div class="mt-4 text-center">
            <button onclick="document.getElementById('custom-route-result').remove()" 
                    class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">
                <i class="fas fa-times mr-2"></i>Close Result
            </button>
        </div>
    `;
}

// Show message
function showMessage(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Load rate data
    await loadRateData();
    
    // Load routes from localStorage
    loadRoutes();
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Calculate routes button
    const calculateBtn = document.getElementById('calculate-routes');
    const weightInput = document.getElementById('weight-input');
    
    if (calculateBtn && weightInput) {
        calculateBtn.addEventListener('click', function() {
            const weight = parseInt(weightInput.value);
            if (weight > 0) {
                const routeRates = calculateAllRouteRates(weight);
                displayRouteTable(routeRates);
                showMessage(`Rates calculated for ${weight}kg`, 'success');
            } else {
                showMessage('Please enter a valid weight', 'error');
            }
        });
        
        // Calculate on Enter key
        weightInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateBtn.click();
            }
        });
    }
    
    // Add custom route button
    const addCustomBtn = document.getElementById('add-custom-route');
    const fromStationInput = document.getElementById('from-station');
    const toStationInput = document.getElementById('to-station');
    const distanceInput = document.getElementById('distance-km');
    const viaInput = document.getElementById('via-station');
    
    if (addCustomBtn) {
        addCustomBtn.addEventListener('click', function() {
            const fromStation = fromStationInput.value.trim().toUpperCase();
            const toStation = toStationInput.value.trim().toUpperCase();
            const distance = parseInt(distanceInput.value);
            const via = viaInput.value.trim().toUpperCase();
            
            if (fromStation && toStation && distance > 0) {
                // Check if route already exists
                const existingRoute = routes.find(route => 
                    route.from === fromStation && 
                    route.to === toStation && 
                    route.distance === distance
                );
                
                if (existingRoute) {
                    showMessage('This route already exists!', 'error');
                    return;
                }
                
                // Add new route
                const newRoute = {
                    from: fromStation,
                    to: toStation,
                    distance: distance,
                    via: via || ''
                };
                
                routes.push(newRoute);
                
                // Save custom routes to localStorage
                const customRoutes = getCustomRoutes();
                saveCustomRoutes(customRoutes);
                
                // Save route addition timestamp for tracking
                saveRouteAddition(newRoute);
                
                // Clear inputs
                fromStationInput.value = '';
                toStationInput.value = '';
                distanceInput.value = '';
                viaInput.value = '';
                
                // Recalculate and display
                const weight = parseInt(weightInput.value) || 100;
                const routeRates = calculateAllRouteRates(weight);
                displayRouteTable(routeRates);
                
                showMessage(`Route ${fromStation} to ${toStation} added successfully and saved!`, 'success');
            } else {
                showMessage('Please fill in all required fields (From, To, Distance)', 'error');
            }
        });
    }
    
    // Calculate custom route button
    const calculateCustomBtn = document.getElementById('calculate-custom');
    
    if (calculateCustomBtn) {
        calculateCustomBtn.addEventListener('click', function() {
            const fromStation = fromStationInput.value.trim().toUpperCase();
            const toStation = toStationInput.value.trim().toUpperCase();
            const distance = parseInt(distanceInput.value);
            const via = viaInput.value.trim().toUpperCase();
            const weight = parseInt(weightInput.value) || 100;
            
            if (fromStation && toStation && distance > 0) {
                // Create temporary route for calculation
                const tempRoute = {
                    from: fromStation,
                    to: toStation,
                    distance: distance,
                    via: via || ''
                };
                
                // Calculate rates for this route
                const rates = {
                    from: tempRoute.from,
                    to: tempRoute.to,
                    distance: tempRoute.distance,
                    via: tempRoute.via,
                    scaleL: calculateScaleRate(tempRoute.distance, weight, 'L'),
                    scaleP: calculateScaleRate(tempRoute.distance, weight, 'P'),
                    scaleR: calculateScaleRate(tempRoute.distance, weight, 'R'),
                    scaleS: calculateScaleRate(tempRoute.distance, weight, 'S'),
                    jppRate: 0
                };
                
                // Calculate JPP rate (Scale P + 10%)
                if (rates.scaleP.baseRate > 0) {
                    const jppBaseRate = rates.scaleP.baseRate * 1.1;
                    const jppDSC = jppBaseRate * 0.02;
                    const jppRateAfterDSC = jppBaseRate + jppDSC;
                    const jppGST = jppRateAfterDSC * 0.05;
                    rates.jppRate = jppRateAfterDSC + jppGST;
                }
                
                // Display custom route result
                displayCustomRouteResult(rates, weight);
                showMessage(`Custom route calculated for ${weight}kg`, 'success');
            } else {
                showMessage('Please fill in all required fields (From, To, Distance)', 'error');
            }
        });
    }
    
    // Search functionality
    const searchFromInput = document.getElementById('search-from');
    const searchToInput = document.getElementById('search-to');
    const searchBtn = document.getElementById('search-routes');
    const clearSearchBtn = document.getElementById('clear-search');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchFrom = searchFromInput.value.trim().toUpperCase();
            const searchTo = searchToInput.value.trim().toUpperCase();
            const weight = parseInt(weightInput.value) || 100;
            
            // Filter routes based on search criteria
            let filteredRoutes = routes;
            
            if (searchFrom) {
                filteredRoutes = filteredRoutes.filter(route => 
                    route.from.includes(searchFrom)
                );
            }
            
            if (searchTo) {
                filteredRoutes = filteredRoutes.filter(route => 
                    route.to.includes(searchTo)
                );
            }
            
            // Calculate rates for filtered routes
            const filteredRouteRates = filteredRoutes.map(route => {
                const rates = {
                    from: route.from,
                    to: route.to,
                    distance: route.distance,
                    via: route.via,
                    scaleL: calculateScaleRate(route.distance, weight, 'L'),
                    scaleP: calculateScaleRate(route.distance, weight, 'P'),
                    scaleR: calculateScaleRate(route.distance, weight, 'R'),
                    scaleS: calculateScaleRate(route.distance, weight, 'S'),
                    jppRate: 0
                };
                
                // Calculate JPP rate (Scale P + 10%)
                if (rates.scaleP.baseRate > 0) {
                    const jppBaseRate = rates.scaleP.baseRate * 1.1;
                    const jppDSC = jppBaseRate * 0.02;
                    const jppRateAfterDSC = jppBaseRate + jppDSC;
                    const jppGST = jppRateAfterDSC * 0.05;
                    rates.jppRate = jppRateAfterDSC + jppGST;
                }
                
                return rates;
            });
            
            displayRouteTable(filteredRouteRates);
            
            if (filteredRouteRates.length === 0) {
                showMessage('No routes found matching your search criteria', 'warning');
            } else {
                showMessage(`Found ${filteredRouteRates.length} route(s) matching your search`, 'success');
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchFromInput.value = '';
            searchToInput.value = '';
            
            // Trigger search to show all routes
            performSearch();
            
            showMessage('Search cleared, showing all routes', 'info');
        });
    }
    
    // Real-time search functionality
    if (searchFromInput) {
        searchFromInput.addEventListener('input', function() {
            performSearch();
        });
        
        searchFromInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
    
    if (searchToInput) {
        searchToInput.addEventListener('input', function() {
            performSearch();
        });
        
        searchToInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
    
    // Function to perform search
    function performSearch() {
        const searchFrom = searchFromInput.value.trim().toUpperCase();
        const searchTo = searchToInput.value.trim().toUpperCase();
        const weight = parseInt(weightInput.value) || 100;
        
        // Filter routes based on search criteria
        let filteredRoutes = routes;
        
        if (searchFrom) {
            filteredRoutes = filteredRoutes.filter(route => 
                route.from.includes(searchFrom)
            );
        }
        
        if (searchTo) {
            filteredRoutes = filteredRoutes.filter(route => 
                route.to.includes(searchTo)
            );
        }
        
        // Calculate rates for filtered routes
        const filteredRouteRates = filteredRoutes.map(route => {
            const rates = {
                from: route.from,
                to: route.to,
                distance: route.distance,
                via: route.via,
                scaleL: calculateScaleRate(route.distance, weight, 'L'),
                scaleP: calculateScaleRate(route.distance, weight, 'P'),
                scaleR: calculateScaleRate(route.distance, weight, 'R'),
                scaleS: calculateScaleRate(route.distance, weight, 'S'),
                jppRate: 0
            };
            
            // Calculate JPP rate (Scale P + 10%)
            if (rates.scaleP.baseRate > 0) {
                const jppBaseRate = rates.scaleP.baseRate * 1.1;
                const jppDSC = jppBaseRate * 0.02;
                const jppRateAfterDSC = jppBaseRate + jppDSC;
                const jppGST = jppRateAfterDSC * 0.05;
                rates.jppRate = jppRateAfterDSC + jppGST;
            }
            
            return rates;
        });
        
        displayRouteTable(filteredRouteRates);
        
        // Show subtle feedback for search results
        if (searchFrom || searchTo) {
            if (filteredRouteRates.length === 0) {
                showMessage('No routes found', 'warning');
            } else if (filteredRouteRates.length < routes.length) {
                showMessage(`${filteredRouteRates.length} route(s) found`, 'info');
            }
        }
    }
    
    // Initial calculation with default weight
    const defaultWeight = parseInt(weightInput.value) || 100;
    
    try {
        const initialRouteRates = calculateAllRouteRates(defaultWeight);
        displayRouteTable(initialRouteRates);
        showMessage('Route table loaded successfully', 'success');
    } catch (error) {
        console.error('Error in initial calculation:', error);
        showMessage('Error loading route data. Please try again.', 'error');
        
        // Fallback: show at least the route structure without rates
        const fallbackRates = routes.map(route => ({
            from: route.from,
            to: route.to,
            distance: route.distance,
            via: route.via,
            scaleL: { totalRate: 0, ratePerKg: 0 },
            scaleP: { totalRate: 0, ratePerKg: 0 },
            scaleR: { totalRate: 0, ratePerKg: 0 },
            scaleS: { totalRate: 0, ratePerKg: 0 },
            jppRate: 0
        }));
        displayRouteTable(fallbackRates);
    }
}); 