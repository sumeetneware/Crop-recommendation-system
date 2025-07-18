// Configuration - Replace with your actual ML API details
const ML_CONFIG = {
    endpoint: 'https://us-south.ml.cloud.ibm.com/ml/v4/deployments/a877ba14-b0ab-4107-b27c-6b28e8381dc0/predictions?version=2021-05-01', // Replace with your actual endpoint
    apiKey: 'cpd-apikey-IBMid-694000OB2S-2025-01-03T05:51:32Z' // Replace with your actual API key
};

// DOM Elements
const form = document.getElementById('cropForm');
const submitBtn = document.getElementById('submitBtn');
const resultsContent = document.getElementById('resultsContent');
const resultsStatus = document.getElementById('resultsStatus');
const progressBar = document.getElementById('progressBar');
const notification = document.getElementById('notification');

// Form inputs
const inputs = {
    nitrogen: document.getElementById('nitrogen'),
    phosphorus: document.getElementById('phosphorus'),
    potassium: document.getElementById('potassium'),
    ph: document.getElementById('ph'),
    temperature: document.getElementById('temperature'),
    humidity: document.getElementById('humidity'),
    rainfall: document.getElementById('rainfall')
};

// Input ranges for progress calculation
const inputRanges = {
    nitrogen: { min: 0, max: 200 },
    phosphorus: { min: 0, max: 150 },
    potassium: { min: 0, max: 300 },
    ph: { min: 0, max: 14 },
    temperature: { min: -10, max: 50 },
    humidity: { min: 0, max: 100 },
    rainfall: { min: 0, max: 500 }
};

// Initialize the application
function init() {
    setupEventListeners();
    setDefaultValues();
    updateProgress();
}

// Set up event listeners
function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', handleFormSubmit);
    
    // Input change listeners for progress and range indicators
    Object.keys(inputs).forEach(key => {
        inputs[key].addEventListener('input', (e) => {
            updateRangeIndicator(key, e.target.value);
            updateProgress();
        });
    });
}

// Set default values for demonstration
function setDefaultValues() {
    const defaults = {
        nitrogen: 90,
        phosphorus: 42,
        potassium: 43,
        ph: 6.5,
        temperature: 25,
        humidity: 80,
        rainfall: 200
    };
    
    Object.keys(defaults).forEach(key => {
        inputs[key].value = defaults[key];
        updateRangeIndicator(key, defaults[key]);
    });
}

// Update range indicator
function updateRangeIndicator(inputName, value) {
    const rangeFill = document.querySelector(`[data-input="${inputName}"]`);
    if (rangeFill) {
        const range = inputRanges[inputName];
        const percentage = ((value - range.min) / (range.max - range.min)) * 100;
        rangeFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }
}

// Update progress bar
function updateProgress() {
    const totalInputs = Object.keys(inputs).length;
    const filledInputs = Object.values(inputs).filter(input => input.value !== '').length;
    const progress = (filledInputs / totalInputs) * 100;
    progressBar.style.width = `${progress}%`;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {};
    Object.keys(inputs).forEach(key => {
        formData[key] = parseFloat(inputs[key].value) || 0;
    });
    
    // Validate form data
    if (!validateFormData(formData)) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Update UI for loading state
    setLoadingState(true);
    
    try {
        // Make API call
        const recommendations = await getCropRecommendations(formData);
        
        // Display results
        displayResults(recommendations);
        showNotification('Recommendations generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        displayError(error.message);
        showNotification('Failed to get recommendations. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Validate form data
function validateFormData(data) {
    return Object.values(data).every(value => !isNaN(value) && value !== null);
}

// Set loading state
function setLoadingState(loading) {
    if (loading) {
        submitBtn.classList.add('loading');
        resultsStatus.textContent = 'Analyzing...';
        resultsStatus.className = 'results-status loading';
    } else {
        submitBtn.classList.remove('loading');
    }
}

// Get crop recommendations from API
async function getCropRecommendations(data) {
    // Check if API configuration is set
    if (ML_CONFIG.endpoint === 'https://us-south.ml.cloud.ibm.com/ml/v4/deployments/a877ba14-b0ab-4107-b27c-6b28e8381dc0/predictions?version=2021-05-01' || ML_CONFIG.apiKey === 'cpd-apikey-IBMid-694000OB2S-2025-01-03T05:51:32Z') {
        // Return mock data for demonstration
        return getMockRecommendations(data);
    }
    
    try {
        const response = await fetch(ML_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ML_CONFIG.apiKey}`,
                // Add any other headers your ML API requires
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Transform the response to match our expected format
        // You may need to adjust this based on your ML API's actual response format
        return transformApiResponse(result);
        
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection.');
        }
        throw error;
    }
}

// Transform API response to our expected format
function transformApiResponse(apiResponse) {
    // Adjust this function based on your ML API's actual response format
    if (Array.isArray(apiResponse.recommendations)) {
        return apiResponse.recommendations.map(rec => ({
            crop: rec.crop || rec.name || 'Unknown',
            confidence: Math.round((rec.confidence || rec.score || 0) * 100),
            suitability: rec.suitability || getSuitabilityLabel(rec.confidence || rec.score || 0)
        }));
    } else if (apiResponse.crop) {
        return [{
            crop: apiResponse.crop,
            confidence: Math.round((apiResponse.confidence || 0.8) * 100),
            suitability: getSuitabilityLabel(apiResponse.confidence || 0.8)
        }];
    }
    
    throw new Error('Invalid API response format');
}

// Get suitability label based on confidence
function getSuitabilityLabel(confidence) {
    if (confidence >= 0.8) return 'Highly Suitable';
    if (confidence >= 0.6) return 'Suitable';
    if (confidence >= 0.4) return 'Moderately Suitable';
    return 'Less Suitable';
}

// Get mock recommendations for demonstration
function getMockRecommendations(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simple logic to generate mock recommendations based on input
            const crops = [
                { name: 'Rice', baseScore: 0.85 },
                { name: 'Wheat', baseScore: 0.75 },
                { name: 'Corn', baseScore: 0.70 },
                { name: 'Soybean', baseScore: 0.65 },
                { name: 'Cotton', baseScore: 0.60 }
            ];
            
            // Adjust scores based on input parameters (simplified logic)
            const recommendations = crops.map(crop => {
                let score = crop.baseScore;
                
                // Adjust based on pH (most crops prefer 6-7)
                if (data.ph >= 6 && data.ph <= 7) score += 0.1;
                else score -= 0.1;
                
                // Adjust based on temperature (most crops prefer 20-30°C)
                if (data.temperature >= 20 && data.temperature <= 30) score += 0.05;
                else score -= 0.05;
                
                // Adjust based on humidity
                if (data.humidity >= 60 && data.humidity <= 80) score += 0.05;
                
                // Add some randomness
                score += (Math.random() - 0.5) * 0.2;
                
                // Ensure score is between 0 and 1
                score = Math.max(0.3, Math.min(1, score));
                
                return {
                    crop: crop.name,
                    confidence: Math.round(score * 100),
                    suitability: getSuitabilityLabel(score)
                };
            });
            
            // Sort by confidence and return top 3
            recommendations.sort((a, b) => b.confidence - a.confidence);
            resolve(recommendations.slice(0, 3));
        }, 2000); // Simulate API delay
    });
}

// Display results
function displayResults(recommendations) {
    resultsStatus.textContent = 'Analysis Complete';
    resultsStatus.className = 'results-status success';
    
    if (recommendations.length === 0) {
        resultsContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h4>No Recommendations Found</h4>
                <p>Unable to find suitable crops for the given parameters</p>
            </div>
        `;
        return;
    }
    
    const recommendationsHTML = recommendations.map((rec, index) => `
        <div class="recommendation-card" style="animation-delay: ${index * 0.1}s">
            <div class="recommendation-header">
                <h4 class="crop-name">${rec.crop}</h4>
                <span class="suitability-badge ${getSuitabilityClass(rec.suitability)}">${rec.suitability}</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-track">
                    <div class="confidence-fill" style="width: ${rec.confidence}%"></div>
                </div>
                <span class="confidence-value">${rec.confidence}%</span>
            </div>
        </div>
    `).join('');
    
    resultsContent.innerHTML = `
        <div class="recommendations">
            ${recommendationsHTML}
        </div>
    `;
    
    // Animate confidence bars
    setTimeout(() => {
        document.querySelectorAll('.confidence-fill').forEach((fill, index) => {
            setTimeout(() => {
                fill.style.width = fill.style.width;
            }, index * 200);
        });
    }, 100);
}

// Get suitability CSS class
function getSuitabilityClass(suitability) {
    return suitability.toLowerCase().replace(/\s+/g, '-');
}

// Display error
function displayError(message) {
    resultsStatus.textContent = 'Analysis Failed';
    resultsStatus.className = 'results-status error';
    
    resultsContent.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            </div>
            <h4>Analysis Failed</h4>
            <p>${message}</p>
        </div>
    `;
}

// Show notification
function showNotification(message, type = 'success') {
    const notificationIcon = notification.querySelector('.notification-icon');
    const notificationMessage = notification.querySelector('.notification-message');
    
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);