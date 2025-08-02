// Progressive Web App functionality - Best Practices Implementation
class ParcelCalculatorPWA {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }

    async init() {
       
        
        // Check if already installed
        this.checkIfInstalled();
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Setup install prompt listener
        this.setupInstallPrompt();
        
        // Track user engagement
        this.trackUserEngagement();
        
        // Setup connectivity detection
        this.setupConnectivityDetection();
    }

    checkIfInstalled() {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            
            this.isInstalled = true;
            return true;
        }
        
        // Check if running in fullscreen mode
        if (window.matchMedia('(display-mode: fullscreen)').matches) {
           
            this.isInstalled = true;
            return true;
        }
        
        return false;
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
               
                
                // Handle service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                           
                            window.location.reload();
                        }
                    });
                });
                
                return registration;
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        } else {
            console.log('Service Worker not supported');
        }
    }

    setupInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
           
            
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Store the event so it can be triggered later
            this.deferredPrompt = e;
            window.deferredPrompt = e;
            
            // DISABLED: No automatic notification
            // this.showInstallNotification();
            
            // Update any UI to notify the user they can install the PWA
            this.updateInstallUI();
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', (evt) => {
           
            this.isInstalled = true;
            this.deferredPrompt = null;
            window.deferredPrompt = null;
            
            // Hide install UI
            this.hideInstallUI();
            
            // Show success notification
            this.showNotification('App installed successfully! 🎉', 'success');
        });
    }

    trackUserEngagement() {
        // DISABLED: No automatic install prompts
        // Only manual installation through button is allowed
        console.log('Automatic install prompts disabled - use manual install button only');
    }

    tryShowInstallPrompt() {
        if (this.deferredPrompt && !this.isInstalled) {
          
            
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            this.deferredPrompt.userChoice.then((choiceResult) => {
                
                
                if (choiceResult.outcome === 'accepted') {
                   
                    this.showNotification('Installing app...', 'info');
                } else {
                    // User dismissed the prompt - remember this for 24 hours
                    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
                    console.log('User dismissed install prompt, will not show again for 24 hours');
                }
                
                // Clear the deferredPrompt
                this.deferredPrompt = null;
                window.deferredPrompt = null;
                
                // Hide install UI
                this.hideInstallUI();
            });
        } else {
           
        }
    }

    showInstallNotification() {
        // Remove existing notification
        this.hideInstallNotification();
        
        const notification = document.createElement('div');
        notification.id = 'pwa-install-notification';
        notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <span class="text-lg mr-2">📱</span>
                    <div>
                        <div class="font-semibold">Install App</div>
                        <div class="text-sm opacity-90">Add to home screen for quick access</div>
                    </div>
                </div>
                <button onclick="window.parcelCalculatorPWA.hideInstallNotification()" class="ml-3 text-white hover:text-gray-200">
                    <span class="text-xl">×</span>
                </button>
            </div>
            <button onclick="window.parcelCalculatorPWA.tryShowInstallPrompt()" class="w-full mt-3 bg-white text-blue-600 py-2 px-4 rounded font-semibold hover:bg-gray-100 transition">
                Install Now
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideInstallNotification();
        }, 10000);
    }

    hideInstallNotification() {
        const notification = document.getElementById('pwa-install-notification');
        if (notification) {
            notification.remove();
        }
    }

    updateInstallUI() {
        // Update any existing install buttons or UI elements
        const installButtons = document.querySelectorAll('[data-pwa-install]');
        installButtons.forEach(button => {
            button.style.display = 'block';
            button.addEventListener('click', () => this.tryShowInstallPrompt());
        });
    }

    hideInstallUI() {
        // Hide install-related UI elements
        const installButtons = document.querySelectorAll('[data-pwa-install]');
        installButtons.forEach(button => {
            button.style.display = 'none';
        });
        
        this.hideInstallNotification();
    }

    setupConnectivityDetection() {
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('You are offline - some features may be limited', 'warning');
        });
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.pwa-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `pwa-notification fixed top-20 right-4 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transition-all duration-300 transform translate-x-full`;
        
        // Set background color based on type
        const colors = {
            success: 'bg-green-600',
            warning: 'bg-yellow-600',
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.parcelCalculatorPWA = new ParcelCalculatorPWA();
    
    // Setup manual install button
    const manualInstallBtn = document.getElementById('manual-install-btn');
    if (manualInstallBtn) {
        manualInstallBtn.addEventListener('click', () => {
            if (window.parcelCalculatorPWA.deferredPrompt && !window.parcelCalculatorPWA.isInstalled) {
                window.parcelCalculatorPWA.tryShowInstallPrompt();
            } else if (window.parcelCalculatorPWA.isInstalled) {
                window.parcelCalculatorPWA.showNotification('App is already installed!', 'success');
            } else {
                window.parcelCalculatorPWA.showNotification('Install prompt not available. Try refreshing the page.', 'error');
            }
        });
    }
});

// Global function to manually trigger install
window.triggerInstall = function() {
    if (window.parcelCalculatorPWA) {
        window.parcelCalculatorPWA.tryShowInstallPrompt();
    } else if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
            console.log('User choice:', choiceResult.outcome);
            window.deferredPrompt = null;
        });
    } else {
        alert('Install prompt not available. Try interacting with the page first.');
    }
};

// Global function to check PWA status
window.checkPWAStatus = function() {
    const status = {
        isInstalled: window.matchMedia('(display-mode: standalone)').matches,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasInstallPrompt: !!(window.deferredPrompt || (window.parcelCalculatorPWA && window.parcelCalculatorPWA.deferredPrompt)),
        isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
        userAgent: navigator.userAgent
    };
    
  
    return status;
}; 