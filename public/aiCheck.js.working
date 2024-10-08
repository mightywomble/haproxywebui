function showAICheckButton() {
    document.getElementById('aiCheckBtn').style.display = 'inline-block';
}

function hideAICheckButton() {
    document.getElementById('aiCheckBtn').style.display = 'none';
}

async function analyzeConfig() {
    const contentArea = document.getElementById('editor');
    const configContent = contentArea.value;

    try {
        const response = await fetch('/api/analyze-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ configContent }),
        });

        if (!response.ok) {
            throw new Error('Failed to analyze configuration');
        }

        const data = await response.json();
        alert('AI Analysis:\n\n' + data.analysis);
    } catch (error) {
        console.error('Error analyzing config:', error);
        alert('Error analyzing configuration. Please try again.');
    }
}

function initAICheck() {
    const aiCheckBtn = document.getElementById('aiCheckBtn');
    if (aiCheckBtn) {
        aiCheckBtn.addEventListener('click', analyzeConfig);
    }
}

export { showAICheckButton, hideAICheckButton, analyzeConfig, initAICheck };