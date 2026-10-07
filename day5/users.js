// Select HTML elements
const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

// Store users after they are loaded
let users = [];


// Display users on the page
function renderUsers(list) {
    usersList.textContent = "";

    list.forEach(function (user) {
        const li = document.createElement("li");

        const name = document.createElement("h3");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;

        const city = document.createElement("p");
        city.textContent = `City: ${user.address.city}`;

        const company = document.createElement("p");
        company.textContent = `Company: ${user.company.name}`;

        li.appendChild(name);
        li.appendChild(email);
        li.appendChild(city);
        li.appendChild(company);

        usersList.appendChild(li);
    });
}


// Load users from the API
async function loadUsers() {
    status.textContent = "Loading users...";
    loadButton.disabled = true;

    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );

        // Check if the HTTP request succeeded
        if (!response.ok) {
            throw new Error("Failed to load users.");
        }

        // Convert JSON response into JavaScript data
        const data = await response.json();

        // Store users in our array
        users = data;

        // Display all users
        renderUsers(users);

        status.textContent = "Users loaded successfully.";

    } catch (error) {
        usersList.textContent = "";
        status.textContent = "Error: Could not load users.";

    } finally {
        // Enable button whether request succeeds or fails
        loadButton.disabled = false;
    }
}


// Load users when button is clicked
loadButton.addEventListener("click", loadUsers);


// Filter users without making another API request
filterInput.addEventListener("input", function () {
    const searchText = filterInput.value.trim().toLowerCase();

    const filteredUsers = users.filter(function (user) {
        return user.name.toLowerCase().includes(searchText);
    });

    renderUsers(filteredUsers);

    // If users have not been loaded yet
    if (users.length === 0) {
        status.textContent = "Load users first.";
        return;
    }

    // If no user matches the search
    if (filteredUsers.length === 0) {
        status.textContent = "No users match your filter.";
    } else {
        status.textContent = `${filteredUsers.length} user(s) found.`;
    }
});