const API_URL = "https://script.google.com/macros/s/AKfycbzSo_nKeIp-nymJe6oZLuGT_lJoy0QHdYdBX6QefjM9CCi7e9iqRQlH-t3FmqcCaUr86A/exec";

let properties = [];
let filtered = [];
let sortField = '';
let sortDir = 0;
let columnFilters = {};

const TABLE_COLS = [
    { key: 'id',           label: 'ID' },
    { key: 'name',         label: 'Name' },
    { key: 'address',      label: 'Address' },
    { key: 'type',         label: 'Type' },
    { key: 'category',     label: 'Category' },
    { key: 'listingType',  label: 'Listing' },
    { key: 'bedrooms',     label: 'Beds' },
    { key: 'bathrooms',    label: 'Baths' },
    { key: 'price',        label: 'Price' },
    { key: 'size',         label: 'Size (sqft)' },
    { key: 'pricePerSqft', label: 'Per Sqft' },
    { key: 'total',        label: 'Total' },
    { key: 'status',       label: 'Status' },
    { key: 'furnishing',   label: 'Furnishing' },
    { key: 'availableFor', label: 'Available For' },
    { key: 'rera',         label: 'RERA' },
    { key: 'buildingAge',  label: 'Age (yr)' },
    { key: 'purchaseDate', label: 'Date' },
    { key: 'ownerPhone',   label: 'Owner Phone' },
    { key: 'notes',        label: 'Notes' }
];

// Defines what kind of filter control to use per column
const COL_FILTER_TYPE = {
    type:         { kind: 'select', options: ['', 'Apartment', 'Villa', 'Plot', 'Independent House', 'Penthouse'] },
    category:     { kind: 'select', options: ['', 'Residential', 'Commercial', 'Industrial', 'Mixed Use'] },
    listingType:  { kind: 'select', options: ['', 'For Sale', 'For Rent'] },
    status:       { kind: 'select', options: ['', 'Available', 'Sold', 'Rented'] },
    furnishing:   { kind: 'select', options: ['', 'Unfurnished', 'Semi-Furnished', 'Furnished'] },
    availableFor: { kind: 'select', options: ['', 'Any', 'Family', 'Single Women', 'Single Men'] },
    rera:         { kind: 'select', options: ['', 'Yes', 'No'] },
    bedrooms:     { kind: 'number' },
    bathrooms:    { kind: 'number' },
    price:        { kind: 'number' },
    size:         { kind: 'number' },
    pricePerSqft: { kind: 'number' },
    total:        { kind: 'number' },
    buildingAge:  { kind: 'number' },
    purchaseDate: { kind: 'date' }
};

window.onload = function () {
    buildTableHeader();
    fetchProperties();
};

function generateId() {
    var ts = Date.now().toString(36).toUpperCase();
    var rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return 'PROP-' + ts + rand;
}

function formatCurrency(n) {
    return '\u20b9' + Number(n).toLocaleString('en-IN');
}

function showLoader(v) {
    document.getElementById('loader').classList.toggle('active', v);
}

function buildTableHeader() {
    var headerRow = document.getElementById('headerRow');
    var filterRow = document.getElementById('filterRow');

    TABLE_COLS.forEach(function (col) {
        var th = document.createElement('th');
        th.dataset.sort = col.key;
        th.textContent = col.label;
        th.classList.add('sortable');
        th.title = 'Click to sort';
        th.addEventListener('click', function () { handleSort(col.key, th); });
        var arrow = document.createElement('span');
        arrow.className = 'sort-arrow';
        arrow.textContent = ' \u21C5';
        th.appendChild(arrow);
        headerRow.appendChild(th);
    });

    var actTh = document.createElement('th');
    actTh.textContent = 'Actions';
    actTh.classList.add('actions-col');
    headerRow.appendChild(actTh);

    TABLE_COLS.forEach(function (col) {
        var th = document.createElement('th');
        var ft = COL_FILTER_TYPE[col.key];
        var ctrl;

        if (ft && ft.kind === 'select') {
            ctrl = document.createElement('select');
            ctrl.className = 'col-filter col-filter-select';
            ft.options.forEach(function (opt) {
                var o = document.createElement('option');
                o.value = opt;
                o.textContent = opt === '' ? 'All' : opt;
                ctrl.appendChild(o);
            });
            ctrl.addEventListener('change', function (e) {
                columnFilters[col.key] = e.target.value.trim().toLowerCase();
                applyFiltersAndSort();
            });
        } else if (ft && ft.kind === 'number') {
            ctrl = document.createElement('input');
            ctrl.type = 'number';
            ctrl.className = 'col-filter';
            ctrl.placeholder = 'Filter...';
            ctrl.addEventListener('input', function (e) {
                columnFilters[col.key] = e.target.value.trim();
                applyFiltersAndSort();
            });
        } else if (ft && ft.kind === 'date') {
            ctrl = document.createElement('input');
            ctrl.type = 'date';
            ctrl.className = 'col-filter';
            ctrl.addEventListener('input', function (e) {
                columnFilters[col.key] = e.target.value.trim();
                applyFiltersAndSort();
            });
        } else {
            ctrl = document.createElement('input');
            ctrl.type = 'text';
            ctrl.className = 'col-filter';
            ctrl.placeholder = 'Filter...';
            ctrl.addEventListener('input', function (e) {
                columnFilters[col.key] = e.target.value.trim().toLowerCase();
                applyFiltersAndSort();
            });
        }

        ctrl.dataset.col = col.key;
        th.appendChild(ctrl);
        filterRow.appendChild(th);
    });

    var emptyTh = document.createElement('th');
    filterRow.appendChild(emptyTh);
}

function handleSort(key, thEl) {
    document.querySelectorAll('#headerRow th').forEach(function (h) {
        var a = h.querySelector('.sort-arrow');
        if (a) a.textContent = ' \u21C5';
        h.classList.remove('sort-asc', 'sort-desc');
    });

    if (sortField === key) {
        if (sortDir === 1) { sortDir = -1; }
        else { sortField = ''; sortDir = 0; }
    } else {
        sortField = key;
        sortDir = 1;
    }

    var arrow = thEl.querySelector('.sort-arrow');
    if (sortDir === 1) {
        arrow.textContent = ' \u25B2';
        thEl.classList.add('sort-asc');
    } else if (sortDir === -1) {
        arrow.textContent = ' \u25BC';
        thEl.classList.add('sort-desc');
    } else {
        arrow.textContent = ' \u21C5';
    }

    applyFiltersAndSort();
}

async function fetchProperties() {
    showLoader(true);
    try {
        var res = await fetch(API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        var data = await res.json();
        properties = data.slice(1).map(function (row) {
            return {
                id:           row[0]  || generateId(),
                name:         row[1]  || '',
                address:      row[2]  || '',
                price:        Number(row[3])  || 0,
                size:         Number(row[4])  || 0,
                pricePerSqft: Number(row[5])  || 0,
                total:        Number(row[6])  || 0,
                type:         row[7]  || '',
                bedrooms:     Number(row[8])  || 0,
                bathrooms:    Number(row[9])  || 0,
                status:       row[10] || 'Available',
                furnishing:   row[11] || 'Unfurnished',
                availableFor: row[12] || 'Any',
                rera:         row[13] === true || row[13] === 'Yes',
                buildingAge:  Number(row[14]) || 0,
                purchaseDate: row[15] || '',
                notes:        row[16] || '',
                ownerPhone:   row[17] || '',
                listingType:  row[18] || '',
                category:     row[19] || ''
            };
        });
        localStorage.setItem('properties', JSON.stringify(properties));
    } catch (e) {
        properties = JSON.parse(localStorage.getItem('properties') || '[]');
    }
    showLoader(false);
    applyFiltersAndSort();
}

function applyFiltersAndSort() {
    filtered = properties.filter(function (p) {
        return TABLE_COLS.every(function (col) {
            var q = columnFilters[col.key];
            if (q === undefined || q === null || q === '') return true;

            var val = p[col.key];
            if (col.key === 'rera') val = val ? 'yes' : 'no';
            var valStr = String(val == null ? '' : val).toLowerCase();
            var ft = COL_FILTER_TYPE[col.key];

            if (ft && ft.kind === 'select') {
                return valStr === q.toLowerCase();
            }
            if (ft && ft.kind === 'number') {
                return valStr.includes(String(q));
            }
            if (ft && ft.kind === 'date') {
                return valStr === q;
            }
            // text: case-insensitive contains
            return valStr.includes(q.toLowerCase());
        });
    });

    if (sortField && sortDir !== 0) {
        filtered.sort(function (a, b) {
            var va = a[sortField];
            var vb = b[sortField];
            if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
            if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
            if (va > vb) return sortDir;
            if (va < vb) return -sortDir;
            return 0;
        });
    }

    renderTable();
}

function renderTable() {
    var tbody = document.querySelector('#propertyTable tbody');
    var table = document.getElementById('propertyTable');
    var empty = document.getElementById('emptyState');

    tbody.innerHTML = '';
    table.style.display = 'table';
    empty.style.display = 'none';

    if (filtered.length === 0) {
        var noDataTr = document.createElement('tr');
        var noDataTd = document.createElement('td');
        noDataTd.colSpan = TABLE_COLS.length + 1;
        noDataTd.className = 'no-data-row';
        noDataTd.textContent = properties.length === 0
            ? 'No properties added yet. Use the form above to add one!'
            : 'No matching properties found. Try adjusting your filters.';
        noDataTr.appendChild(noDataTd);
        tbody.appendChild(noDataTr);
        return;
    }

    filtered.forEach(function (p) {
        var tr = document.createElement('tr');
        TABLE_COLS.forEach(function (col) {
            var td = document.createElement('td');
            switch (col.key) {
                case 'price':
                case 'total':
                    td.textContent = formatCurrency(p[col.key]);
                    break;
                case 'pricePerSqft':
                    td.textContent = formatCurrency(Math.round(p[col.key])) + '/sqft';
                    break;
                case 'size':
                    td.textContent = Number(p[col.key]).toLocaleString('en-IN') + ' sqft';
                    break;
                case 'rera':
                    td.textContent = p[col.key] ? 'Yes' : 'No';
                    break;
                case 'status':
                    var span = document.createElement('span');
                    span.className = 'status-badge status-' + p.status.toLowerCase().replace(/\s+/g, '-');
                    span.textContent = p.status;
                    td.appendChild(span);
                    break;
                default:
                    td.textContent = p[col.key] != null ? p[col.key] : '';
            }
            tr.appendChild(td);
        });

        var actTd = document.createElement('td');
        actTd.classList.add('actions-cell');
        var editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit';
        editBtn.innerHTML = '&#9998; Edit';
        editBtn.onclick = (function (id) { return function () { editProperty(id); }; })(p.id);
        var delBtn = document.createElement('button');
        delBtn.className = 'action-btn delete';
        delBtn.innerHTML = '&#128465; Delete';
        delBtn.onclick = (function (id) { return function () { deleteProperty(id); }; })(p.id);
        actTd.appendChild(editBtn);
        actTd.appendChild(delBtn);
        tr.appendChild(actTd);

        tbody.appendChild(tr);
    });
}

async function saveProperty() {
    var existingId = document.getElementById('propId').value;
    var id = existingId || generateId();
    var name = document.getElementById('name').value.trim();
    var address = document.getElementById('address').value.trim();
    var type = document.getElementById('type').value;
    var category = document.getElementById('category').value;
    var listingType = document.getElementById('listingType').value;
    var price = Number(document.getElementById('price').value);
    var size = Number(document.getElementById('size').value);
    var bedrooms = Number(document.getElementById('bedrooms').value) || 0;
    var bathrooms = Number(document.getElementById('bathrooms').value) || 0;
    var status = document.getElementById('status').value;
    var furnishing = document.getElementById('furnishing').value;
    var availableFor = document.getElementById('availableFor').value;
    var rera = document.getElementById('rera').checked;
    var buildingAge = Number(document.getElementById('buildingAge').value) || 0;
    var purchaseDate = document.getElementById('purchaseDate').value;
    var ownerPhone = document.getElementById('ownerPhone').value.trim();
    var notes = document.getElementById('notes').value.trim();

    if (!name || !address || !type) {
        alert('Please fill in Name, Address, and Type.');
        return;
    }
    if (price < 0) { alert('Price must be >= 0.'); return; }
    if (!size || size <= 0) { alert('Size must be > 0.'); return; }

    var pricePerSqft = price / size;
    var total = price;

    var payload = {
        id: id, name: name, address: address, type: type,
        category: category, listingType: listingType,
        bedrooms: bedrooms, bathrooms: bathrooms,
        price: price, size: size, pricePerSqft: pricePerSqft, total: total,
        status: status, furnishing: furnishing, availableFor: availableFor,
        rera: rera, buildingAge: buildingAge, purchaseDate: purchaseDate,
        ownerPhone: ownerPhone, notes: notes
    };

    try { await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) }); } catch (e) { }

    var idx = properties.findIndex(function (x) { return x.id === id; });
    if (idx >= 0) properties[idx] = payload;
    else properties.push(payload);

    localStorage.setItem('properties', JSON.stringify(properties));
    resetForm();
    applyFiltersAndSort();
}

function editProperty(id) {
    var p = properties.find(function (x) { return x.id === id; });
    if (!p) return;

    document.getElementById('idGroup').style.display = '';
    document.getElementById('propId').value = p.id;
    document.getElementById('name').value = p.name;
    document.getElementById('address').value = p.address;
    document.getElementById('type').value = p.type || '';
    document.getElementById('category').value = p.category || '';
    document.getElementById('listingType').value = p.listingType || '';
    document.getElementById('price').value = p.price;
    document.getElementById('size').value = p.size;
    document.getElementById('bedrooms').value = p.bedrooms || '';
    document.getElementById('bathrooms').value = p.bathrooms || '';
    document.getElementById('status').value = p.status || 'Available';
    document.getElementById('furnishing').value = p.furnishing || 'Unfurnished';
    document.getElementById('availableFor').value = p.availableFor || 'Any';
    document.getElementById('rera').checked = !!p.rera;
    document.getElementById('buildingAge').value = p.buildingAge || '';
    document.getElementById('purchaseDate').value = p.purchaseDate || '';
    document.getElementById('ownerPhone').value = p.ownerPhone || '';
    document.getElementById('notes').value = p.notes || '';

    document.getElementById('formTitle').textContent = 'Edit Property';
    document.getElementById('saveBtn').innerHTML = '&#10003; Update Property';
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProperty(id) {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try { await fetch(API_URL, { method: 'DELETE', body: JSON.stringify({ id: id }) }); } catch (e) { }
    properties = properties.filter(function (p) { return p.id !== id; });
    localStorage.setItem('properties', JSON.stringify(properties));
    applyFiltersAndSort();
}

function resetForm() {
    document.getElementById('idGroup').style.display = 'none';
    document.getElementById('propId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('address').value = '';
    document.getElementById('type').value = '';
    document.getElementById('category').value = '';
    document.getElementById('listingType').value = '';
    document.getElementById('price').value = '';
    document.getElementById('size').value = '';
    document.getElementById('bedrooms').value = '';
    document.getElementById('bathrooms').value = '';
    document.getElementById('status').value = 'Available';
    document.getElementById('furnishing').value = 'Unfurnished';
    document.getElementById('availableFor').value = 'Any';
    document.getElementById('rera').checked = false;
    document.getElementById('buildingAge').value = '';
    document.getElementById('purchaseDate').value = '';
    document.getElementById('ownerPhone').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('formTitle').textContent = 'Add New Property';
    document.getElementById('saveBtn').innerHTML = '&#10003; Save Property';
}

function getExportData() {
    var headers = TABLE_COLS.map(function (c) { return c.label; });
    var rows = filtered.map(function (p) {
        return TABLE_COLS.map(function (c) {
            if (c.key === 'rera') return p[c.key] ? 'Yes' : 'No';
            return p[c.key] != null ? p[c.key] : '';
        });
    });
    return { headers: headers, rows: rows };
}

function exportXlsx() {
    if (!filtered.length) { alert('No data to export.'); return; }
    var d = getExportData();
    var ws = XLSX.utils.aoa_to_sheet([d.headers].concat(d.rows));
    ws['!cols'] = d.headers.map(function (h, i) {
        var max = Math.max(h.length, Math.max.apply(null, d.rows.map(function (r) { return String(r[i]).length; })));
        return { wch: Math.min(max + 2, 30) };
    });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Properties');
    XLSX.writeFile(wb, 'properties_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}

function exportPdf() {
    if (!filtered.length) { alert('No data to export.'); return; }
    var d = getExportData();
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    doc.setFontSize(16);
    doc.text('Property Manager - Export', 14, 15);
    doc.setFontSize(9);
    doc.text('Generated: ' + new Date().toLocaleString('en-IN'), 14, 21);
    doc.autoTable({
        head: [d.headers],
        body: d.rows,
        startY: 26,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [32, 58, 67], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 249, 251] },
        margin: { left: 10, right: 10 }
    });
    doc.save('properties_' + new Date().toISOString().slice(0, 10) + '.pdf');
}
