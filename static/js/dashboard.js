/* =============================================
   Dashboard JavaScript
   ============================================= */

/**
 * Initialize the performance chart using Chart.js
 */
function initPerformanceChart(chartData) {
    var canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    
    // Prepare data arrays
    var labels = [];
    var scores = [];
    var skills = [];
    
    for (var i = 0; i < chartData.length; i++) {
        labels.push(chartData[i].date);
        scores.push(chartData[i].score);
        skills.push(chartData[i].skill);
    }
    
    // Create Chart.js chart
    var ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Score',
                data: scores,
                borderColor: '#4f8cff',
                backgroundColor: 'rgba(79, 140, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4f8cff',
                pointBorderColor: '#4f8cff',
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    grid: {
                        color: 'rgba(42, 42, 64, 0.5)',
                    },
                    ticks: {
                        color: '#9090b0',
                        font: {
                            family: 'Share Tech Mono',
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(42, 42, 64, 0.3)',
                    },
                    ticks: {
                        color: '#9090b0',
                        font: {
                            family: 'Share Tech Mono',
                            size: 11,
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0f0',
                        font: {
                            family: 'Roboto Condensed',
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1a2e',
                    titleColor: '#e0e0f0',
                    bodyColor: '#9090b0',
                    borderColor: '#2a2a40',
                    borderWidth: 1,
                    callbacks: {
                        afterLabel: function(context) {
                            var index = context.dataIndex;
                            if (skills[index]) {
                                return 'Skill: ' + skills[index];
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Delete an interview session
 */
function deleteInterview(interviewId) {
    var confirmed = confirm('Are you sure you want to delete this interview session? This cannot be undone.');
    
    if (!confirmed) return;
    
    var url = '/api/interviews/list/?id=' + interviewId;
    
    deleteRequest(url, function(error, data) {
        if (error) {
            showToast('Failed to delete interview', 'error');
            return;
        }
        
        if (data.success) {
            // Remove the card from DOM
            var card = document.getElementById('interview-' + interviewId);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'translateX(-20px)';
                setTimeout(function() {
                    card.remove();
                }, 300);
            }
            showToast('Interview deleted successfully', 'success');
        } else {
            showToast('Error: ' + (data.error || 'Failed to delete'), 'error');
        }
    });
}
