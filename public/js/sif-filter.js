async function classifyEvent() {
    const description = document.getElementById('description').value.trim();
    const btn = document.getElementById('classify-btn');
    const resultContainer = document.getElementById('result-container');
    const resultEl = document.getElementById('result');

    if (description.length < 10) {
        alert('Please enter a more detailed description of the near-miss event.');
        return;
    }

    // Show loading state
    btn.disabled = true;
    btn.textContent = 'Analyzing...';
    resultContainer.style.display = 'none';

    try {
        const res = await ToolUtils.postJSON('/api/sif-filter/classify', { description });

        if (res.success && res.result) {
            const r = res.result;

            // Check for PII error
            if (r.error === 'pii') {
                resultEl.className = 'filter-result';
                resultEl.innerHTML = `
                    <div class="filter-verdict" style="color:var(--warning)">
                        Review Required
                    </div>
                    <p style="color:var(--gray-600)">${r.message}</p>
                `;
            } else if (r.raw) {
                // Raw text response - parse if possible
                resultEl.className = 'filter-result';
                resultEl.innerHTML = `<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${r.raw.replace(/```json|```/g, '').trim()}</pre>`;
            } else {
                // Structured response
                const isPSIF = r.isPSIF;
                resultEl.className = `filter-result ${isPSIF ? 'psif-yes' : 'psif-no'}`;
                resultEl.innerHTML = `
                    <div class="filter-verdict ${isPSIF ? 'yes' : 'no'}">
                        P-SIF: ${isPSIF ? 'YES' : 'NO'}
                    </div>

                    <div class="filter-detail">
                        <strong>Energy Assessment</strong>
                        <span>${r.energy}</span>
                    </div>

                    <div class="filter-detail">
                        <strong>Exposure Analysis</strong>
                        <span>${r.exposure}</span>
                    </div>

                    <div class="filter-detail">
                        <strong>Control Type</strong>
                        <span>${r.control}</span>
                    </div>

                    <p class="filter-action">${r.action}</p>
                `;
            }

            resultContainer.style.display = 'block';
        }
    } catch (err) {
        alert('Error analyzing event. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Analyze Event';
    }
}
