/* =============================================
   main.js - Common utility functions
   ============================================= */

/**
 * Get CSRF token from cookie (needed for Django POST requests)
 */
function getCsrfToken() {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.startsWith('csrftoken=')) {
            return cookie.substring('csrftoken='.length);
        }
    }
    return '';
}

/**
 * Toggle user dropdown menu in navbar
 */
function toggleUserMenu() {
    var dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        } else {
            dropdown.classList.add('show');
        }
    }
}

/**
 * Toggle mobile navigation menu
 */
function toggleMobileMenu() {
    var navLinks = document.getElementById('navbarLinks');
    if (navLinks) {
        if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
        } else {
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '64px';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = '#1a1a2e';
            navLinks.style.padding = '16px';
            navLinks.style.borderBottom = '1px solid #2a2a40';
            navLinks.style.zIndex = '99';
        }
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    var dropdown = document.getElementById('userDropdown');
    var avatarBtn = document.querySelector('.user-avatar-btn');
    
    if (dropdown && avatarBtn) {
        // Check if click is outside the menu
        var isClickInside = avatarBtn.contains(event.target) || dropdown.contains(event.target);
        if (!isClickInside) {
            dropdown.classList.remove('show');
        }
    }
});

/**
 * Show a toast notification
 */
function showToast(message, type) {
    // type can be: success, error, info, warning
    if (!type) {
        type = 'info';
    }
    
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    var icons = {
        'success': '✓',
        'error': '✕',
        'info': 'ℹ',
        'warning': '⚠'
    };
    
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<div class="toast-content">' +
        '<span class="toast-icon">' + (icons[type] || 'ℹ') + '</span>' +
        '<span class="toast-text">' + message + '</span>' +
        '</div>';
    
    toast.onclick = function() {
        toast.remove();
    };
    
    container.appendChild(toast);
    
    // Auto dismiss after 5 seconds
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(function() {
            toast.remove();
        }, 500);
    }, 5000);
}

/**
 * Format seconds into MM:SS string
 */
function formatTime(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    
    var minuteStr = '';
    if (minutes < 10) {
        minuteStr = '0' + minutes;
    } else {
        minuteStr = '' + minutes;
    }
    
    var secondStr = '';
    if (seconds < 10) {
        secondStr = '0' + seconds;
    } else {
        secondStr = '' + seconds;
    }
    
    return minuteStr + ':' + secondStr;
}

/**
 * Make a POST request with JSON body
 */
function postJSON(url, data, callback) {
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(data)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {
        callback(null, result);
    })
    .catch(function(error) {
        callback(error, null);
    });
}

/**
 * Make a GET request
 */
function getJSON(url, callback) {
    fetch(url)
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {
        callback(null, result);
    })
    .catch(function(error) {
        callback(error, null);
    });
}

/**
 * Make a DELETE request
 */
function deleteRequest(url, callback) {
    fetch(url, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCsrfToken(),
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {
        callback(null, result);
    })
    .catch(function(error) {
        callback(error, null);
    });
}
