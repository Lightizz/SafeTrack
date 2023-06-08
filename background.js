//Vérification d'utilisation de la bonne bibliothèque en fonction du navigateur pour éviter les erreurs
if (typeof browser === "undefined") { var browser = chrome; }

var currentSiteDangerLevel = -1;
var currentSiteDangerousRequestsCounter = 0;
var currentSiteRequestsCounter = 0;
var currentSiteAccessibleCookiesCounter = 0;

// Écouter les messages provenant de la popup
browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "getPopupDLvl") {
        // Envoyer une réponse contenant la chaîne de caractères au script de la popup
        sendResponse({ data: currentSiteDangerLevel.toString() 
        + "/" + currentSiteDangerousRequestsCounter.toString()
        + "/" + currentSiteRequestsCounter.toString()
        + "/" + currentSiteAccessibleCookiesCounter.toString() });
    }
});

// Événement pour détecter le démarrage de l'extension
browser.runtime.onStartup.addListener(onStart);
// Événement pour détecter le rechargement de l'extension
browser.runtime.onInstalled.addListener(onStart);

// Événement pour détecter la/le création/changement d'un onglet
browser.tabs.onActivated.addListener(handleTabSwtiching);
browser.tabs.onUpdated.addListener(handleTabRefreshing);
browser.tabs.onCreated.addListener(handleTabCreation);

//Fonction servant à remttre à zéro les listener du script pour les performances et pour qu'ils écoutent la page acutelle
function onStart() {
    //Si il y a un listener, on le retire et on en met un neuf 
    if(browser.webRequest.onBeforeRequest.hasListener(interceptSortante)) {
        browser.webRequest.onBeforeRequest.removeListener(interceptSortante);
    }
    if(browser.webRequest.onBeforeSendHeaders.hasListener(interceptEntrante)) {
        browser.webRequest.onBeforeSendHeaders.removeListener(interceptEntrante);
    }

    currentSiteAccessibleCookiesCounter = 0;
    currentSiteDangerousRequestsCounter = 0;
    currentSiteRequestsCounter = 0;

    //On récupère les cookies et la page actuelle pour regarder si elle est sécurisée
    browser.tabs.query({ active: true, lastFocusedWindow: true }).then(checkTabs);
    browser.cookies.getAll({}).then(checkCookies);

    // Ajout des listeners pour les requêtes sortantes et entrantes
    browser.webRequest.onBeforeRequest.addListener(
        interceptSortante,
        {urls: ["<all_urls>"]}
    ); 
    browser.webRequest.onBeforeSendHeaders.addListener(
        interceptEntrante,
        {urls: ["<all_urls>"]}
    );
}

// Fonction pour gérer le changement d'un onglet
function handleTabRefreshing(tab) {
    browser.tabs.query({}).then(function(tabs){
    //On récupèer tout les onglets et pour tout ceux là on regarde si celui rechargé est est le même que celui en chargement
    for(var tab_ of tabs){
        if(tab_.id == tab && tab_.status == "loading") {
            //Remise à zéro du compteur de dangers pour le filtre
            currentSiteDangerLevel = -1;
            onStart();
            //console.log("Onglet refresh :", tab_.title, tab);
        }
    }
  });
}

// Fonction pour gérer le changement d'un onglet
function handleTabSwtiching(tab) {
    //Remise à zéro du compteur de dangers pour le filtre
    currentSiteDangerLevel = -1;
    onStart();
    //console.log("Onglet swaped :", tab);
}

// Fonction pour gérer la création d'un onglet
function handleTabCreation(tab) {
    //Vérification si la page créée est bien la page qui a été affichée par la suite
    if(tab.active == "true") {
        //Remise à zéro du compteur de dangers pour le filtre
        currentSiteDangerLevel = -1;
        //console.log("Onglet created :", tab);
    }
    onStart();
}

function checkTabs(tabs) {
    var currentTab = tabs[0];
    //Vérification du bon format et de la sécurité du lien de la page actuelle (+ 10 au compteur car cela a un poids plus important)
    if (!currentTab.url.toLowerCase().startsWith("https") && !currentTab.url.toLowerCase().startsWith("chrome://")) {
        //console.log("Attention, ce site n'est pas sécurisé !");
        currentSiteDangerLevel += 10;
    }
}

function checkCookies(cookies) {
    //Si on a réussi a en récupérer, ils sont forcéments non sécurisés à cause du blockage du navigateur 
    if(cookies.length >= 1) {
        currentSiteDangerLevel += 20; 
        currentSiteAccessibleCookiesCounter += cookies.length; //Compter les cookies pour l'envoyer à la popup
    } 
}

// Fonction pour intercepter les requêtes sortantes
function interceptSortante(details) {
    let url = details.url.toLowerCase(); 
    console.log("Requête sortante interceptée :", url);
    
    if(filterDangerousRequest(url)){ //On s'assure du bon format et on applique le filtre
        currentSiteDangerLevel += 1;
        currentSiteDangerousRequestsCounter += 1; //Puis on met à jour les compteurs 
    }
    return { cancel: false };
}

// Fonction pour intercepter les requêtes entrantes
function interceptEntrante(details) {
    let url = details.url.toLowerCase();
    console.log("Requête entrante interceptée :", url);

    if(filterDangerousRequest(url)){ //On s'assure du bon format et on applique le filtre
        currentSiteDangerLevel += 1;
        currentSiteDangerousRequestsCounter += 1; //Puis on met à jour les compteurs 
    }
    return { cancel: false };
}

function filterDangerousRequest(url) {
    //On vérifie que la requête ne provient pas de l'extension pour ne pas faire monter le compteur pour une requête non valide
    if(url != "chrome-extension://" + browser.runtime.id + "/popup.html" 
    && url != "chrome-extension://" + browser.runtime.id + "/popup.js") {
        currentSiteRequestsCounter += 1;
        //Puis on vérifie que le fichier demandé par la requête est suceptible (par exemple, la récupération d'une image ou d'une police de caractère ne nous intéresse pas)
        if(url.indexOf(".html") >= 0 || url.indexOf(".htm") >= 0
        || url.indexOf(".php") >= 0 || url.indexOf(".js") >= 0) {
            return true;
        }
    }
    return false;
}

/*
let dangerousRequestWords = ["stat", "analy", "clic", "pref", "cookie", "track"];

function hasDangerousWords(requestURL) {
    //Simple méthode en passant en revue tout les mots de la liste des mots dangereux pour savoir si l'URL d'une requête contient un mot dangereux
    for(let word of dangerousRequestWords){
        if(requestURL.indexOf(word) >= 1){
            return true;
        }
    }
    return false;
}
*/