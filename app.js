const API_URL = "https://script.google.com/macros/s/AKfycbzSo_nKeIp-nymJe6oZLuGT_lJoy0QHdYdBX6QefjM9CCi7e9iqRQlH-t3FmqcCaUr86A/exec";

let properties = [];

// Load data on start
window.onload = fetchProperties;

// Fetch all properties
async function fetchProperties() {
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

    renderTable();
}

// Render table
function renderTable() {
    const tbody = document.querySelector("#propertyTable tbody");
    tbody.innerHTML = "";

    properties.forEach(p => {
        const row = `       <tr>         <td>${p.name}</td>         <td>${p.address}</td>         <td>${p.price}</td>         <td>${p.size}</td>         <td>${p.pricePerSqft}</td>         <td>${p.total}</td>         <td>           <button class="edit" onclick="editProperty('${p.id}')">Edit</button>           <button class="delete" onclick="deleteProperty('${p.id}')">Delete</button>         </td>       </tr>
    `;
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
}

// Delete
async function deleteProperty(id) {
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
}
