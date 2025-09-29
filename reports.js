document.addEventListener('DOMContentLoaded', function() {
    
    // --- DOM Elements ---
    const pageContent = document.getElementById('reports-page-content');
    const tabsContainer = document.getElementById('reports-tabs');
    const tabLinks = tabsContainer ? tabsContainer.querySelectorAll('.tab-link') : [];
    const tabContents = document.querySelectorAll('.main-content .tab-content');
    const recentReportsListContainer = document.getElementById('recent-reports-list');
    
    // --- NEW: Search Input Selector ---
    const searchInput = document.getElementById('report-search-input');

    // --- SOCKET.IO CONNECTION ---
    const socket = io('http://localhost:4000');
    
    // Listen for new reports from the server
    socket.on('new-report-ready', (newReport) => {
        prependRecentReport(newReport); // Add to top of Recent Reports tab
    });

    // --- TAB SWITCHING LOGIC ---
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const clickedTab = e.target.closest('.tab-link');
            if (!clickedTab) return;

            tabLinks.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            clickedTab.classList.add('active');
            
            const tabId = clickedTab.dataset.tab;
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    }

    // --- MAIN BUTTON CLICK HANDLER (Event Delegation) ---
    if (pageContent) {
        pageContent.addEventListener('click', async (e) => {
            
            // --- Handle ALL "Generate" buttons ---
            const generateBtn = e.target.closest('.btn-generate');
            if (generateBtn) {
                e.preventDefault();
                await handleGenerateReport(generateBtn);
                return; 
            }

            // --- Handle ALL "Download" buttons ---
            const downloadBtn = e.target.closest('.btn-download-latest');
            if (downloadBtn && downloadBtn.textContent.includes('Download')) { // Make sure it's a download button
                e.preventDefault();
                handleDownloadReport(downloadBtn);
                return;
            }

            // --- Handle "Save Template" button ---
            const saveTemplateBtn = e.target.closest('.custom-report-actions .btn-download-latest'); 
            if (saveTemplateBtn && saveTemplateBtn.textContent.includes('Save Template')) {
                e.preventDefault();
                alert('Template saved successfully!');
                return;
            }
            
            // --- Handle "View Details" buttons ---
            if (e.target.textContent.includes('View Details')) {
                e.preventDefault();
                alert('Opening report details... (This would navigate to a new page)');
                return;
            }
        });
    }

    // --- NEW: SEARCH FILTER LOGIC ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const activeTab = tabsContainer.querySelector('.tab-link.active');
            if (!activeTab) return;

            const activeTabId = activeTab.dataset.tab;
            let reportCards;

            // Determine which list of cards to filter based on the active tab
            if (activeTabId === 'report-templates') {
                reportCards = document.querySelectorAll('#report-templates .report-card');
            } else if (activeTabId === 'recent-reports') {
                reportCards = document.querySelectorAll('#recent-reports .custom-report-card');
            } else if (activeTabId === 'custom-reports') {
                 reportCards = document.querySelectorAll('#custom-reports .custom-report-card'); // Added filter for custom reports list
            } else {
                return; // No searchable list on this tab
            }

            // Loop through the cards and show/hide them
            reportCards.forEach(card => {
                const title = card.querySelector('h4').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                const isVisible = title.includes(searchTerm) || description.includes(searchTerm);
                
                // Both card types use flexbox, so we set display to 'flex' instead of 'block'
                card.style.display = isVisible ? 'flex' : 'none';
            });
        });
    }


    // --- ACTION FUNCTIONS (Generate, Download) ---

    async function handleGenerateReport(buttonEl) {
        buttonEl.disabled = true;
        buttonEl.textContent = 'Generating...';

        const card = buttonEl.closest('.report-card') || buttonEl.closest('.widget');
        let title = 'Custom Report';
        let description = 'A custom generated report';

        if (card) {
            const titleEl = card.querySelector('h4') || card.querySelector('h3');
            const descEl = card.querySelector('p');
            if (titleEl) title = titleEl.textContent;
            if (descEl) description = descEl.textContent;
        }

        fetch('http://localhost:4000/api/reports/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });

        setTimeout(() => {
            buttonEl.disabled = false;
            buttonEl.innerHTML = buttonEl.innerHTML.replace('Generating...', 'Generate');
        }, 2000);
    }

    async function handleDownloadReport(buttonEl) {
        buttonEl.textContent = 'Downloading...';
        try {
            const response = await fetch('http://localhost:4000/api/alerts');
            const dataToExport = await response.json();
            const headers = ['id', 'type', 'status', 'priority', 'touristName', 'location', 'assignedTeam', 'summary'];
            exportToCSV(headers, dataToExport, 'report_export.csv');
        } catch (error) {
            console.error("Failed to fetch data for export:", error);
            alert("Failed to download report data.");
        } finally {
            setTimeout(() => {
                 buttonEl.innerHTML = `<span class="material-icons-outlined">download</span> Download`;
            }, 1000);
        }
    }


    // --- DATA FETCHING & RENDERING (Recent Reports) ---

    function createRecentReportCardHTML(report) {
        const tagClass = report.tag.toLowerCase();
        const downloadButton = (report.tag === 'completed')
            ? `<button class="btn-download-latest"><span class="material-icons-outlined">download</span> Download</button>`
            : '';

        return `
            <div class="custom-report-details">
                <div class="custom-report-card-header">
                    <h4>${report.title}</h4>
                    <span class="report-tag tag-${tagClass}">${report.tag}</span>
                </div>
                <p>${report.description}</p>
                <div class="custom-report-meta">
                    <div><span>Created by</span><strong>${report.createdBy}</strong></div>
                    <div><span>Date Range</span><strong>${report.dateRange}</strong></div>
                    <div><span>File Size</span><strong>${report.fileSize}</strong></div>
                </div>
            </div>
            <div class="custom-report-card-actions">
                ${downloadButton}
                <button class="btn-download-latest">View Details</button>
            </div>
        `;
    }

    function prependRecentReport(report) {
        if (!recentReportsListContainer) return;
        const noReportsMsg = recentReportsListContainer.querySelector('p');
        if (noReportsMsg) noReportsMsg.remove();
        const card = document.createElement('div');
        card.className = 'custom-report-card';
        card.innerHTML = createRecentReportCardHTML(report);
        recentReportsListContainer.prepend(card);
    }

    function renderRecentReports(reports) {
        if (!recentReportsListContainer) return;
        recentReportsListContainer.innerHTML = ''; 
        if (!reports || reports.length === 0) {
            recentReportsListContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #888;">No recent reports found.</p>';
            return;
        }
        reports.forEach(report => {
            const card = document.createElement('div');
            card.className = 'custom-report-card';
            card.innerHTML = createRecentReportCardHTML(report);
            recentReportsListContainer.appendChild(card);
        });
    }

    async function fetchRecentReports() {
        if (!recentReportsListContainer) return;
        try {
            const response = await fetch('http://localhost:4000/api/reports/recent');
            if (!response.ok) throw new Error('Network response was not ok');
            const reports = await response.json();
            renderRecentReports(reports);
        } catch (error) {
            console.error("Failed to fetch recent reports:", error);
            recentReportsListContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #d32f2f;">Error loading reports.</p>';
        }
    }

    // --- CSV EXPORT HELPER ---
    function exportToCSV(headers, data, filename) {
        const formatCSVField = (field) => {
            if (field === null || field === undefined) return '';
            let stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };
        const rows = data.map(item => headers.map(headerKey => formatCSVField(item[headerKey])).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Initial data load when the page starts
    fetchRecentReports();
});