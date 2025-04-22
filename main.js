const svg = document.getElementById('interactive-svg-bg');
const svgNS = 'http://www.w3.org/2000/svg';
const dotContainer = document.getElementById('dot-container');
let groups = [];
let positions = [];
let origins = [];
let mousePos = { x: -10000, y: -10000 };

const gridSpacing = 45;
const dotRadius = 2.5;
const dotColor = "#383838";
const viewBoxSize = 1000;

const repelRadius = 130;
const repelStrength = 35;
const easeFactor = 0.18;

const heading = document.getElementById('main-heading');
const subheading = document.getElementById('sub-heading');
const glowElements = [
    { el: heading, targetIntensity: 0, currentIntensity: 0, rect: null },
    { el: subheading, targetIntensity: 0, currentIntensity: 0, rect: null }
];
const glowRadius = 250;
const maxGlowBlur = 12;
const glowEaseFactor = 0.15;
let mouseScreenPos = { x: -10000, y: -10000 };

const dangerLink = document.getElementById('danger-link');
const surpriseImage = document.getElementById('surprise-image');

function updateTextRects() {
    glowElements.forEach(item => {
        if (item.el) {
            item.rect = item.el.getBoundingClientRect();
        }
    });
}

function createDotGrid() {
    dotContainer.innerHTML = '';
    groups = [];
    positions = [];
    origins = [];

    for (let x = gridSpacing / 2; x < viewBoxSize; x += gridSpacing) {
        for (let y = gridSpacing / 2; y < viewBoxSize; y += gridSpacing) {
            const group = document.createElementNS(svgNS, 'g');
            group.setAttribute('class', 'interactive-group');

            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', 0);
            circle.setAttribute('cy', 0);
            circle.setAttribute('r', dotRadius);
            circle.setAttribute('fill', dotColor);

            group.setAttribute('transform', `translate(${x}, ${y})`);

            group.appendChild(circle);
            dotContainer.appendChild(group);

            groups.push(group);
            origins.push({ x: x, y: y });
            positions.push({ x: x, y: y });
        }
    }
}

function getSvgCoordinates(event) {
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    try {
        if (svg.getScreenCTM && svg.createSVGPoint) {
            const screenToSvgMatrix = svg.getScreenCTM().inverse();
            const svgPoint = pt.matrixTransform(screenToSvgMatrix);
            return { x: svgPoint.x, y: svgPoint.y };
        } else {
            return { x: -10000, y: -10000 };
        }
    } catch (error) {
        return { x: -10000, y: -10000 };
    }
}

function updateMousePositions(event) {
    mousePos = getSvgCoordinates(event);
    mouseScreenPos = { x: event.clientX, y: event.clientY };
}

window.addEventListener('mousemove', updateMousePositions);
window.addEventListener('mouseleave', () => {
    mousePos = { x: -10000, y: -10000 };
    mouseScreenPos = { x: -10000, y: -10000 };
});
window.addEventListener('touchend', () => {
    mousePos = { x: -10000, y: -10000 };
    mouseScreenPos = { x: -10000, y: -10000 };
});
window.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        updateMousePositions(touch);
    }
});

if (dangerLink && surpriseImage) {
    dangerLink.addEventListener('click', (event) => {
        event.preventDefault();
        surpriseImage.classList.add('visible');
    });

    surpriseImage.addEventListener('click', () => {
        surpriseImage.classList.remove('visible');
    });
}

function animationLoop() {
    groups.forEach((group, index) => {
        const origin = origins[index];
        const position = positions[index];

        let targetX = origin.x;
        let targetY = origin.y;

        const dxMouseOrigin = origin.x - mousePos.x;
        const dyMouseOrigin = origin.y - mousePos.y;
        const distance = Math.sqrt(dxMouseOrigin * dxMouseOrigin + dyMouseOrigin * dyMouseOrigin);

        if (distance < repelRadius && distance > 1) {
            const repelForce = (repelRadius - distance) / repelRadius;
            const angle = Math.atan2(dyMouseOrigin, dxMouseOrigin);
            const displacementX = Math.cos(angle) * repelForce * repelStrength;
            const displacementY = Math.sin(angle) * repelForce * repelStrength;
            targetX = origin.x + displacementX;
            targetY = origin.y + displacementY;
        }

        position.x += (targetX - position.x) * easeFactor;
        position.y += (targetY - position.y) * easeFactor;

        const transX = Math.round(position.x * 100) / 100;
        const transY = Math.round(position.y * 100) / 100;
        group.setAttribute('transform', `translate(${transX}, ${transY})`);
    });

    glowElements.forEach(item => {
        if (!item.el || !item.rect) return;

        const centerX = item.rect.left + item.rect.width / 2 + window.scrollX;
        const centerY = item.rect.top + item.rect.height / 2 + window.scrollY;

        const dx = centerX - (mouseScreenPos.x + window.scrollX);
        const dy = centerY - (mouseScreenPos.y + window.scrollY);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < glowRadius) {
            item.targetIntensity = (1 - (distance / glowRadius)) ** 2;
        } else {
            item.targetIntensity = 0;
        }

        item.currentIntensity += (item.targetIntensity - item.currentIntensity) * glowEaseFactor;
        const blur = item.currentIntensity * maxGlowBlur;
        item.el.style.textShadow = blur > 0
            ? `0 0 ${blur}px var(--glow-color), 0 0 ${blur * 2}px var(--glow-color)`
            : '';
    });

    requestAnimationFrame(animationLoop);
}

window.addEventListener('resize', updateTextRects);
window.addEventListener('DOMContentLoaded', () => {
    updateTextRects();
    createDotGrid();
    animationLoop();
});