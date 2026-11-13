
const API_URL = "http://localhost:3000";

async function login(username) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ username })
        });

        const data = await response.text();

        document.getElementById("result").textContent =
            `Status: ${response.status}\n${data}`;
    } catch (error) {
        document.getElementById("result").textContent =
            `Error: ${error.message}`;
    }
}

async function getAdminData() {
    try {
        const response = await fetch(`${API_URL}/adminData`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.text();

        document.getElementById("result").textContent =
            `Status: ${response.status}\n${data}`;
    } catch (error) {
        document.getElementById("result").textContent =
            `Error: ${error.message}`;
    }
}

async function logout() {
    try {
        const response = await fetch(
            "http://localhost:3000/logout",
            {
                method: "POST",
                credentials: "include"
            }
        );

        const data = await response.text();

        document.getElementById("result").textContent =
            `Status: ${response.status}\n${data}`;
    } catch (error) {
        document.getElementById("result").textContent =
            `Error: ${error.message}`;
    }
}

