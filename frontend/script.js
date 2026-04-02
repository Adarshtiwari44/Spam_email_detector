document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('emailInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const scanLine = document.getElementById('scanLine');
    const resultSection = document.getElementById('resultSection');
    const loadingState = document.getElementById('loadingState');
    const verdictCard = document.getElementById('verdictCard');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const meterFill = document.getElementById('meterFill');
    const confidenceValue = document.getElementById('confidenceValue');
    const detailText = document.getElementById('detailText');

    analyzeBtn.addEventListener('click', async () => {
        const text = emailInput.value.trim();

        if (!text) {
            alert('Please paste or type email content to analyze.');
            emailInput.focus();
            return;
        }

        // UI Reset
        verdictCard.classList.add('hidden');
        resultSection.classList.remove('hidden');
        loadingState.classList.remove('hidden');
        scanLine.classList.add('active');
        analyzeBtn.disabled = true;
        
        verdictCard.classList.remove('spam', 'ham');
        
        try {
            // ✅ FIX 1: Full backend URL
            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // ✅ FIX 2: safe JSON
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                throw new Error('Server error: ' + response.status);
            }

            const data = await response.json();

            // ✅ FIX 3: backend error handle
            if (data.error) {
                throw new Error(data.error);
            }
            
            setTimeout(() => {
                showResult(data);
            }, 1200);

        } catch (error) {
            console.error('Error during prediction:', error);
            alert('Backend not connected or error: ' + error.message);
            
            loadingState.classList.add('hidden');
            resultSection.classList.add('hidden');
            scanLine.classList.remove('active');
            analyzeBtn.disabled = false;
        }
    });

    function showResult(data) {
        scanLine.classList.remove('active');
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
        
        const isSpam = data.prediction === 1;
        const confPercent = (data.confidence * 100).toFixed(2);
        
        if (isSpam) {
            verdictCard.classList.add('spam');
            resultIcon.className = 'fa-solid fa-triangle-exclamation';
            resultTitle.textContent = 'Spam Detected';
            detailText.textContent = 'This email exhibits strong indicators of being spam or malicious.';
        } else {
            verdictCard.classList.add('ham');
            resultIcon.className = 'fa-solid fa-shield-check';
            resultTitle.textContent = 'Email is Safe';
            detailText.textContent = 'No strong spam indicators detected.';
        }
        
        confidenceValue.textContent = confPercent + '%';
        
        verdictCard.classList.remove('hidden');
        
        setTimeout(() => {
            meterFill.style.width = confPercent + '%';
        }, 50);
    }

    emailInput.addEventListener('focus', () => {
        emailInput.parentElement.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.3)';
    });
    
    emailInput.addEventListener('blur', () => {
        emailInput.parentElement.style.boxShadow = 'none';
    });
});