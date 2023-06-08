//Vérification d'utilisation de la bonne bibliothèque en fonction du navigateur pour éviter les erreurs
if (typeof browser === "undefined") { var browser = chrome; }

var summary = "";
var wordsToSeekList = storageInit(); 
var severityFactor = 1;
storageInitSeverityFactor();
console.log(severityFactor);

setTimeout(() => {
    for(var wordToSeek of wordsToSeekList){
        createWordToSeekItem(wordToSeek);
    }
}, 50);

//On envoie un message pour récuperer le résumé
browser.runtime.sendMessage({ action_: "getTerms" }, function(response) {
    if (response) {
        //En cas de réponse on stocke le résumé actuel
        summary = response.data;
        document.getElementById("summary").textContent = summary;
    }
});

// Envoyer une requête au script de fond pour obtenir la chaîne de caractères
browser.runtime.sendMessage({ action: "getPopupDLvl" }, function(response) {
    if (response) {
        //En cas de réponse du script, les différents chiffres étants tous séparés par un /, on sépare les données et on les stocks chacune séparemment
        let datas = response.data.split("/");
        let currentSiteDangerLevel = parseInt(datas[0]) + 1;
        let currentSiteDangerousRequestsCounter = parseInt(datas[1]);
        let currentSiteRequestsCounter = parseInt(datas[2]);
        let currentSiteAccessibleCookiesCounter = parseInt(datas[3]);

        //Traitement du compteur de requetes (avec l'affichage des couleurs et des dangereuses/totales)
        var currentSiteDangerousRequestsCounterE = document.getElementById("currentSiteDangerousRequestsCounter");
        var currentSiteRequestsCounterE = document.getElementById("currentSiteRequestsCounter");
        if(currentSiteRequestsCounter > 1){
            if(currentSiteRequestsCounter >= 10){
                currentSiteDangerLevel += 4;
            }
            currentSiteDangerousRequestsCounterE.innerHTML = currentSiteDangerousRequestsCounter.toString();
            if(currentSiteDangerousRequestsCounter >= 20){
                currentSiteDangerousRequestsCounterE.style.color = "#C61200";
            }else if(currentSiteDangerousRequestsCounter >= 15){
                currentSiteDangerousRequestsCounterE.style.color = "#FF0000";
            }else if(currentSiteDangerousRequestsCounter >= 10){
                currentSiteDangerousRequestsCounterE.style.color = "#FF7800";
            }else if(currentSiteDangerousRequestsCounter >= 5){
                currentSiteDangerousRequestsCounterE.style.color = "#00FF00"; 
            }else {
                currentSiteDangerousRequestsCounterE.style.color = "#009000";
            }

            currentSiteDangerousRequestsCounterE.style.color = 
            currentSiteRequestsCounterE.innerHTML = " /" + currentSiteRequestsCounter.toString() + " requêtes";
        }else {
            //Cas d'erreur de la récupération des données ou du nombre insuffisant pour fournir un chiffre
            currentSiteDangerousRequestsCounterE.innerHTML = "Recharchez la page !";
        }

        //Traitement du compteur de cookies (avec l'affichage des couleurs)
        var currentSiteAccessibleCookiesCounterE = document.getElementById("currentSiteAccessibleCookiesCounter");
        if(currentSiteAccessibleCookiesCounter >= 20){
            currentSiteAccessibleCookiesCounterE.style.color = "#C61200";
        }else if(currentSiteAccessibleCookiesCounter >= 15){
            currentSiteAccessibleCookiesCounterE.style.color = "#FF0000";
        }else if(currentSiteAccessibleCookiesCounter >= 10){
            currentSiteAccessibleCookiesCounterE.style.color = "#FF7800";
        }else if(currentSiteAccessibleCookiesCounter >= 5){
            currentSiteAccessibleCookiesCounterE.style.color = "#00FF00"; 
        }else {
            currentSiteAccessibleCookiesCounterE.style.color = "#009000"; 
        }
        currentSiteAccessibleCookiesCounterE.innerHTML = currentSiteAccessibleCookiesCounter.toString() + " cookies";

        //Traitement du danger du site actuel (avec l'affichage des couleurs)
        var currentSiteDangerLevelE = document.getElementById("currentSiteDangerLevel");
        if(currentSiteDangerLevel >= 50){
            currentSiteDangerLevelE.style.color = "#C61200"; 
        }else if(currentSiteDangerLevel >= 25){
            currentSiteDangerLevelE.style.color = "#FF0000"; 
        }else if(currentSiteDangerLevel >= 10){
            currentSiteDangerLevelE.style.color = "#FF7800"; 
        }else if(currentSiteDangerLevel >= 5){
            currentSiteDangerLevelE.style.color = "#00FF00"; 
        }else{
            currentSiteDangerLevelE.style.color = "#009000"; 
        }
        
        currentSiteDangerLevel = currentSiteDangerLevel * severityFactor;

        currentSiteDangerLevelE.innerHTML = currentSiteDangerLevel.toString() + " %";
    }
});

//Récuperer le bouton qui permet d'ajouter un mot dans la liste des mots à rechercher et ajouter l'élément lors du click
document.getElementById("addWordToSeek_ConfirmButton").addEventListener("click", function(event) {
    event.preventDefault();

    var inputField = document.getElementById("addWordToSeek_InputField");
    var newWord = inputField.value;

    if(newWord.trim() != "" && newWord.length > 2){ //Vérification du format du mot saisi
        addWordToSeekItem(newWord);
        inputField.value = "";
    }
});

function addWordToSeekItem(newWord) {
    addWordToSeek(newWord); //Fonction pour ajouter côte base de données
    createWordToSeekItem(newWord); //Fonction pour ajouter côte HTML
} 

function createWordToSeekItem(newWord) {
    const newWordDiv = document.createElement("div");
    newWordDiv.classList.add("addWordToSeek_ItemDiv");

    const newWordLi = document.createElement("li");
    newWordLi.classList.add("addWordToSeek_ItemLi");
    newWordLi.innerText = newWord;

    const newWordDelete = document.createElement("button");
    newWordDelete.classList.add("addWordToSeek_ItemDeleteBtn");
    newWordDelete.innerText = "Supprimer";
    newWordDelete.addEventListener("click", function(event) {
        deleteWordToSeek(event, newWord);
    });

    //Création de tout les éléments et de leur style et ajout de ceux là dans la liste du document 
    newWordDiv.appendChild(newWordLi);
    newWordDiv.appendChild(newWordDelete);

    document.getElementById("addWordToSeek_WordsList").appendChild(newWordDiv);
}

function deleteWordToSeek(event, newWord) {
    const item = event.target.parentElement;
    item.remove();
    deleteWordToSeekDB(newWord); //Fonction pour supprimer côte base de données
}

function addWordToSeek(newWord){
    if(typeof newWord == "string"){ //Vérification de type
        browser.storage.local.get("words_to_seek").then((item) => { //Récupération des éléments déjà stockés pour ajouter l'élément à ajouter à cette liste 
                var words_to_seekL = [];
                if(item.hasOwnProperty('words_to_seek')){
                    for(var word of Array.from(JSON.parse(item.words_to_seek.value))){
                        words_to_seekL.push(word);
                    }
                }   
                words_to_seekL.push(newWord);
                var words_to_seek = {value: JSON.stringify(words_to_seekL)}; 
                browser.storage.local.set({words_to_seek}); //Ajout de l'élément et mise à jour de la valeur dans la base de données
        }); 
    }else{
        console.error("Veuillez saisir un mot à rechercher valide.");
    }
}

function deleteWordToSeekDB(newWord){
    if(typeof newWord == "string"){ //Vérification de type
        browser.storage.local.get("words_to_seek").then((item) => { //Récupération des éléments déjà stockés pour supprimer l'élément à supprimer de cette liste 
                var words_to_seekL = [];
                if(item.hasOwnProperty('words_to_seek')){
                    for(var word of Array.from(JSON.parse(item.words_to_seek.value))){
                        words_to_seekL.push(word);
                    }
                }   
                words_to_seekL.splice(words_to_seekL.indexOf(newWord), 1);
                var words_to_seek = {value: JSON.stringify(words_to_seekL)};
                browser.storage.local.set({words_to_seek}); //Suppression de l'élément et mise à jour de la valeur dans la base de données
        }); 
    }else{
        console.error("Veuillez saisir un mot à supprimer présent dans la DB.");
    }
}

//Remplir la base de données avec les valeurs de base
function fillEmptyDB(words_to_seekL) {
    var words_to_seek = {value: JSON.stringify(words_to_seekL)};
    browser.storage.local.set({words_to_seek});
}

//Initialiser le stockage en remplissant la variable déclarée au début du script.
function storageInit(){
    var words_to_seekL = [];
    browser.storage.local.get("words_to_seek").then((item) => {
        if(!item.hasOwnProperty("words_to_seek") || item.words_to_seek.value.length < 3) { 
            browser.storage.local.remove('words_to_seek');
            words_to_seekL = ["cookie", "accept", "connect"];
            fillEmptyDB(words_to_seekL);
            
        }else {
            for(var word of Array.from(JSON.parse(item.words_to_seek.value))) { //Sinon on en récupère simplement les éléments
                words_to_seekL.push(word);
            }
        }
    });
    return words_to_seekL;
}

//Fonction pour changer le facteur de sévèrité
function setNewSeverityFactor(severity_factor_){
    var severity_factor = {value: severity_factor_.toString()};
    browser.storage.local.set({severity_factor});
}

//Initialiser le stockage en remplissant la variable facteur de sévèrité déclarée au début du script.
function storageInitSeverityFactor(){
    browser.storage.local.get("severity_factor").then((item) => {
        if(!item.hasOwnProperty("severity_factor")) { //Si la base est vide on la remplit avec la valeur de base 
            browser.storage.local.remove('severity_factor');
            setNewSeverityFactor(1);
        }else { //Sinon on en récupère simplement les éléments
            severityFactor = parseInt(item.severity_factor.value);
        }
    });
}
