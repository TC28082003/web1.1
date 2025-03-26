// Sélectionner l'élément input
const file = document.getElementById('csvfile');

// Attacher un événement de changement
file.addEventListener("change", prend_fichier);
let rows = [];
let savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || {}; // Object to store saved profiles
let lastVisitedProfile = ""; //
let savedprofilesparent = JSON.parse(localStorage.getItem('savedprofilesparent')) || {};

// Fonction pour lire le fichier CSV
function prend_fichier(event) {
    const fichier = event.target.files[0]; // Récupérer le fichier sélectionné
    if (fichier) {
        const lire = new FileReader();
        lire.onload = function (e) {
            const content = e.target.result;
            display_list_profiles(content, fichier); // Appeler affichage avec le contenu du fichier
        };
        lire.readAsText(fichier);
    } else {
        console.error("No files selected");
    }
}

function detectDelimiter(content) {
       const delimiters = [",", ";", "\t"]; // Liste des délimiteurs possibles
       let detected = ",";
       let maxCols = 0;

       delimiters.forEach(delim => {
           const numCols = content.split("\n")[0].split(delim).length;
           if (numCols > maxCols) {
               maxCols = numCols;
               detected = delim;
           }
       });
       return detected;
}

function normalizeLineEndings(content) {
    // Remplace d'abord \r\n (Windows) en \n, puis remplace tous les \r en \n
    console.log("Sucess repalce!");
    return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function isCSVFormat(content) {
    const normalizedContent = normalizeLineEndings(content); // Normaliser le contenu
    const delimiter = detectDelimiter(normalizedContent);
    const lines = content.trim()
        .split("\n")
        .filter(line => line.trim() !== ""); // Retirer les lignes vides

    const nbColumns = lines[0].split(delimiter).length; // Compter le nombre de colonnes de la première ligne

    // Vérifier chaque ligne pour s'assurer qu'elles ont le même nombre de colonnes
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].split(delimiter).length !== nbColumns) {
            return false; // Retourner faux si une ligne a un nombre de colonnes différent
        }
    }

    return true; // Si toutes les lignes ont le même nombre de colonnes, c'est un CSV valide
}

// Fonction pour afficher le contenu sous forme de tableau et ajouter le bouton avec le nom du fichier
function display_list_profiles(contenu, fichier) {
    if (!isCSVFormat(contenu)) {
        alert("This is not a valid CSV file!");
        return;
    }

    const normalizedContent = normalizeLineEndings(contenu); // Normaliser le contenu
    const delimiter = detectDelimiter(normalizedContent); // Détecter le délimiteur
    const lines = normalizedContent.split("\n").filter((line) => line.trim() !== ""); // Éviter les lignes vides

    if (lines.length === 0) return;

    // Stocker les lignes pour un accès ultérieur
    rows = [];

    for (let i = 0; i < lines.length; i++) {
        const lignes_i = lines[i].split(delimiter); // Utiliser le délimiteur correct
        rows.push(lignes_i); // Ajouter les lignes dans le tableau
    }
    delete_delimiter();
    retirerLignesVides();
    let totalData = {};

    // Parcourir les index des colonnes sélectionnées et les remplir avec leurs données
    for(let j = 0; j < rows[0].length; j++) {
        totalData[rows[0][j]] = [];
        for (let i = 1; i < rows.length; i++) { // Ignorer la première ligne (en-têtes)
            if (rows[i] && rows[i][j] !== undefined) {
                totalData[rows[0][j]].push(rows[i][j]);
            }
        }
    }
    savedProfiles[fichier.name] = totalData;
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
    console.log(savedProfiles);
    let htmlContent = "";

    // Section pour afficher ou modifier le nom du profil
    htmlContent += `
        <div id="profileContainer" style="margin-bottom: 20px; text-align: center;">
            <h2 id="profileTitle" style="font-size: 22px; font-weight: bold; color: #007bff; margin-bottom: 10px;">
                Profile Name : <span id="displayProfileName" style="color: #FF4500;"></span>
            </h2>
        </div>
    `;

    // Ajout d'un bouton pour le nom du fichier
    htmlContent += `
        <fieldset>
    <legend>Files list</legend>
    <div id="fileListContainer" class="file-list">
      <!-- Your file items will be appended here -->
    </div>
</fieldset>
    `;

    htmlContent += `
        <fieldset><legend>Previous selections</legend>
            <div id ="profileListContainer" class="select-list">
            </div>
        </fieldset>
    `;
    
    // Zone pour afficher les colonnes (sera remplie via la fonction `display_colonnes`)
    htmlContent += `
        <fieldset><legend>Display columns</legend>
            <div id="columnDisplay" style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                Please select a profile to display its columns.
            </div>
        </fieldset>
    `;

    // Ajouter les boutons pour sauvegarder et afficher
    htmlContent += `
        <div style="margin-top: 20px; text-align: center;">
            <button class="button1" onclick="Save_profile()">
                Save selection
            </button>
            <button class="button1" onclick="delete_profil()">
                Delete data
            </button>
            <button class="button1" onclick="simlilar_profile()">
                Display patients
            </button>
        </div>
    `;

    // Afficher le contenu HTML généré dans l'élément table
    document.getElementById("table").innerHTML = htmlContent;
    updateFileList();
}

// Fonction pour sauvegarder un profil
function Save_profile() {
    let profileNameparent = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
    const profileName = prompt("Please enter a profile name :");
    const profileNameData = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
    let selectedCols = Array.from(document.querySelectorAll('input.colSelect:checked')).map(input => parseInt(input.value));
    // Vérifier si un nom a été saisi
    if (!profileName || profileName.trim() === "") {
        alert("Name of the profile cannot be empty !");
        return;
    }

    if (selectedCols.length === 0) {
        alert("Please select at least one column for the profile.");
        return;
    }

    if( savedProfiles[profileName] ) {
        alert("Profile exists. Please choose another profile name!");
        return;
    }

    if (!profileNameData || profileNameData === "(Aucun)") {
        alert("No profile selected. Please select a profile from the list!");
        return;
    }

    // Récupérer les données du profil
    const profileData = savedProfiles[profileNameData];
    let rows = [];

    console.log(profileData);
    // Ajouter les noms des colonnes comme première ligne
    const columnNames = Object.keys(profileData); // Obtenir les clés des colonnes
    rows.push(columnNames); // Première ligne avec les noms des colonnes

    // Trouver le nombre maximum de lignes nécessaire
    const maxRows = Math.max(...Object.values(profileData).map(col => col.length));

    // Ajouter les données ligne par ligne
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        let row = columnNames.map(colName => profileData[colName][rowIndex] || ""); // Extraire les données par colonne
        rows.push(row);
    }

    // Créer un objet pour stocker les colonnes sélectionnées et leurs valeurs
    let selectedData = {};

    // Parcourir les index des colonnes sélectionnées et les remplir avec leurs données
    selectedCols.forEach(colIndex => {
        selectedData[rows[0][colIndex]] = [];
        for (let i = 1; i < rows.length; i++) { // Ignorer la première ligne (en-têtes)
            if (rows[i] && rows[i][colIndex] !== undefined) {
                selectedData[rows[0][colIndex]].push(rows[i][colIndex]);
            }
        }
    });
    savedProfiles[profileName] = selectedData;

    let profile_parent = profileName + "_parent";
    let profile_parent_parent = profileNameparent + "_parent";
    console.log("profilename parent parent: ",profile_parent_parent);
    while(savedprofilesparent[profile_parent_parent]) {
        profileNameparent = savedprofilesparent[profile_parent_parent];
        console.log("profilenameparent: ",profileNameparent);
        profile_parent_parent = profileNameparent + "_parent";
    }
    savedprofilesparent[profile_parent] = profileNameparent;
    localStorage.setItem('savedprofilesparent', JSON.stringify(savedprofilesparent));
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
    console.log(savedprofilesparent);
    console.log(savedProfiles);
    display_profile(profileName);
    Array.from(document.querySelectorAll('input[name="columns"]')).forEach((checkbox) => (checkbox.checked = false));
    alert(`Profile "${profileName}" has been saved successfully!`);
}

function updateFileList() {
    const fileListContainer = document.getElementById("fileListContainer");
    if (!fileListContainer) {
        console.error("Container for profile list ('fileListContainer') not found!");
        return;
    }

    // Nettoyer le conteneur pour éviter les doublons
    fileListContainer.innerHTML = "";

    // Ajouter un bouton pour chaque profil dans `savedProfiles`
    Object.keys(savedProfiles).forEach((profileName) => {
        let profile_parent = profileName + "_parent";
        if(!savedprofilesparent[profile_parent]) {
            const profileButton = document.createElement("button");
            profileButton.textContent = profileName;
            profileButton.style.cssText = `
                width: 100%;
                padding: 10px;
                margin: 5px 0;
                color: white;
                background-color: #007bff;
                border: none;
                border-radius: 30px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s ease-in-out;
                text-align: center;
            `;

            // Ajouter un événement 'click'
        profileButton.onclick = () => {
            // Réinitialiser la couleur de tous les boutons
            Array.from(fileListContainer.children).forEach((btn) => {
                btn.style.backgroundColor = "#007bff"; // Couleur par défaut
            });

            // Changer la couleur du bouton cliqué
            profileButton.style.backgroundColor = "#28a745"; // Couleur par exemple 'vert'
            display_profile(profileName);
    };

        // Ajouter le bouton au conteneur
        fileListContainer.appendChild(profileButton);
        }
    });


}

function display_profile(profileName) {
    const profileListContainer = document.getElementById("profileListContainer");
    if (!profileName || profileName === "(Aucun)") {
        alert("No profile selected. Please select a profile from the list!");
        return;
    }

    if (!profileListContainer) {
        console.error("Container for profile list ('fileListContainer') not found!");
        return;
    }

    const visitedProfiles = new Set();
    // Nettoyer le conteneur pour éviter les doublons
    profileListContainer.innerHTML = "";

    // Ajouter un bouton pour chaque profil dans `savedProfiles`
    Object.keys(savedProfiles).forEach((childProfile) => {
        if (visitedProfiles.has(childProfile)) return;
        let profile_parent = childProfile + "_parent";
        if (savedprofilesparent[profile_parent] === profileName) {
            const profileButton = document.createElement("button");
            profileButton.textContent = childProfile;
            profileButton.style.cssText = `
                width: 100%;
                padding: 10px;
                margin: 5px 0;
                color: white;
                background-color: #007bff;
                border: none;
                border-radius: 30px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s ease-in-out;
                text-align: center;
            `;

            // Ajouter un événement 'click'
        profileButton.onclick = () => {
            // Réinitialiser la couleur de tous les boutons
            Array.from(profileListContainer.children).forEach((btn) => {
                btn.style.backgroundColor = "#007bff"; // Couleur par défaut
            });

            // Changer la couleur du bouton cliqué
            profileButton.style.backgroundColor = "#28a745"; // Couleur par exemple 'vert'
            display_profile_colums(childProfile);
        };

            // Ajouter le bouton au conteneur
            profileListContainer.appendChild(profileButton);
        }
    });
        display_profile_colums(profileName);
}

// Fonction pour afficher toutes les colonnes du profil `name_profile`
function display_profile_colums(profileName) {
    const profileData = savedProfiles[profileName];
    if (!profileData) {
        return;
    }

    const columnHeaders = Object.keys(profileData); // Les colonnes (les clés)

    // Obtenir l'en-tête de colonnes (première ligne du fichier)
    let htmlColonnes = "<div class='display-columns'>";

    for (let j = 0; j < columnHeaders.length; j++) {
        // Générer chaque colonne
        htmlColonnes += `
        <div style="width: 80%;">
            <input type="checkbox" class="colSelect" id="${j}" value="${j}">
            <label for="${j}">${columnHeaders[j]}</label>
        </div>`;
    }
    htmlColonnes += "</div>";
    // Afficher les colonnes dans le conteneur de colonnes
    document.getElementById("columnDisplay").innerHTML = htmlColonnes;
    // Mettre à jour le nom du profil activement sélectionné
    document.getElementById("displayProfileName").textContent = profileName;
        // Mémoriser le dernier profil visité dans une variable globale
    lastVisitedProfile = profileName;
    // Optionnel : stocker dans le localStorage si vous voulez le rendre persistant
    localStorage.setItem("lastVisitedProfile", profileName);

}


function delete_profil() {
    const profileName = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
    if (!profileName || profileName === "(Aucun)") {
        alert("No profile selected. Please select a profile from the list!");
        return;
    }

    // Confirmation avant suppression
    if (!confirm(`Do you really want to delete the profile: "${profileName}" ?`)) {
        return;
    }
    Object.keys(savedProfiles).forEach((childProfile) => {
        let profile_parent = childProfile + "_parent";
        if (savedprofilesparent[profile_parent] === profileName) {
            delete savedProfiles[childProfile];
            delete savedprofilesparent[childProfile + "_parent"];

        }
    });

    // Supprimer le profil de la variable profiles
    delete savedProfiles[profileName];
    delete savedprofilesparent[profileName + "_parent"];

    // Mettre à jour dans le stockage local
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
    localStorage.setItem('savedprofilesparent', JSON.stringify(savedprofilesparent));
    console.log(savedprofilesparent);
    console.log(savedProfiles);
    updateFileList();
    display_profile(profileName);
    alert(`Profile "${profileName}" has been deleted successfully!`);
}

let similarityWindow = null;
function simlilar_profile() {
    let  selectedColumns = Array.from(document.querySelectorAll('input.colSelect:checked')).map((input) =>
        parseInt(input.value)
    );
    console.log("Columns: ",selectedColumns);
    const profileName = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
    console.log("Profilename: ",profileName);
    if (!profileName || profileName === "(Aucun)") {
        alert("No profile selected. Please select a profile from the list!");
        return;
    }
    // Récupérer les données du profil
    const profileData = savedProfiles[profileName];
    let data_transform = [];

    if (!profileData) {
        alert(`Profile "${profileName}" does not exist!`);
        return;
    }
    console.log(profileData);
    // Ajouter les noms des colonnes comme première ligne
    const columnNames = Object.keys(profileData); // Obtenir les clés des colonnes
    data_transform.push(columnNames); // Première ligne avec les noms des colonnes

    // Trouver le nombre maximum de lignes nécessaire
    const maxRows = Math.max(...Object.values(profileData).map(col => col.length));

    // Ajouter les données ligne par ligne
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        let row = columnNames.map(colName => profileData[colName][rowIndex] || ""); // Extraire les données par colonne
        data_transform.push(row);
    }

    // Résultat final
    console.log(data_transform);

    if (savedprofilesparent[profileName + "_parent"]){
        let length_data = data_transform[0].length;
        if (selectedColumns.length === 0){
            selectedColumns = [...Array(length_data)].map((_, index) => index);
        }
    }
    else {
        if (selectedColumns.length === 0) {
            alert("Please select at least one column to Similarity!");
            return;
        }
    }

    console.log("Columns: ",selectedColumns);


    localStorage.setItem('selectedColumns', JSON.stringify(selectedColumns));
    localStorage.setItem('data_transform', JSON.stringify(data_transform));
    localStorage.setItem('profileName', JSON.stringify(profileName));

    const similarityName = localStorage.getItem("similarityTabName") || "similaritytab";
    //Vérification et gestion de la fenêtre `similarity.html`
    if (similarityWindow && !similarityWindow.closed) {
        // Si la fenêtre existe et est ouverte, envoyer une commande pour mettre à jour
        similarityWindow.postMessage({ action: 'updateTable' }, '*');
        similarityWindow.focus(); // Ramener au premier plan
    } else {
        // Sinon, ouvrir une nouvelle fenêtre et conserver la référence
        similarityWindow = window.open('similarity.html', similarityName);

        // Attendre que la fenêtre soit prête (au cas où le script n'est pas chargé immédiatement)
        similarityWindow.onload = () => {
            similarityWindow.postMessage({ action: 'updateTable' }, '*');
        };
    }
}


 // On page load, register this tab as "Page1"
        document.addEventListener("DOMContentLoaded", () => {
            const pagehomeName = "pagehometab";
            // Store the tab name for Page1
            localStorage.setItem("pagehomeTabName", pagehomeName);
            window.name = pagehomeName; // Assign a unique name to this tab
        });

        // When this tab is closed or refreshed, clear the reference in localStorage
        window.addEventListener("beforeunload", () => {
            localStorage.removeItem("page1TabName");
        });

        document.addEventListener("DOMContentLoaded", () => {
            display_profile(savedprofilesparent[`${profileName}_parent`]);
        });
function delete_delimiter() {
    if (rows.length === 0) {
        console.error("No data available for processing.");
        return;
    }

    // Parcourir chaque ligne de données
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            // Supprimer les guillemets simples ou doubles autour de chaque cellule
            rows[i][j] = rows[i][j].trim().replace(/^['"]|['"]$/g, '');
        }
    }

    console.log("Delimiters successfully removed!");
    console.log(rows); // Affiche les données nettoyées
}
function retirerLignesVides() {
    if (rows.length === 0) {
        console.error("No data available for processing.");
        return;
    }

     rows = rows.filter(row => {
        // Vérifier si au moins une des colonnes dans une ligne n'est pas vide
        return row.some(value => value.trim() !== "");
    });

    console.log("Empty lines removed. Here is the updated data:");
    console.log(rows);
}




