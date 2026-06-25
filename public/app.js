// Data Definitions
const DEFAULT_DATA = {
    subjects: [
        { id: "dm", name: "Discrete Mathematics", tt: 5, st: 3 },
        { id: "em", name: "Engineering Mathematics", customTT: ["TT1", "Complete Linear Algebra", "TT2", "Combinatorics Counting", "TT3", "TT4", "TT5"], st: 3 },
        { id: "dl", name: "Digital Logic", tt: 3, st: 3 },
        { id: "dbms", name: "Database Management System", tt: 5, st: 3 },
        { id: "c", name: "C Programming", tt: 3, st: 3 },
        { id: "toc", name: "Theory of Computation", tt: 6, st: 3 },
        { id: "cn", name: "Computer Networking", tt: 4, st: 3 },
        { id: "cd", name: "Compiler Design", tt: 3, st: 2 },
        { id: "coa", name: "Computer Organization", tt: 4, st: 3 },
        { id: "os", name: "Operating System", tt: 4, st: 3 },
        { id: "ds", name: "Data Structures", tt: 5, st: 3 },
        { id: "algo", name: "Algorithms", tt: 4, st: 3 }
    ],
    bigTests: [
        { id: "bt1", name: "Discrete Mathematics + Engineering Mathematics" },
        { id: "bt2", name: "CN + DBMS + TOC + CD" },
        { id: "bt3", name: "OS + COA + DL" },
        { id: "bt4", name: "C Programming + DSA" }
    ],
    fullLengthCount: 17
};

const quotes = [
    "One thing at a time, Ridhi.",
    "Make it happen, Ridhi.",
    "A little progress is still progress, Ridhi.",
    "Focus mode engaged, Ridhi.",
    "Let's see what we can get done today, Ridhi."
];

// App State
let state = {
    completedTests: {}, // testId: timestamp
    mockScores: {}, // mockId: score
    theme: 'dark',
    testDetails: {} // testId: { correct: X, total: Y, timestamp: Z }
};

// Global state variables for displayed calendar month
let displayedYear = new Date().getFullYear();
let displayedMonth = new Date().getMonth();

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    loadState().then(() => {
        initTheme();
        renderHero();
        renderSubjects();
        renderBigTests();
        renderFullLengthMocks();
        initCharts();
        updateDashboard();
        setupEventListeners();
    });
});

// State Management
function loadState() {
    return fetch('/api/data')
        .then(res => res.json())
        .then(data => {
            if (data && data.completedTests) {
                state = data;
            } else {
                const saved = localStorage.getItem('gateTrackerState');
                if (saved) {
                    state = JSON.parse(saved);
                }
            }
            state.testDetails = state.testDetails || {};
        })
        .catch(err => {
            console.error("Failed to load state from backend:", err);
            const saved = localStorage.getItem('gateTrackerState');
            if (saved) {
                state = JSON.parse(saved);
            }
            state.testDetails = state.testDetails || {};
        });
}

function saveState() {
    localStorage.setItem('gateTrackerState', JSON.stringify(state));
    updateDashboard();
    
    fetch('/api/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(state)
    })
    .catch(err => {
        console.error("Failed to save state to backend:", err);
    });
}

// UI Rendering - Hero
function renderHero() {
    // Quote
    const quoteEl = document.getElementById('motivationalQuote');
    const now = new Date();
    const hour = now.getHours();
    let selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];
    if ((hour >= 22 || hour < 5) && Math.random() < 0.2) {
        selectedQuote = "Up late, Ridhi?";
    }
    quoteEl.textContent = selectedQuote;

    // Countdown
    const targetDate = new Date('2027-02-01T00:00:00');
    
    function updateCountdown() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            document.getElementById('daysLeft').textContent = "0";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const remDays = days % 30;

        document.getElementById('daysLeft').textContent = days;
        document.getElementById('timeRemaining').textContent = `${months} months ${remDays} days remaining`;

        // Update ring (assuming max 1000 days for ring scale)
        const ring = document.querySelector('.progress-ring-value');
        const radius = ring.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        
        ring.style.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (Math.min(days, 1000) / 1000) * circumference;
        ring.style.strokeDashoffset = offset;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000 * 60 * 60); // Update every hour
}

// UI Rendering - Subjects
function renderSubjects() {
    const grid = document.getElementById('subjectsGrid');
    grid.innerHTML = '';

    DEFAULT_DATA.subjects.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'subject-card glass-panel';
        card.dataset.subjectId = subject.id;

        // Calculate progress
        let total = (subject.customTT ? subject.customTT.length : subject.tt) + subject.st;
        let completed = 0;
        
        const getTestId = (type, index) => `${subject.id}_${type}_${index}`;
        
        // Buttons HTML
        let buttonsHtml = '';
        const ttCount = subject.customTT ? subject.customTT.length : subject.tt;
        for(let i=0; i<ttCount; i++) {
            const tId = getTestId('tt', i);
            const label = subject.customTT ? subject.customTT[i] : `TT${i+1}`;
            const isCompleted = state.completedTests[tId];
            if(isCompleted) completed++;
            
            const details = state.testDetails && state.testDetails[tId];
            const scoreLabelHtml = details ? `<span class="btn-score" style="font-size: 0.65rem; opacity: 0.8;">${details.correct}/${details.total} Qs</span>` : '';
            
            buttonsHtml += `<button class="test-btn ${isCompleted ? 'completed' : ''}" data-id="${tId}" data-type="TT" data-subject="${subject.id}">
                <i class="ph ph-check-circle"></i>
                <span>${label}</span>
                ${scoreLabelHtml}
            </button>`;
        }
        for(let i=0; i<subject.st; i++) {
            const tId = getTestId('st', i);
            const isCompleted = state.completedTests[tId];
            if(isCompleted) completed++;
            
            const details = state.testDetails && state.testDetails[tId];
            const scoreLabelHtml = details ? `<span class="btn-score" style="font-size: 0.65rem; opacity: 0.8;">${details.correct}/${details.total} Qs</span>` : '';
            
            buttonsHtml += `<button class="test-btn ${isCompleted ? 'completed' : ''}" data-id="${tId}" data-type="ST" data-subject="${subject.id}">
                <i class="ph ph-check-circle"></i>
                <span>ST${i+1}</span>
                ${scoreLabelHtml}
            </button>`;
        }

        const percentage = Math.round((completed / total) * 100) || 0;

        card.innerHTML = `
            <div class="subject-header">
                <div class="subject-title">${subject.name}</div>
                <div class="subject-meta">
                    <span class="subject-fraction" id="frac_${subject.id}">${completed}/${total}</span>
                    <i class="ph ph-caret-down expand-icon"></i>
                </div>
            </div>
            <div class="progress-track" style="margin-top: 1rem;">
                <div class="progress-fill" id="prog_${subject.id}" style="width: ${percentage}%"></div>
            </div>
            <div class="subject-content">
                <div class="test-grid">
                    ${buttonsHtml}
                </div>
            </div>
        `;

        // Event Listeners for expand and toggle
        const header = card.querySelector('.subject-header');
        header.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });

        const btns = card.querySelectorAll('.test-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openQuestionsModal(btn.dataset.id, btn.dataset.type, subject.id);
            });
        });

        grid.appendChild(card);
    });
}

function updateSubjectProgress(subjectId) {
    const subject = DEFAULT_DATA.subjects.find(s => s.id === subjectId);
    let total = (subject.customTT ? subject.customTT.length : subject.tt) + subject.st;
    let completed = 0;
    
    const getTestId = (type, index) => `${subject.id}_${type}_${index}`;
    const ttCount = subject.customTT ? subject.customTT.length : subject.tt;
    for(let i=0; i<ttCount; i++) if(state.completedTests[getTestId('tt', i)]) completed++;
    for(let i=0; i<subject.st; i++) if(state.completedTests[getTestId('st', i)]) completed++;

    document.getElementById(`frac_${subjectId}`).textContent = `${completed}/${total}`;
    document.getElementById(`prog_${subjectId}`).style.width = `${Math.round((completed/total)*100)}%`;
    saveState();
}

// UI Rendering - Big Tests
function renderBigTests() {
    const container = document.getElementById('bigTestsTimeline');
    container.innerHTML = '';

    DEFAULT_DATA.bigTests.forEach((bt, index) => {
        const isCompleted = state.completedTests[bt.id];
        const dateStr = isCompleted ? new Date(state.completedTests[bt.id]).toLocaleDateString() : 'Pending';
        
        const details = state.testDetails && state.testDetails[bt.id];
        const scoreStr = details ? ` (${details.correct}/${details.total} Qs)` : '';
        
        const el = document.createElement('div');
        el.className = `timeline-card glass-panel ${isCompleted ? 'completed' : ''}`;
        el.style.cursor = 'pointer';
        el.innerHTML = `
            <div class="timeline-info">
                <h3>${index + 1}. ${bt.name}${scoreStr}</h3>
                <span class="timeline-date" id="date_${bt.id}">${isCompleted ? 'Completed on: ' + dateStr : ''}</span>
            </div>
            <label class="toggle-switch" style="pointer-events: none;">
                <input type="checkbox" id="chk_${bt.id}" ${isCompleted ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        `;

        el.addEventListener('click', () => {
            openQuestionsModal(bt.id, 'BT');
        });

        container.appendChild(el);
    });
}

// UI Rendering - Full Length Mocks
function renderFullLengthMocks() {
    const container = document.getElementById('journeyTracker');
    container.innerHTML = '';

    for(let i=1; i<=DEFAULT_DATA.fullLengthCount; i++) {
        const mId = `fl_${i}`;
        const isCompleted = state.completedTests[mId];
        const score = state.mockScores[mId] || '-';

        const step = document.createElement('div');
        step.className = `journey-step ${isCompleted ? 'completed' : ''}`;
        step.dataset.id = mId;
        step.dataset.num = i;
        
        step.innerHTML = `
            <div class="step-circle">${isCompleted ? '<i class="ph ph-check"></i>' : i}</div>
            <span class="step-label">FL ${i}</span>
            <span class="step-score" id="score_${mId}">${score !== '-' ? score : ''}</span>
        `;

        step.addEventListener('click', () => {
            openScoreModal(mId, i);
        });

        container.appendChild(step);
    }
    updateFLStats();
}

function updateFLStats() {
    let comp = 0;
    for(let i=1; i<=DEFAULT_DATA.fullLengthCount; i++) {
        if(state.completedTests[`fl_${i}`]) comp++;
    }
    document.getElementById('flMocksCount').textContent = `${comp} / ${DEFAULT_DATA.fullLengthCount} Completed`;
    document.getElementById('flMocksPercentage').textContent = `${Math.round((comp/DEFAULT_DATA.fullLengthCount)*100)}%`;
}

// Modals
const modal = document.getElementById('scoreModal');
let currentMockModalId = null;

function openScoreModal(mockId, num) {
    currentMockModalId = mockId;
    document.getElementById('modalMockTitle').textContent = `Full Length ${num}`;
    document.getElementById('mockScoreInput').value = state.mockScores[mockId] || '';
    modal.style.display = 'block';
}

document.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; }

document.getElementById('saveScoreBtn').addEventListener('click', () => {
    const score = document.getElementById('mockScoreInput').value;
    if(score !== "") {
        state.mockScores[currentMockModalId] = parseFloat(score);
        if(!state.completedTests[currentMockModalId]) {
            state.completedTests[currentMockModalId] = Date.now();
            const step = document.querySelector(`.journey-step[data-id="${currentMockModalId}"]`);
            if(step) {
                step.classList.add('completed');
                step.querySelector('.step-circle').innerHTML = '<i class="ph ph-check"></i>';
            }
        }
        document.getElementById(`score_${currentMockModalId}`).textContent = score;
    } else {
        delete state.mockScores[currentMockModalId];
        delete state.completedTests[currentMockModalId];
        const step = document.querySelector(`.journey-step[data-id="${currentMockModalId}"]`);
        if(step) {
            step.classList.remove('completed');
            step.querySelector('.step-circle').innerHTML = step.dataset.num;
        }
        document.getElementById(`score_${currentMockModalId}`).textContent = '';
    }
    
    saveState();
    modal.style.display = 'none';
    updateFLStats();
    updateMockChart();
});

document.getElementById('clearScoreBtn').addEventListener('click', () => {
    delete state.mockScores[currentMockModalId];
    delete state.completedTests[currentMockModalId];
    const step = document.querySelector(`.journey-step[data-id="${currentMockModalId}"]`);
    if(step) {
        step.classList.remove('completed');
        step.querySelector('.step-circle').innerHTML = step.dataset.num;
    }
    document.getElementById(`score_${currentMockModalId}`).textContent = '';
    
    saveState();
    modal.style.display = 'none';
    updateFLStats();
    updateMockChart();
});


// Core Toggle Logic
function toggleTest(id, forceState = null) {
    if(forceState !== null) {
        if(forceState) state.completedTests[id] = Date.now();
        else delete state.completedTests[id];
    } else {
        if(state.completedTests[id]) delete state.completedTests[id];
        else state.completedTests[id] = Date.now();
    }
    saveState();
}

// Chart.js instances
let doughnutChart, mockScoreChart, barChart, pieChart;

const chartColors = {
    teal: '#22d3ee',
    orange: '#fbbf24',
    green: '#34d399',
    indigo: '#818cf8',
    purple: '#c084fc',
    gray: '#555770',
    bg: 'rgba(255,255,255,0.06)'
};

function initCharts() {
    Chart.defaults.color = '#8b8fa3';
	Chart.defaults.font.family = "'Inter', sans-serif";

    // Doughnut
    const ctxDoughnut = document.getElementById('overallDoughnutChart').getContext('2d');
    doughnutChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [0, 100],
                backgroundColor: [chartColors.indigo, chartColors.bg],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });

    // Mock Scores Line Chart
    const ctxLine = document.getElementById('mockScoreChart').getContext('2d');
    mockScoreChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: Array.from({length: 17}, (_, i) => `FL${i+1}`),
            datasets: [{
                label: 'Score',
                data: Array(17).fill(null),
                borderColor: chartColors.indigo,
                backgroundColor: 'rgba(129, 140, 248, 0.12)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: chartColors.teal,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 100 }
            }
        }
    });

    // Pie Chart
    const ctxPie = document.getElementById('testDistributionPieChart').getContext('2d');
    pieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: ['Topic Tests', 'Subject Tests', 'Big Tests', 'Full Length'],
            datasets: [{
                data: [0,0,0,0],
                backgroundColor: [chartColors.indigo, chartColors.teal, chartColors.orange, chartColors.purple],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateDashboard() {
    // Calculate global stats
    let totalTT = 0, compTT = 0;
    let totalST = 0, compST = 0;
    
    DEFAULT_DATA.subjects.forEach(s => {
        const tCount = s.customTT ? s.customTT.length : s.tt;
        totalTT += tCount;
        totalST += s.st;
        
        for(let i=0; i<tCount; i++) if(state.completedTests[`${s.id}_tt_${i}`]) compTT++;
        for(let i=0; i<s.st; i++) if(state.completedTests[`${s.id}_st_${i}`]) compST++;
    });

    let totalBT = DEFAULT_DATA.bigTests.length;
    let compBT = 0;
    DEFAULT_DATA.bigTests.forEach(bt => { if(state.completedTests[bt.id]) compBT++; });

    let totalFL = DEFAULT_DATA.fullLengthCount;
    let compFL = 0;
    for(let i=1; i<=totalFL; i++) { if(state.completedTests[`fl_${i}`]) compFL++; }

    const total = totalTT + totalST + totalBT + totalFL;
    const completed = compTT + compST + compBT + compFL;
    const percentage = Math.round((completed / total) * 100) || 0;

    // Update Top Cards
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statRemaining').textContent = total - completed;
    document.getElementById('statPercentage').textContent = `${percentage}%`;
    document.getElementById('statReadiness').textContent = Math.round((percentage * 0.8) + (compFL > 0 ? 20 : 0)); // Simple formula

    // Update Charts
    if(doughnutChart) {
        doughnutChart.data.datasets[0].data = [completed, total - completed];
        doughnutChart.update();
    }

    if(pieChart) {
        pieChart.data.datasets[0].data = [compTT, compST * 1.5, compBT * 2, compFL * 3];
        pieChart.update();
    }

    updateSubjectBars();
    updateMockChart();
    updateHeatmap();
}

function updateSubjectBars() {
    const container = document.getElementById('subjectBarsContainer');
    container.innerHTML = '';
    
    DEFAULT_DATA.subjects.forEach(subject => {
        let total = (subject.customTT ? subject.customTT.length : subject.tt) + subject.st;
        let completed = 0;
        const ttCount = subject.customTT ? subject.customTT.length : subject.tt;
        for(let i=0; i<ttCount; i++) if(state.completedTests[`${subject.id}_tt_${i}`]) completed++;
        for(let i=0; i<subject.st; i++) if(state.completedTests[`${subject.id}_st_${i}`]) completed++;
        
        const perc = Math.round((completed/total)*100) || 0;
        
        const el = document.createElement('div');
        el.className = 'subject-bar-item';
        el.innerHTML = `
            <div class="subject-bar-header">
                <span>${subject.name}</span>
                <span>${perc}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${perc}%"></div>
            </div>
        `;
        container.appendChild(el);
    });
}

function updateMockChart() {
    if(!mockScoreChart) return;
    const scores = [];
    for(let i=1; i<=DEFAULT_DATA.fullLengthCount; i++) {
        scores.push(state.mockScores[`fl_${i}`] || null);
    }
    mockScoreChart.data.datasets[0].data = scores;
    mockScoreChart.update();
}

function updateHeatmap() {
    const container = document.getElementById('heatmapContainer');
    container.innerHTML = '';
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Format Month Name and Year
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[currentMonth];
    
    // 1. Create Calendar Header
    const calHeader = document.createElement('div');
    calHeader.className = 'calendar-header';
    calHeader.innerHTML = `
        <span>${monthName} ${displayedYear}</span>
        <div class="calendar-nav">
            <button id="prevMonthBtn" class="nav-arrow-btn"><i class="ph ph-caret-left"></i></button>
            <button id="nextMonthBtn" class="nav-arrow-btn"><i class="ph ph-caret-right"></i></button>
        </div>
    `;
    container.appendChild(calHeader);
    
    // Attach header navigation event listeners immediately
    calHeader.querySelector('#prevMonthBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        displayedMonth--;
        if (displayedMonth < 0) {
            displayedMonth = 11;
            displayedYear--;
        }
        updateHeatmap();
    });
    
    calHeader.querySelector('#nextMonthBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        displayedMonth++;
        if (displayedMonth > 11) {
            displayedMonth = 0;
            displayedYear++;
        }
        updateHeatmap();
    });
    
    // 2. Create Weekdays row
    const weekdaysRow = document.createElement('div');
    weekdaysRow.className = 'calendar-weekdays';
    const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    weekdays.forEach(day => {
        const dEl = document.createElement('div');
        dEl.textContent = day;
        weekdaysRow.appendChild(dEl);
    });
    container.appendChild(weekdaysRow);
    
    // 3. Create Days Grid
    const daysGrid = document.createElement('div');
    daysGrid.className = 'calendar-grid';
    
    const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(displayedYear, displayedMonth, 1).getDay();
    const firstDayIndex = (firstDayOfWeek + 6) % 7; // Map Sun(0)->6, Mon(1)->0...
    
    // Map of day of month to completions count
    const activityMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
        activityMap[d] = 0;
    }
    
    Object.values(state.completedTests).forEach(ts => {
        const d = new Date(ts);
        if (d.getFullYear() === displayedYear && d.getMonth() === displayedMonth) {
            const dateVal = d.getDate();
            activityMap[dateVal] = (activityMap[dateVal] || 0) + 1;
        }
    });

    // Padding empty blocks for first day of the week alignment
    for (let i = 0; i < firstDayIndex; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'heatmap-day placeholder';
        placeholder.style.visibility = 'hidden';
        daysGrid.appendChild(placeholder);
    }
    
    // Render actual day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const count = activityMap[d] || 0;
        let level = 0;
        if (count > 0) level = 1;
        if (count > 2) level = 2;
        if (count > 4) level = 3;
        if (count > 6) level = 4;
        
        const block = document.createElement('div');
        block.className = 'heatmap-day';
        block.dataset.level = level;
        block.textContent = d;
        
        // Tooltip
        const dDate = new Date(displayedYear, displayedMonth, d);
        block.title = `${dDate.toLocaleDateString()}: ${count} tests completed`;
        
        daysGrid.appendChild(block);
    }
    container.appendChild(daysGrid);

    // Calc Streak
    let streak = 0;
    const historyDays = 60;
    const activityHistoryMap = {};
    today.setHours(0,0,0,0);
    Object.values(state.completedTests).forEach(ts => {
        const d = new Date(ts);
        d.setHours(0,0,0,0);
        const timeDiff = today.getTime() - d.getTime();
        const diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));
        if(diffDays >= 0 && diffDays < historyDays) {
            activityHistoryMap[diffDays] = (activityHistoryMap[diffDays] || 0) + 1;
        }
    });
    for(let i=0; i<historyDays; i++) {
        if(activityHistoryMap[i] && activityHistoryMap[i] > 0) streak++;
        else if(i !== 0) break;
    }
    document.getElementById('currentStreak').textContent = `${streak} Days`;
}

// Global Questions Modal Variables
let currentQuestionsTestId = null;
let currentQuestionsType = null;
let currentQuestionsSubjectId = null;

function openQuestionsModal(testId, type, subjectId = null) {
    currentQuestionsTestId = testId;
    currentQuestionsType = type;
    currentQuestionsSubjectId = subjectId;
    
    let title = "Enter Details";
    if (type === 'TT') {
        const subj = DEFAULT_DATA.subjects.find(s => s.id === subjectId);
        title = subj ? `${subj.name} - Topic Test` : "Topic Test";
    } else if (type === 'ST') {
        const subj = DEFAULT_DATA.subjects.find(s => s.id === subjectId);
        title = subj ? `${subj.name} - Subject Test` : "Subject Test";
    } else if (type === 'BT') {
        const bt = DEFAULT_DATA.bigTests.find(b => b.id === testId);
        title = bt ? bt.name : "Big Test";
    }
    
    document.getElementById('modalQuestionsTitle').textContent = title;
    
    const details = state.testDetails[testId] || {};
    document.getElementById('correctQsInput').value = details.correct !== undefined ? details.correct : '';
    document.getElementById('totalQsInput').value = details.total !== undefined ? details.total : '';
    
    document.getElementById('questionsModal').style.display = 'block';
}

// Event Listeners for Nav Actions
function setupEventListeners() {
    // Theme Toggle
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        saveState();
    });

    // Expand All
    let allExpanded = false;
    document.getElementById('expandAllBtn').addEventListener('click', () => {
        allExpanded = !allExpanded;
        document.querySelectorAll('.subject-card').forEach(card => {
            if(allExpanded) card.classList.add('expanded');
            else card.classList.remove('expanded');
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll('.subject-card').forEach(card => {
            const title = card.querySelector('.subject-title').textContent.toLowerCase();
            card.style.display = title.includes(val) ? 'block' : 'none';
        });
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "gate_tracker_backup.json");
        dlAnchorElem.click();
    });

    // Import
    document.getElementById('importFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                if(imported && imported.completedTests) {
                    state = imported;
                    saveState();
                    location.reload();
                }
            } catch(err) {
                alert("Invalid file format");
            }
        };
        reader.readAsText(file);
    });

    // Reset
    document.getElementById('resetBtn').addEventListener('click', () => {
        if(confirm("Are you sure you want to completely reset all your progress? This cannot be undone.")) {
            state = { completedTests: {}, mockScores: {}, theme: state.theme, testDetails: {} };
            saveState();
            location.reload();
        }
    });

    // Modals Close handlers
    document.getElementById('closeQuestionsModal').onclick = () => {
        document.getElementById('questionsModal').style.display = 'none';
    };

    window.onclick = (e) => {
        const scoreModal = document.getElementById('scoreModal');
        const qModal = document.getElementById('questionsModal');
        if (e.target === scoreModal) scoreModal.style.display = 'none';
        if (e.target === qModal) qModal.style.display = 'none';
    };

    // Save Questions Details
    document.getElementById('saveQuestionsBtn').addEventListener('click', () => {
        const correctVal = document.getElementById('correctQsInput').value;
        const totalVal = document.getElementById('totalQsInput').value;
        
        if (correctVal === "" || totalVal === "" || parseInt(totalVal) <= 0) {
            alert("Please enter valid correct and total questions.");
            return;
        }
        
        const correct = parseInt(correctVal);
        const total = parseInt(totalVal);
        
        if (correct > total) {
            alert("Correct questions cannot exceed total questions.");
            return;
        }
        
        state.testDetails = state.testDetails || {};
        state.testDetails[currentQuestionsTestId] = {
            correct: correct,
            total: total,
            timestamp: state.completedTests[currentQuestionsTestId] || Date.now()
        };
        state.completedTests[currentQuestionsTestId] = state.testDetails[currentQuestionsTestId].timestamp;
        
        saveState();
        
        if (currentQuestionsType === 'TT' || currentQuestionsType === 'ST') {
            renderSubjects();
        } else if (currentQuestionsType === 'BT') {
            renderBigTests();
        }
        
        document.getElementById('questionsModal').style.display = 'none';
    });

    // Clear Questions Details
    document.getElementById('clearQuestionsBtn').addEventListener('click', () => {
        if (state.testDetails) {
            delete state.testDetails[currentQuestionsTestId];
        }
        delete state.completedTests[currentQuestionsTestId];
        
        saveState();
        
        if (currentQuestionsType === 'TT' || currentQuestionsType === 'ST') {
            renderSubjects();
        } else if (currentQuestionsType === 'BT') {
            renderBigTests();
        }
        
        document.getElementById('questionsModal').style.display = 'none';
    });
}

function initTheme() {
    if(state.theme === 'light') applyTheme();
}

function applyTheme() {
    if(state.theme === 'light') {
        document.documentElement.classList.remove('dark');
        Chart.defaults.color = '#555566';
    } else {
        document.documentElement.classList.add('dark');
        Chart.defaults.color = '#8b8fa3';
    }
    // Update charts if they exist
    if(doughnutChart) {
        doughnutChart.update();
        mockScoreChart.update();
        pieChart.update();
    }
}
