const API_URL = "https://script.google.com/macros/s/AKfycbzSo_nKeIp-nymJe6oZLuGT_lJoy0QHdYdBX6QefjM9CCi7e9iqRQlH-t3FmqcCaUr86A/exec";

let properties = [];

// Load data on start
window.onload = fetchProperties;

// Format number as Indian currency
function formatCurrency(n) {
    return '\u20b9' + Number(n).toLocaleString('en-IN');
}

// Show / hide loader
function showLoader(visible) {
    const el = document.getElementById('loader');
    el.classList.toggle('active', visible);
}

// Fetch all properties
async function fetchProperties() {
    showLoader(true);
    const res = await fetch(API_URL);
    const data = await res.json();

    // skip header row
    properties = data.slice(1).map(row => ({
        id: row[0],
        name: row[1],
        address: row[2],
        price: Number(row[3]),
        size: Number(row[4]),
        pricePerSqft: Number(row[5]),
        total: Number(row[6])
    }));

    showLoader(false);
    renderTable();
}

// Render table
function renderTable() {
    const tbody = document.querySelector("#propertyTable tbody");
    const table = document.getElementById("propertyTable");
    const empty = document.getElementById("emptyState");
    tbody.innerHTML = "";

    if (properties.length === 0) {
        table.style.display = "none";
        empty.style.display = "block";
        return;
    }

    table.style.display = "table";
    empty.style.display = "none";

    properties.forEach(p => {
        const row = `<tr>
            <td>${p.name}</td>
            <td>${p.address}</td>
            <td>${formatCurrency(p.price)}</td>
            <td>${Number(p.size).toLocaleString('en-IN')} sqft</td>
            <td>${formatCurrency(p.pricePerSqft.toFixed(0))}</td>
            <td>${formatCurrency(p.total)}</td>
            <td>
                <button class="action-btn edit" onclick="editProperty('${p.id}')">&#9998; Edit</button>
                <button class="action-btn delete" onclick="deleteProperty('${p.id}')">&#128465; Delete</button>
            </td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Save (Add / Update)
async function saveProperty() {
    const id = document.getElementById("propertyId").value || Date.now().toString();
    const name = document.getElementById("name").value;
    const address = document.getElementById("address").value;
    const price = Number(document.getElementById("price").value);
    const size = Number(document.getElementById("size").value);

    if (!name || !address || !price || !size) {
        alert("Please fill in all fields.");
        return;
    }

    const pricePerSqft = price / size;
    const total = price;

    const payload = {
        id,
        name,
        address,
        price,
        size,
        pricePerSqft,
        total
    };

    await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    });

    resetForm();
    fetchProperties();
}

// Edit
function editProperty(id) {
    const p = properties.find(x => x.id == id);

    document.getElementById("propertyId").value = p.id;
    document.getElementById("name").value = p.name;
    document.getElementById("address").value = p.address;
    document.getElementById("price").value = p.price;
    document.getElementById("size").value = p.size;

    document.getElementById("formTitle").textContent = "Edit Property";
    document.querySelector(".btn-primary").innerHTML = "&#10003; Update Property";
    document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });
}

// Delete
async function deleteProperty(id) {
    if (!confirm("Are you sure you want to delete this property?")) return;

    await fetch(API_URL, {
        method: "DELETE",
        body: JSON.stringify({ id })
    });

    fetchProperties();
}

// Reset form
function resetForm() {
    document.getElementById("propertyId").value = "";
    document.getElementById("name").value = "";
    document.getElementById("address").value = "";
    document.getElementById("price").value = "";
    document.getElementById("size").value = "";
    document.getElementById("formTitle").textContent = "Add New Property";
    document.querySelector(".btn-primary").innerHTML = "&#10003; Save Property";
}
