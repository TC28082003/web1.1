        // Variables globales pour les colonnes et les lignes
        let selectedColumns = [];
        let data_transform = [];
        let profileName = null;
        let currentlySortingColumnIndex = -1; // To store which column index we are sorting

        // Afficher le tableau
        function cleanProfileName(name) {
            // Replace unwanted characters " and \ with an empty string
            return name.replace(/["\\]/g, '');
        }

        function hideSortOptions() {
            const popup = document.getElementById('sortOptionsPopup');
            if (popup) {
                popup.style.display = 'none';
            }
            currentlySortingColumnIndex = -1;
        }

        function showSortOptions(columnIndex, event) {
            if (event.target.tagName === 'INPUT') {
                 return;
            }

            const popup = document.getElementById('sortOptionsPopup');
            const columnNameElement = document.getElementById('sortColumnName');
            if (!popup || !columnNameElement || columnIndex < 0 || !data_transform[0]) return;

            // Get the actual column index from the original data structure
            const actualColIndex = selectedColumns[columnIndex]; // Map displayed index to original data index
            const columnName = data_transform[0][actualColIndex];

            currentlySortingColumnIndex = actualColIndex;
            columnNameElement.textContent = columnName;

            const rect = event.currentTarget.getBoundingClientRect();
            popup.style.left = `${window.scrollX + rect.left}px`;
            popup.style.top = `${window.scrollY + rect.bottom}px`; // Position below the header
            popup.style.display = 'block';

        }
        console.log(profileName);
        function afficherTableau() {
            if (profileName) { // Only clean if it exists
                profileName = cleanProfileName(profileName);
            }
            console.log("Data for display: ", data_transform);
            console.log("Selected columns for display:", selectedColumns);

            let tableHtml = `<h1><P></P> ${profileName || 'No Profile'}</h1><table><thead><tr>`;
            tableHtml += "<th>Select lines</th>"; // Non-sortable header

            // Add header cells with click listeners for sorting
            selectedColumns.forEach((originalColIndex, displayIndex) => {
                // Ensure header row (data_transform[0]) exists and has the column
                const headerText = (data_transform[0] && data_transform[0][originalColIndex] !== undefined)
                                   ? data_transform[0][originalColIndex]
                                   : `Column ${originalColIndex}`;

                // Added onclick directly here for simplicity, passing displayIndex
                // Pass 'event' to get positioning info
                tableHtml += `<th onclick="showSortOptions(${displayIndex}, event)">`; // Pass the DISPLAY index
                tableHtml += `<input type='checkbox' class='columnSelect' value='${originalColIndex}' onclick="event.stopPropagation();"> `; // Stop propagation on checkbox click
                tableHtml += `${headerText}</th>`;
            });

            tableHtml += "</tr></thead><tbody>";

            // Check if data_transform has data rows
            if (data_transform.length > 1) {
                // Data rows
                for (let i = 1; i < data_transform.length; i++) {
                    tableHtml += "<tr>";
                    tableHtml += `<td><input type='checkbox' class='rowSelect' value='${i}'></td>`;
                    selectedColumns.forEach(originalColIndex => {
                         // Handle potential undefined cells gracefully
                        const cellData = (data_transform[i] && data_transform[i][originalColIndex] !== undefined)
                                       ? data_transform[i][originalColIndex]
                                       : '';
                        tableHtml += `<td>${cellData}</td>`;
                    });
                    tableHtml += "</tr>";
                }
            } else {
                // Optional: Message if no data rows
                const colCount = selectedColumns.length + 1; // +1 for the select lines column
                 tableHtml += `<tr><td colspan="${colCount}">No data rows available.</td></tr>`;
            }

            tableHtml += "</tbody></table>";
            document.getElementById('table').innerHTML = tableHtml;

            // Hide sort options popup whenever table is redrawn
            hideSortOptions();
        }
        function getTableData() {
                let tableData = [];
                // Sélectionner le tableau affiché
                const table = document.querySelector('#table table'); // Trouver le tableau dans le conteneur "table"
                const rows = table.querySelectorAll('tr'); // Récupérer toutes les lignes du tableau
                rows.forEach((row) => {
                    let rowData = [];

                    // Sélectionner toutes les cellules (th ou td)
                    const cells = row.querySelectorAll('th, td');
                    cells.forEach((cell, cellIndex) => {
                        if (cellIndex > 0) { // Ignorer la première cellule de chaque ligne
                            rowData.push(cell.innerText || cell.textContent);
                        }
                    });

                    tableData.push(rowData); // Ajouter la ligne mise à jour dans le tableau final
                });
                return tableData;
        }
        // --- Sorting Logic ---

    /**
     * Compares two values for sorting. Handles numbers and strings.
     * @param {*} a First value
     * @param {*} b Second value
     * @param {boolean} ascending True for ascending, false for descending
     * @returns {number} -1, 0, or 1 for sort comparison
     */
    function compareValues(a, b, ascending = true) {
        const valA = a === null || a === undefined ? '' : a;
        const valB = b === null || b === undefined ? '' : b;

        // Attempt numeric comparison first
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        let comparison = 0;

        if (!isNaN(numA) && !isNaN(numB)) {
            // Both are numbers
            comparison = numA - numB;
        } else {
            // At least one is not a number, use string comparison
            const strA = String(valA).toLowerCase(); // Case-insensitive string comparison
            const strB = String(valB).toLowerCase();
            comparison = strA.localeCompare(strB);
        }

        return ascending ? comparison : comparison * -1; // Reverse for descending
    }

    /**
     * Sorts the data_transform array based on the currently selected column and sort type.
     * @param {'asc' | 'desc'} sortType - The type of sorting ('asc' for ascending, 'desc' for descending)
     */
    function simple_sort(sortType) {
        console.log(`Sorting column index: ${currentlySortingColumnIndex}, type: ${sortType}`);
        if (currentlySortingColumnIndex === -1 || !data_transform || data_transform.length < 2) {
            console.log("Sorting prerequisites not met.");
            hideSortOptions();
            return; // No column selected or no data/header to sort
        }

        // Separate header row from data rows
        const headerRow = data_transform[0];
        let dataRows = data_transform.slice(1);

        // Perform the sort on dataRows
        const ascending = (sortType === 'asc');
        dataRows.sort((rowA, rowB) => {
            // Ensure rows and the specific cell exist before comparing
            const valA = rowA && rowA[currentlySortingColumnIndex] !== undefined ? rowA[currentlySortingColumnIndex] : null;
            const valB = rowB && rowB[currentlySortingColumnIndex] !== undefined ? rowB[currentlySortingColumnIndex] : null;
            return compareValues(valA, valB, ascending);
        });

        // Recombine header and sorted data rows
        data_transform = [headerRow, ...dataRows];

        // Update the displayed table
        afficherTableau(); // This will also hide the popup
    }

            // Écouter les messages de la fenêtre parent
        window.addEventListener('message', (event) => {
            if (event.data && event.data.action === 'updateTable') {
                // Mettre à jour les valeurs depuis localStorage
                const updatedCols = JSON.parse(localStorage.getItem('selectedColumns')) || [];
                const updatedRows = JSON.parse(localStorage.getItem('data_transform')) || [];
                const updatedprofileName = localStorage.getItem('profileName') || '';
                // Réinitialiser les données globales
                selectedColumns.length = 0;
                selectedColumns.push(...updatedCols);
                data_transform.length = 0;
                data_transform.push(...updatedRows);
                profileName = updatedprofileName;
                // Mettre à jour le tableau
                afficherTableau();
            }
        });
        document.addEventListener('DOMContentLoaded', () => {
            const sortAscBtn = document.getElementById('sortAscButton');
            const sortDescBtn = document.getElementById('sortDescButton');
            const closePopupBtn = document.getElementById('closeSortPopup');
            if (sortAscBtn) {
                sortAscBtn.addEventListener('click', () => simple_sort('asc'));
            }
            if (sortDescBtn) {
                sortDescBtn.addEventListener('click', () => simple_sort('desc'));
            }
            if (closePopupBtn) { // <-- Add listener for the 'x' button
                closePopupBtn.addEventListener('click', hideSortOptions); // Reuse the existing hide function
            }
            // Initial load from localStorage and display table
            selectedColumns = JSON.parse(localStorage.getItem('selectedColumns')) || [];
            data_transform = JSON.parse(localStorage.getItem('data_transform')) || [];
            profileName = localStorage.getItem('profileName') || '';
            console.log("Initial load - Columns:", selectedColumns);
            console.log("Initial load - Data:", data_transform);
            afficherTableau();
        });

        // Fonction pour calculer la distance Euclidienne entre deux vecteurs
        function euclideanDistance(vec1, vec2) {
            let sum = 0;
            for (let i = 0; i < vec1.length; i++) {
                sum += Math.pow(vec1[i] - vec2[i], 2);
            }
            return Math.sqrt(sum);
        }

function trierParDistanceEuclidienne(fullRows, selectedRows, filteredRows) {
    let ligneChoisis = [];
    let autres = [];

    // Diviser les lignes choisi avec des autres lignes
    for (let i = 0; i < filteredRows.length; i++) {
        if (selectedRows.includes(i + 1)) {
            ligneChoisis.push({ original: fullRows[i], filtered: filteredRows[i] });
        } else {
            autres.push({ original: fullRows[i], filtered: filteredRows[i] });
        }
    }
    console.log(ligneChoisis);
    console.log(autres);
    let distanceMin = [];
    // Calculer par le euclidean algorithme
    for (let i = 0; i < autres.length; i++) {
        let distances = [];
        for (let j = 0; j < ligneChoisis.length; j++) {
            let dist = euclideanDistance(autres[i].filtered, ligneChoisis[j].filtered);
            distances.push(dist);
        }
        let minDist = Math.min(...distances);
        distanceMin.push({ row: autres[i].original, distance: minDist });
    }

    // Sort par le distance
    distanceMin.sort((a, b) => a.distance - b.distance);
    console.log(distanceMin);
    // Return un nouveau table après similarité
    return [
        ...ligneChoisis.map(item => item.original),
        ...distanceMin.map(item => item.row)
    ];
}

function calculer_similarity() {
    const selectedRows = Array.from(document.querySelectorAll('input.rowSelect:checked')).map(input => parseInt(input.value));
    const selectedCols = Array.from(document.querySelectorAll('input.columnSelect:checked')).map(input => parseInt(input.value));
    let rows = getTableData();
    console.log("Rows: ",rows);

    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = "none"; // Masquer le tooltip par défaut

    if (selectedRows.length === 0) {
        tooltip.textContent = "if no line selected, message: \"Please select at least one patient!\"";
        tooltip.style.display = "block"; // Afficher le tooltip
        alert("Please select at least one row!");
        return;
    }
    else if (selectedCols.length === 0) {
        tooltip.textContent = "if no column selected, message: \"Please select at least one column!\"";
        tooltip.style.display = "block"; // Afficher le tooltip
        alert("Please select at least one column!");
        return;
    }
    else{
        tooltip.textContent = "Click here to see the result!";
        tooltip.style.display = "block"; // Afficher le tooltip
    }

    // Des valeurs pour les colonnes on a chosi
    const filteredRows = data_transform.slice(1).map(row => {
        return selectedCols.map(colIndex => parseFloat(row[colIndex]) || 0);
    });

    console.log("Fil: ",filteredRows);
    // Valeur original dans ce fichier
    const fullRows = rows.slice(1);
    console.log("Full: ",fullRows);

    // Données après similarité
    const orderedData = trierParDistanceEuclidienne(fullRows, selectedRows, filteredRows);
    console.log(orderedData);
    // Creer un table pour des nouveau fichier .csv après similarité
    let table_similarity = `<div class=\"table\" id=\"table\"> <h1> Result Similarity for ${profileName} </h1><table><thead><tr>`;
    rows[0].forEach(header => {
        table_similarity += `<th>${header}</th>`;
    });
    table_similarity += "</tr></thead><tbody>";

    orderedData.forEach(row => {
        table_similarity += "<tr>";
        row.forEach(cell => {
            table_similarity += `<td>${cell}</td>`;
        });
        table_similarity += "</tr>";
    });
    table_similarity += "</tbody></table></div>";
    localStorage.setItem('profileName', JSON.stringify(profileName));
    localStorage.setItem('table_similarity', JSON.stringify(table_similarity)); // Avec un 'I' majuscule    // Vérifier si la fenêtre `display.html` est déjà ouverte
    let iframe = parent.document.getElementById("content");
    if (iframe) {
        iframe.src = 'result_similar.html';

        // Supprimer la classe active de tous les boutons de navigation
        let navLinks = parent.document.querySelectorAll("nav a");
        navLinks.forEach(link => link.classList.remove("active"));

        // Ajouter la classe active au bouton "Display Patients"
        let result_similarButton = parent.document.getElementById("result_similar");
        if (result_similarButton) {
            result_similarButton.classList.add("active");
        }

    } else {
        console.error("L'élément #content n'existe pas !");
    }
}


function virtual_profile() {
    const selectedRows = Array.from(document.querySelectorAll('input.rowSelect:checked')).map(input => parseInt(input.value));
    let rows = getTableData();
    let selectedCols = selectedColumns;
    console.log(selectedColumns);
    const tooltip1 = document.getElementById('tooltip1');
    tooltip1.style.display = "none"; // Masquer le tooltip par défaut

    if (selectedRows.length === 0) {
        tooltip1.textContent = "if no line selected, message: \"Please select at least one patient!\"";
        tooltip1.style.display = "block"; // Afficher le tooltip
        alert("Please select at least one row!");
        return;
    }
    else {
        tooltip1.textContent = "Click here to display virtual patients!";
        tooltip1.style.display = "block"; // Afficher le tooltip
    }

    // Stocker les colonnes et les lignes dans localStorage
    localStorage.setItem('selectedRows', JSON.stringify(selectedRows));
    localStorage.setItem('selectedCols', JSON.stringify(selectedCols));
    localStorage.setItem('rows', JSON.stringify(rows));
    localStorage.setItem('profileName', JSON.stringify(profileName));
    localStorage.setItem('data_transform', JSON.stringify(data_transform));

    // Charger la page `similarity.html` dans l'iframe de index.html
    let iframe = parent.document.getElementById("content");
    if (iframe) {
        iframe.src = 'virtual.html';

        // Supprimer la classe active de tous les boutons de navigation
        let navLinks = parent.document.querySelectorAll("nav a");
        navLinks.forEach(link => link.classList.remove("active"));

        // Ajouter la classe active au bouton "Display Patients"
        let virtualButton = parent.document.getElementById("virtual");
        if (virtualButton) {
            virtualButton.classList.add("active");
        }

    } else {
        console.error("L'élément #content n'existe pas !");
    }
}


