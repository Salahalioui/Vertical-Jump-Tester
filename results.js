document.addEventListener('DOMContentLoaded', () => {
    // DOM references
    const jumpHeightEl = document.getElementById('jump-height');
    const flightTimeEl = document.getElementById('flight-time');
    const takeoffVelocityEl = document.getElementById('takeoff-velocity');
    const powerOutputEl = document.getElementById('power-output');
    const fpsValueEl = document.getElementById('fps-value');
    const takeoffValueEl = document.getElementById('takeoff-value');
    const landingValueEl = document.getElementById('landing-value');
    const precisionValueEl = document.getElementById('precision-value');
    const performanceRatingEl = document.getElementById('performance-rating');
    const ratingTextEl = document.getElementById('rating-text');
    const percentileFillEl = document.getElementById('percentile-fill');
    const userMarkerEl = document.getElementById('user-marker');
    const benchmarkTextEl = document.getElementById('benchmark-text');
    const calculationDetailsEl = document.getElementById('calculation-details');
    const shareBtn = document.getElementById('share-results-btn');
    const shareStatus = document.getElementById('share-status');
    
    // Performance benchmarks (based on research data)
    const benchmarks = {
        male: {
            poor: { max: 20, label: 'Needs Improvement', color: '#dc2626' },
            belowAverage: { max: 30, label: 'Below Average', color: '#f59e0b' },
            average: { max: 40, label: 'Average', color: '#6b7280' },
            aboveAverage: { max: 50, label: 'Above Average', color: '#10b981' },
            good: { max: 60, label: 'Good', color: '#059669' },
            veryGood: { max: 70, label: 'Very Good', color: '#047857' },
            excellent: { max: 81, label: 'Excellent', color: '#2563eb' },
            elite: { max: 100, label: 'Elite Level', color: '#7c3aed' }
        },
        female: {
            poor: { max: 15, label: 'Needs Improvement', color: '#dc2626' },
            belowAverage: { max: 25, label: 'Below Average', color: '#f59e0b' },
            average: { max: 35, label: 'Average', color: '#6b7280' },
            aboveAverage: { max: 45, label: 'Above Average', color: '#10b981' },
            good: { max: 55, label: 'Good', color: '#059669' },
            veryGood: { max: 65, label: 'Very Good', color: '#047857' },
            excellent: { max: 75, label: 'Excellent', color: '#2563eb' },
            elite: { max: 100, label: 'Elite Level', color: '#7c3aed' }
        }
    };
    
    // Get stored results
    const resultsStr = localStorage.getItem('jumpResults');
    if (!resultsStr) {
        // No results found, redirect to editor
        window.location.href = 'editor.html';
        return;
    }
    
    const results = JSON.parse(resultsStr);
    
    // Constants
    const GRAVITY = 9.81;
    const AVERAGE_BODY_WEIGHT = 70; // kg, for power calculation
    
    // Calculate derived metrics
    const jumpHeightCm = parseFloat(results.jumpHeight);
    const jumpHeightM = jumpHeightCm / 100;
    const flightTime = parseFloat(results.flightTime);
    const takeoffVelocity = parseFloat(results.takeoffVelocity);
    const fps = parseFloat(results.fps);
    
    // Calculate power output (simplified estimation)
    const powerOutput = (AVERAGE_BODY_WEIGHT * GRAVITY * takeoffVelocity) / AVERAGE_BODY_WEIGHT; // W/kg
    
    // Calculate measurement precision based on FPS
    const framePrecision = (1 / fps) * GRAVITY / 8 * 100; // cm uncertainty per frame
    const measurementPrecision = framePrecision * 2; // Total uncertainty (±)
    
    // Display results
    function displayResults() {
        jumpHeightEl.textContent = `${jumpHeightCm} cm`;
        flightTimeEl.textContent = `${(flightTime * 1000).toFixed(0)} ms`;
        takeoffVelocityEl.textContent = `${takeoffVelocity} m/s`;
        powerOutputEl.textContent = `${powerOutput.toFixed(1)} W/kg`;
        fpsValueEl.textContent = `${fps} fps`;
        takeoffValueEl.textContent = `${results.takeoffTime}s`;
        landingValueEl.textContent = `${results.landingTime}s`;
        precisionValueEl.textContent = `± ${measurementPrecision.toFixed(1)} cm`;
    }
    
    // Get performance rating
    function getPerformanceRating(height, gender = 'male') {
        const genderBenchmarks = benchmarks[gender];
        
        for (const [level, data] of Object.entries(genderBenchmarks)) {
            if (height <= data.max) {
                return {
                    level,
                    label: data.label,
                    color: data.color,
                    percentile: (height / data.max) * 100
                };
            }
        }
        
        return {
            level: 'elite',
            label: 'Elite Level',
            color: '#7c3aed',
            percentile: 100
        };
    }
    
    // Display performance rating
    function displayPerformanceRating() {
        // For this demo, we'll assume male benchmarks
        // In a real app, you'd ask for user gender
        const rating = getPerformanceRating(jumpHeightCm, 'male');
        
        ratingTextEl.textContent = rating.label;
        performanceRatingEl.style.background = rating.color;
        
        // Update percentile bar
        const percentile = Math.min(rating.percentile, 100);
        percentileFillEl.style.width = `${percentile}%`;
        userMarkerEl.style.left = `${percentile}%`;
        
        // Update benchmark text
        benchmarkTextEl.innerHTML = `
            <p><strong>Your jump height of ${jumpHeightCm} cm ranks as "${rating.label}"</strong></p>
            <p>This puts you in approximately the ${Math.round(percentile)}th percentile for adult males.</p>
            <p>Keep training to improve your explosive power and jump higher!</p>
        `;
    }
    
    // Display calculation details
    function displayCalculationDetails() {
        calculationDetailsEl.innerHTML = `
            <h4>Your Calculation Breakdown:</h4>
            <div class="calculation-steps">
                <div class="calc-step">
                    <strong>1. Flight Time:</strong> ${(flightTime * 1000).toFixed(0)} ms
                    <div class="calc-detail">Time between take-off (${results.takeoffTime}s) and landing (${results.landingTime}s)</div>
                </div>
                <div class="calc-step">
                    <strong>2. Physics Formula:</strong> h = 9.81 × (${flightTime.toFixed(3)})² ÷ 8
                    <div class="calc-detail">Using projectile motion equations for vertical displacement</div>
                </div>
                <div class="calc-step">
                    <strong>3. Result:</strong> ${jumpHeightCm} cm
                    <div class="calc-detail">Your center of mass reached this height above the starting position</div>
                </div>
            </div>
            <div class="accuracy-note">
                <p><strong>Measurement Accuracy:</strong> ±${measurementPrecision.toFixed(1)} cm</p>
                <p>Based on ${fps} fps video analysis. Higher frame rates provide better precision.</p>
            </div>
        `;
    }
    
    // Share functionality
    async function shareResults() {
        const shareText = `🏀 My Vertical Jump Results 🏀

Jump Height: ${jumpHeightCm} cm
Flight Time: ${(flightTime * 1000).toFixed(0)} ms
Performance: ${getPerformanceRating(jumpHeightCm).label}

Measured with scientific precision using Vertical Jump Tester
#VerticalJump #Athletics #SportScience`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Vertical Jump Results',
                    text: shareText,
                    url: window.location.origin
                });
                shareStatus.textContent = "Results shared successfully!";
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareText);
                shareStatus.textContent = "Results copied to clipboard!";
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = shareText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                shareStatus.textContent = "Results copied to clipboard!";
            }
        } catch (error) {
            shareStatus.textContent = "Could not share. Please copy manually.";
            console.error('Share failed:', error);
        }
        
        setTimeout(() => {
            shareStatus.textContent = "";
        }, 3000);
    }
    
    // Event listeners
    if (shareBtn) {
        shareBtn.addEventListener('click', shareResults);
    }
    
    // Add CSS for calculation details
    const style = document.createElement('style');
    style.textContent = `
        .calculation-steps {
            text-align: left;
            margin: 1rem 0;
        }
        
        .calc-step {
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: var(--background-alt);
            border-radius: var(--radius);
            border-left: 3px solid var(--primary-color);
        }
        
        .calc-detail {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-top: 0.25rem;
        }
        
        .accuracy-note {
            margin-top: 1.5rem;
            padding: 1rem;
            background: rgba(16, 185, 129, 0.1);
            border-radius: var(--radius);
            border-left: 3px solid var(--secondary-color);
        }
        
        .accuracy-note p {
            margin: 0.25rem 0;
            font-size: 0.875rem;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize display
    displayResults();
    displayPerformanceRating();
    displayCalculationDetails();
    
    // Add some animation delays for better UX
    setTimeout(() => {
        displayPerformanceRating();
    }, 500);
});
