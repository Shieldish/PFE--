// Periodically check for updates



setInterval(() => {
    fetch('/check-update')
    .then(response => response.json())
    .then(data => {
        // Compare data and update session if necessary
        if (data.role !== userData.role) {
            // User's role has changed, update session
            userData.role = data.role;
            // Implement logic to restrict access based on role
        }
    })
    .catch(error => console.error('Error checking for updates:', error));
}, 5000); // Check every 5 seconds (adjust as needed)
