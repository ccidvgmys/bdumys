// Railway Parcel Services Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });





    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactForm();
        });
    }

    // Add animation classes to elements when they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
            }
        });
    }, observerOptions);

    // Observe all service cards and other elements
    document.querySelectorAll('.service-card, .bg-white.rounded-lg').forEach(el => {
        observer.observe(el);
    });
});





// Handle contact form submission
function handleContactForm() {
    const form = document.getElementById('contact-form');
    const formData = new FormData(form);
    
    // Basic validation
    const name = formData.get('name') || '';
    const email = formData.get('email') || '';
    const message = formData.get('message') || '';
    
    if (!name || !email || !message) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div> Sending...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        showMessage('Thank you for your message! We will get back to you soon.', 'success');
        form.reset();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// Calculate estimated rate based on weight and service type
function calculateRate(weight, serviceType) {
    let baseRate = 0;
    
    switch(serviceType) {
        case 'Counter Booking':
            baseRate = 15; // ₹15 per kg
            break;
        case 'Leasing Services':
            baseRate = 12; // ₹12 per kg (bulk discount)
            break;
        case 'Joint Parcel Product':
            baseRate = 25; // ₹25 per kg (includes pickup/delivery)
            break;
        case 'Kisan Rail':
            baseRate = 7.5; // ₹7.5 per kg (50% subsidy)
            break;
        default:
            baseRate = 15;
    }
    
    // Apply weight-based discounts
    let discount = 0;
    if (weight > 100) discount = 0.15; // 15% discount for >100kg
    else if (weight > 50) discount = 0.10; // 10% discount for >50kg
    else if (weight > 20) discount = 0.05; // 5% discount for >20kg
    
    const totalRate = weight * baseRate * (1 - discount);
    return totalRate;
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

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Add WhatsApp integration
function initWhatsAppIntegration() {
    const whatsappBtn = document.createElement('a');
    whatsappBtn.href = 'https://wa.me/919731667962?text=Hi, I would like to know more about your parcel services.';
    whatsappBtn.target = '_blank';
    whatsappBtn.className = 'fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-300 z-40';
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp text-2xl"></i>';
    whatsappBtn.title = 'Chat with us on WhatsApp';
    
    document.body.appendChild(whatsappBtn);
}

// Initialize WhatsApp integration
initWhatsAppIntegration(); 