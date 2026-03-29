/**
 * German Soul - Main JavaScript File
 */

'use strict';

// ===== DOM ELEMENTS =====
const header = document.getElementById('header');
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav ul li a, .mobile-nav ul li a');
const enrollForm = document.getElementById('enrollForm');
const menuToggle = document.getElementById('mobileMenuToggle');
const mobileNav = document.getElementById('mobileNav');

// ===== EMAILJS CONFIGURATION =====
// IMPORTANT: Replace these with your actual EmailJS credentials
// Get them from: https://www.emailjs.com
const EMAILJS_CONFIG = {
    PUBLIC_KEY: '_b9oKptcJCO8jvJ0t',     // From Account > API Keys
    SERVICE_ID: 'service_6wcyrx2',     // From Email Services
    TEMPLATE_ID: 'template_uyf65pe'    // From Email Templates
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize EmailJS first [citation:1][citation:5]
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        console.log('EmailJS initialized successfully');
    } else {
        console.error('EmailJS library not loaded. Check your script include.');
    }
    
    initScrollEffects();
    initMobileMenu();
    initFormValidation();
    initIntersectionObserver();
});

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    // Header scroll effect
    window.addEventListener('scroll', () => {
        header?.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Update URL without jumping
                history.pushState(null, null, this.getAttribute('href'));
                
                // Close mobile menu if open
                if (mobileNav?.classList.contains('active')) {
                    closeMobileMenu();
                }
            }
        });
    });

    // Active nav link based on scroll
    window.addEventListener('scroll', throttle(updateActiveNavLink, 100));
}

function updateActiveNavLink() {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// ===== MOBILE MENU FUNCTIONALITY =====
function initMobileMenu() {
    if (!menuToggle || !mobileNav) return;
    
    // Toggle menu
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    });
    
    // Close menu when clicking a link
    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileNav.classList.contains('active') && 
            !mobileNav.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    menuToggle.classList.toggle('open');
    mobileNav.classList.toggle('active');
    document.body.classList.toggle('menu-open');
}

function closeMobileMenu() {
    menuToggle.classList.remove('open');
    mobileNav.classList.remove('active');
    document.body.classList.remove('menu-open');
}

// ===== FORM HANDLING WITH EMAILJS =====
function initFormValidation() {
    if (!enrollForm) return;
    
    enrollForm.addEventListener('submit', handleFormSubmit);
    
    // Real-time validation
    enrollForm.querySelectorAll('input[required], textarea[required]').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => clearFieldError(field));
    });
}

function handleFormSubmit(e) {
    e.preventDefault(); // Prevent default form submission [citation:5][citation:9]
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Get form data
    const formData = {
        name: document.getElementById('name')?.value?.trim() || '',
        email: document.getElementById('email')?.value?.trim() || '',
        phone: document.getElementById('phone')?.value?.trim() || '',
        course: document.getElementById('course')?.value || '',
        message: document.getElementById('message')?.value?.trim() || ''
    };
    
    // Validate form
    if (!validateForm(formData)) {
        showNotification('Please fill in all required fields', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }
    
    // Check if EmailJS is available
    if (typeof emailjs === 'undefined') {
        showNotification('Email service not available. Please try again later.', 'error');
        console.error('EmailJS library not loaded');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }
    
    // Prepare template parameters for EmailJS [citation:5][citation:6]
    const templateParams = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        course: formData.course,
        message: formData.message,
        to_email: 'gsoulonlinelearning@gmail.com', // Your receiving email
        reply_to: formData.email
    };
    
    // Send email using EmailJS [citation:3][citation:9]
    emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
    )
    .then(function(response) {
        console.log('Email sent successfully!', response.status, response.text); // [citation:5]
        showNotification('Thank you for your enquiry! We will contact you soon.', 'success');
        enrollForm.reset(); // Clear form on success [citation:7]
    })
    .catch(function(error) {
        console.error('Failed to send email:', error); // [citation:5]
        showNotification('Failed to send message. Please try again or call us directly.', 'error');
    })
    .finally(function() {
        // Restore button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

function validateForm(data) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    
    if (!data.name || data.name.length < 2) return false;
    if (!data.email || !emailRegex.test(data.email)) return false;
    if (data.phone && !phoneRegex.test(data.phone.replace(/\s/g, ''))) return false;
    if (!data.message || data.message.length < 1) return false;
    
    return true;
}

function validateField(field) {
    if (!field.value.trim()) {
        showFieldError(field, 'This field is required');
        return false;
    }
    return true;
}

function showFieldError(field, message) {
    clearFieldError(field);
    field.style.borderColor = 'var(--accent-red)';
    const error = document.createElement('div');
    error.className = 'field-error';
    error.textContent = message;
    error.style.color = 'var(--accent-red)';
    error.style.fontSize = '0.875rem';
    error.style.marginTop = '0.25rem';
    field.parentNode.appendChild(error);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    const error = field.parentNode.querySelector('.field-error');
    if (error) error.remove();
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? 'var(--primary-gold)' : 'var(--accent-red)'};
        color: var(--primary-black);
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        box-shadow: var(--shadow-lg);
        max-width: 90%;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== INTERSECTION OBSERVER =====
function initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements
    document.querySelectorAll('section, .course-card, .stat-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ===== UTILITY FUNCTIONS =====
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}