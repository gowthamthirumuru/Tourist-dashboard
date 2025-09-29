// Find the login form elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

// Add an event listener for form submission
loginForm.addEventListener('submit', function(event) {
    // Prevent the form from actually submitting
    event.preventDefault();

    // Get the values from the input fields
    const username = usernameInput.value;
    const password = passwordInput.value;

    // --- Simple Authentication Check ---
    // In a real application, this would be a call to a server.
    if (username === 'admin' && password === 'password') {
        // If correct, redirect to the dashboard page
        errorMessage.textContent = 'Login successful! Redirecting...';
        window.location.href = 'dashboard.html';
    } else {
        // If incorrect, show an error message
        errorMessage.textContent = 'Invalid username or password.';
    }
});