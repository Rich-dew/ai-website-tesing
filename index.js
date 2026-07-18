/**
 * AETHER — Interactive Scroll Animation Logic
 */

// Configuration
const TOTAL_FRAMES = 223;
const images = [];
let loadedCount = 0;

const wrapper = document.getElementById('overview');
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const loaderPercent = document.getElementById('loader-percent');
const navLinks = document.querySelectorAll('.nav-link');

// Animation State
let targetFrame = 0;
let currentFrame = 0;
let isLooping = false;

// Helper to pad numbers to 3 digits (e.g. 1 -> "001")
function pad(num) {
    return num.toString().padStart(3, '0');
}

// Start preloading images
function preloadImages() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = `ezgif-frame-${pad(i)}.jpg`;
        img.onload = () => {
            loadedCount++;
            updatePreloaderProgress();
            
            // Check if loading is complete
            if (loadedCount === TOTAL_FRAMES) {
                setTimeout(initializeShowcase, 400); // Slight delay for transition
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image frame: ${img.src}`);
            loadedCount++;
            updatePreloaderProgress();
            if (loadedCount === TOTAL_FRAMES) {
                setTimeout(initializeShowcase, 400);
            }
        };
        images.push(img);
    }
}

// Update the preloader percentage and progress bar
function updatePreloaderProgress() {
    const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
    progressBar.style.width = `${percent}%`;
    loaderPercent.textContent = `${percent.toString().padStart(2, '0')}%`;
}

// Run canvas scaling and initial frame drawing
function initializeShowcase() {
    // Hide the preloader screen
    preloader.classList.add('fade-out');
    
    // Set up canvas dimensions
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Draw initial frame
    renderFrame(0);
    
    // Start listening to scroll events
    window.addEventListener('scroll', handleScroll);
    
    // Setup Section Observer to update navbar links dynamically
    setupNavObserver();
}

// Scale canvas matching device pixel ratio to keep visuals sharp
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    // Scale size matching client display size
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    
    // Scale context back to normal viewport sizing
    ctx.scale(dpr, dpr);
    
    // Redraw current frame
    renderFrame(Math.round(currentFrame));
}

// Draw the specified frame index to the canvas with "cover" behavior
function renderFrame(index) {
    const img = images[index];
    if (!img || !img.complete) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get viewport size for canvas drawing space
    const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
    const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
    
    // Calculate aspect ratios
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    // "cover" scaling math
    if (canvasRatio > imgRatio) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgRatio;
        drawX = 0;
        drawY = (canvasHeight - drawHeight) / 2;
    } else {
        drawWidth = canvasHeight * imgRatio;
        drawHeight = canvasHeight;
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = 0;
    }
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// Calculate target frame on scroll
function handleScroll() {
    const rect = wrapper.getBoundingClientRect();
    const header = document.querySelector('.navbar');
    const headerHeight = header ? header.offsetHeight : 72;
    const stickyHeight = window.innerHeight - headerHeight;
    
    // Total vertical scroll range where the section is sticky
    const scrollRange = wrapper.offsetHeight - stickyHeight;
    const currentScroll = headerHeight - rect.top;
    
    // Scroll progress as fraction (0.0 to 1.0)
    let progress = currentScroll / scrollRange;
    progress = Math.min(1, Math.max(0, progress));
    
    // Calculate frame index based on progress
    targetFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(progress * TOTAL_FRAMES)));
    
    // Start lerp loop if not already running
    if (!isLooping) {
        isLooping = true;
        requestAnimationFrame(updateAnimationLoop);
    }
}

// Animation loop that interpolates current frame to target frame (lerp)
function updateAnimationLoop() {
    const diff = targetFrame - currentFrame;
    
    if (Math.abs(diff) > 0.05) {
        // Smoothly ease towards target frame (0.09 dampening factor)
        currentFrame += diff * 0.09; 
        renderFrame(Math.round(currentFrame));
        requestAnimationFrame(updateAnimationLoop);
        isLooping = true;
    } else {
        currentFrame = targetFrame;
        renderFrame(Math.round(currentFrame));
        isLooping = false;
    }
}

// Auto highlight nav menu items as sections scroll into viewport center
function setupNavObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -40% 0px', // trigger when section occupies screen center
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const activeId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${activeId}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    // Observe all page sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}

// Initialize on script load
preloadImages();
