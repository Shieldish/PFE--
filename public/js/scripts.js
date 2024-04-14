

function validateAndUpload() {
    var fileInput = document.getElementById('file');
    var filePath = fileInput.value;
    var allowedExtensions = /(\.csv|\.xlsx)$/i;

    if (!allowedExtensions.exec(filePath)) {
        displayError("Please choose a .csv or .xlsx file.");
    } else {
        // Proceed with file upload
        document.getElementById('uploadForm').submit();
    }
}

function displayError(message) {
    var errorMessageElement = document.getElementById('errorMessage');
    errorMessageElement.textContent = message;
    $('#errorModal').modal('show');
}


 // Function to open the side navigation
 function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

// Function to close the side navigation
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

// Function to load pages
function loadPage(pageName) {
    fetch(`/pages/${pageName}`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
            // Clear existing selection
            document.querySelectorAll('.sidenav button').forEach(btn => {
                btn.classList.remove('selected');
            });
            // Mark selected item
            document.getElementById(`${pageName}Btn`).classList.add('selected');
            // Update URL
            history.pushState(null, null, `?page=${pageName}`);
        })
        .catch(error => {
            console.error('Error loading page:', error);
        });
}

// Function to handle back/forward navigation
window.onpopstate = function(event) {
    // Parse the URL to get the page name
    const urlParams = new URLSearchParams(window.location.search);
    const pageName = urlParams.get('page');
    if (pageName) {
        // Load the page
        loadPage(pageName);
    }
};

// Load the initial page when the page loads
window.onload = function() {
    // Parse the URL to get the page name
    const urlParams = new URLSearchParams(window.location.search);
    const pageName = urlParams.get('page');
    if (pageName) {
        // Load the page
        loadPage(pageName);
    }
};

// Toggle dropdown
document.addEventListener("DOMContentLoaded", function() {
    var dropdownBtns = document.querySelectorAll('.dropdown-btn');
    dropdownBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            this.classList.toggle("active");
            var dropdownContent = this.nextElementSibling;
            if (dropdownContent.style.display === "block") {
                dropdownContent.style.display = "none";
            } else {
                dropdownContent.style.display = "block";
            }
        });
    });
});

// Logout function
function logout() {
    // Add logout logic here
    alert("Logged out successfully!");
}


