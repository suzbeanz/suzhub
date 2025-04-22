// Get references to SVG and container elements
const svg = document.getElementById('interactive-svg-bg');
const svgNS = 'http://www.w3.org/2000/svg'; // SVG namespace
const dotContainer = document.getElementById('dot-container'); // Container for the grid elements

// --- State Variables ---
let groups = [];      // Array to hold the SVG group elements (<g>) for each plus sign
let positions = [];   // Array to hold the current animated {x, y} position of each group
let origins = [];     // Array to hold the original {x, y} position of each group
let mousePos = { x: -10000, y: -10000 }; // Stores mouse coordinates relative to the SVG canvas
let mouseScreenPos = { x: -10000, y: -10000 }; // Stores mouse coordinates relative to the screen/viewport

// --- Configuration Constants ---
const gridSpacing = 45;     // Distance between grid points
const plusSize = 3;         // Length of each arm of the plus sign from the center
const plusStrokeWidth = 1.5;// Thickness of the plus sign lines
const plusColor = "#383838"; // Color of the plus signs
const viewBoxSize = 1000;   // Assumed size of the SVG viewBox for grid generation

// Interaction parameters
const repelRadius = 130;    // Radius around the mouse where plus signs are repelled
const repelStrength = 35;   // How strongly the plus signs are pushed away
const easeFactor = 0.18;    // Easing factor for the animation (lower = smoother, slower)

// Text glow effect elements and parameters
const heading = document.getElementById('main-heading');
const subheading = document.getElementById('sub-heading');
const glowElements = [ // Array to manage elements that should glow
    { el: heading, targetIntensity: 0, currentIntensity: 0, rect: null },
    { el: subheading, targetIntensity: 0, currentIntensity: 0, rect: null }
];
const glowRadius = 250;     // Radius around the mouse where text glows
const maxGlowBlur = 12;     // Maximum blur intensity for the text glow
const glowEaseFactor = 0.15;// Easing factor for the glow effect

// Surprise elements (optional)
const dangerLink = document.getElementById('danger-link');
const surpriseImage = document.getElementById('surprise-image');

/**
 * Updates the cached bounding rectangles for elements that have the glow effect.
 * Called on load and resize.
 */
function updateTextRects() {
    glowElements.forEach(item => {
        if (item.el) {
            item.rect = item.el.getBoundingClientRect(); // Get screen coordinates and dimensions
        }
    });
}

/**
 * Creates the grid of plus signs within the SVG.
 * Clears existing elements and populates the grid based on configuration.
 */
function createDotGrid() {
    // Clear previous grid elements and state
    dotContainer.innerHTML = '';
    groups = [];
    positions = [];
    origins = [];

    // Loop through grid positions
    for (let x = gridSpacing / 2; x < viewBoxSize; x += gridSpacing) {
        for (let y = gridSpacing / 2; y < viewBoxSize; y += gridSpacing) {
            // Create a group <g> element to hold the lines of the plus sign
            const group = document.createElementNS(svgNS, 'g');
            group.setAttribute('class', 'interactive-group'); // Assign class for potential styling

            // --- Create Plus Sign ---
            // Horizontal line
            const line1 = document.createElementNS(svgNS, 'line');
            line1.setAttribute('x1', -plusSize); // Start left of center
            line1.setAttribute('y1', 0);
            line1.setAttribute('x2', plusSize);  // End right of center
            line1.setAttribute('y2', 0);
            line1.setAttribute('stroke', plusColor); // Set color
            line1.setAttribute('stroke-width', plusStrokeWidth); // Set thickness

            // Vertical line
            const line2 = document.createElementNS(svgNS, 'line');
            line2.setAttribute('x1', 0);
            line2.setAttribute('y1', -plusSize); // Start above center
            line2.setAttribute('x2', 0);
            line2.setAttribute('y2', plusSize);  // End below center
            line2.setAttribute('stroke', plusColor); // Set color
            line2.setAttribute('stroke-width', plusStrokeWidth); // Set thickness

            // Add lines to the group
            group.appendChild(line1);
            group.appendChild(line2);

            // Set the initial position of the group
            group.setAttribute('transform', `translate(${x}, ${y})`);

            // Add the group to the container in the SVG
            dotContainer.appendChild(group);

            // Store references and initial positions for animation
            groups.push(group);
            origins.push({ x: x, y: y });
            positions.push({ x: x, y: y });
        }
    }
}

/**
 * Converts screen coordinates (like mouse event clientX/clientY) to SVG coordinates.
 * @param {MouseEvent|TouchEvent} event - The mouse or touch event.
 * @returns {{x: number, y: number}} The coordinates within the SVG's coordinate system.
 */
function getSvgCoordinates(event) {
    const pt = svg.createSVGPoint(); // Create an SVG point
    pt.x = event.clientX; // Set its x coordinate to the screen x
    pt.y = event.clientY; // Set its y coordinate to the screen y
    try {
        // Check if necessary methods exist
        if (svg.getScreenCTM && svg.createSVGPoint) {
            // Get the transformation matrix from screen to SVG
            const screenToSvgMatrix = svg.getScreenCTM().inverse();
            // Transform the point using the matrix
            const svgPoint = pt.matrixTransform(screenToSvgMatrix);
            return { x: svgPoint.x, y: svgPoint.y };
        } else {
            // Fallback if methods aren't available
            console.warn("SVG coordinate conversion methods not fully supported.");
            return { x: -10000, y: -10000 }; // Return off-screen coordinates
        }
    } catch (error) {
        // Catch potential errors during transformation
        console.error("Error converting screen coordinates to SVG:", error);
        return { x: -10000, y: -10000 }; // Return off-screen coordinates on error
    }
}

/**
 * Updates the mouse position variables based on the event.
 * @param {MouseEvent|Touch} event - The mouse or touch event object.
 */
function updateMousePositions(event) {
    mousePos = getSvgCoordinates(event); // Update SVG-relative mouse position
    mouseScreenPos = { x: event.clientX, y: event.clientY }; // Update screen-relative mouse position
}

// --- Event Listeners ---

// Update mouse position on mouse move
window.addEventListener('mousemove', updateMousePositions);

// Reset mouse position when the mouse leaves the window
window.addEventListener('mouseleave', () => {
    mousePos = { x: -10000, y: -10000 };
    mouseScreenPos = { x: -10000, y: -10000 };
});

// Reset mouse position when a touch ends
window.addEventListener('touchend', () => {
    mousePos = { x: -10000, y: -10000 };
    mouseScreenPos = { x: -10000, y: -10000 };
});

// Update mouse position on touch move
window.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
        const touch = event.touches[0]; // Use the first touch point
        updateMousePositions(touch);
    }
});

// Optional: Event listener for the danger link and surprise image
if (dangerLink && surpriseImage) {
    dangerLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        surpriseImage.classList.add('visible'); // Show the image
    });

    surpriseImage.addEventListener('click', () => {
        surpriseImage.classList.remove('visible'); // Hide the image on click
    });
}

/**
 * The main animation loop, called recursively using requestAnimationFrame.
 * Updates the position of each plus sign and the glow effect on text elements.
 */
function animationLoop() {
    // Animate each plus sign group
    groups.forEach((group, index) => {
        const origin = origins[index];     // Original position
        const position = positions[index]; // Current animated position

        let targetX = origin.x; // Target position starts at the origin
        let targetY = origin.y;

        // Calculate distance from the plus sign's origin to the mouse position in SVG coordinates
        const dxMouseOrigin = origin.x - mousePos.x;
        const dyMouseOrigin = origin.y - mousePos.y;
        const distance = Math.sqrt(dxMouseOrigin * dxMouseOrigin + dyMouseOrigin * dyMouseOrigin);

        // If the mouse is within the repel radius, calculate repulsion
        if (distance < repelRadius && distance > 1) { // Avoid division by zero if distance is very small
            const repelForce = (repelRadius - distance) / repelRadius; // Force is stronger closer to the mouse
            const angle = Math.atan2(dyMouseOrigin, dxMouseOrigin); // Angle from mouse to the plus sign

            // Calculate displacement based on angle and force
            const displacementX = Math.cos(angle) * repelForce * repelStrength;
            const displacementY = Math.sin(angle) * repelForce * repelStrength;

            // Update the target position
            targetX = origin.x + displacementX;
            targetY = origin.y + displacementY;
        }

        // Ease the current position towards the target position
        position.x += (targetX - position.x) * easeFactor;
        position.y += (targetY - position.y) * easeFactor;

        // Apply the updated position to the group's transform attribute
        // Rounding to 2 decimal places for potentially smoother rendering
        const transX = Math.round(position.x * 100) / 100;
        const transY = Math.round(position.y * 100) / 100;
        group.setAttribute('transform', `translate(${transX}, ${transY})`);
    });

    // Animate the text glow effect
    glowElements.forEach(item => {
        // Skip if the element or its rectangle data is missing
        if (!item.el || !item.rect) return;

        // Calculate the center of the text element in screen coordinates
        const centerX = item.rect.left + item.rect.width / 2 + window.scrollX;
        const centerY = item.rect.top + item.rect.height / 2 + window.scrollY;

        // Calculate distance from the text center to the mouse position in screen coordinates
        // Add scroll offsets to account for page scrolling
        const dx = centerX - (mouseScreenPos.x + window.scrollX);
        const dy = centerY - (mouseScreenPos.y + window.scrollY);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Determine target glow intensity based on distance
        if (distance < glowRadius) {
            // Intensity increases quadratically as the mouse gets closer
            item.targetIntensity = (1 - (distance / glowRadius)) ** 2;
        } else {
            // No glow if the mouse is outside the radius
            item.targetIntensity = 0;
        }

        // Ease the current intensity towards the target intensity
        item.currentIntensity += (item.targetIntensity - item.currentIntensity) * glowEaseFactor;

        // Calculate the blur amount based on the current intensity
        const blur = item.currentIntensity * maxGlowBlur;

        // Apply the text-shadow style for the glow effect
        // Uses CSS variables for color (--glow-color should be defined in your CSS)
        item.el.style.textShadow = blur > 0.1 // Only apply if blur is noticeable
            ? `0 0 ${blur}px var(--glow-color), 0 0 ${blur * 1.5}px var(--glow-color)` // Apply two shadows for a fuller glow
            : ''; // Remove shadow if blur is negligible
    });

    // Request the next frame of the animation
    requestAnimationFrame(animationLoop);
}

// --- Initialization ---

// Update text element rectangles when the window is resized
window.addEventListener('resize', updateTextRects);

// When the DOM is fully loaded, initialize the grid and start the animation
window.addEventListener('DOMContentLoaded', () => {
    updateTextRects();  // Get initial positions of text elements
    createDotGrid();    // Create the plus sign grid
    animationLoop();    // Start the animation loop
});
