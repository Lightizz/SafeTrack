//Vérification d'utilisation de la bonne bibliothèque en fonction du navigateur pour éviter les erreurs
if (typeof browser === "undefined") { var browser = chrome; }

//Récupération de tout les élements dans le body de la page
var nodeListElements = document.querySelectorAll('body *'); 

//Conversion d'une "NodeListOf<Element>" à une "ListOf<Element>" pour manipuler la classe Element sans erreurs
var elements = []; for(var e of nodeListElements) {elements.push(e);}

//Initialiser la base de donnée et en stocker la liste
let wordsToSeekList = storageInit(); 

//browser.storage.local.clear();

//Listes des éléments qui serviront aux filtres des éléments de la page 
let textTagNames = ["p", "label", "span", "cite", "li", "i"];
let btnTagNames = ["button", "a", "input"];
let cguWords = ["terms", "condition", "privacy", "donnée", "politique"];
let cguAnalysisWords = ["privacy", "cookie", "user", "consent"];

var suspiciousElements = [];

//Attendre que la page soit totalement chargée pour analyser toute la page correctement
document.addEventListener('readystatechange', event => {
    if (event.target.readyState === "complete") {
        //Un setTimeout pour ne manquer aucun élement lors de la recherche dans la page.
        setTimeout(() => {
            //Créer la popup de danger lors du clique et l'ajoute dans la page
            addButtonPopup();

            //Recherche de tout les éléments
            for(var element of elements){
                // Si l'élement est un bouton
                if(element.tagName.toLowerCase() in btnTagNames){
                    //Si le bouton rentre dans le filtre des elements CGU/CGV
                    if(isSoughtCGU(element)){
                        for(var attribute of element.attributes){
                            //Pour chaque attributs de l'élément actuel, on regarde si c'est l'attribut du lien de redirection
                            if(attribute.name == "href"){
                                var xhttp = new XMLHttpRequest();
                                xhttp.onreadystatechange = function() {
                                    //Quand le status de la requête change et qu'il est "OK", on lance la fonction d'analyse de la page
                                    if (this.readyState == 4 && this.status == 200) {
                                        runTermsAnalysis(this.responseText);
                                    }
                                };
                                xhttp.open("GET", attribute.nodeValue, true);
                                xhttp.send();
                            }
                        }
                    //Si le bouton rentre dans le filtre des elements de dangers directs
                    }else if(isSought(element)){ 
                        //Ajout de l'élement dans une liste pour les traiter plus tard
                        suspiciousElements.push(element);
                    }
                }
            }

            //Pour tout les éléments jugés comme suspect
            for(var element of suspiciousElements){
                var popupButton = document.getElementById("cookiesReaderButtonPopup");
                //Animation d'entrée du curseur sur le bouton (set de la pos. pour un affichage correct et style/transition)
                element.addEventListener('mouseenter', (event) => {
                    //Position x de la popup
                    if(event.pageX >= ((window.innerWidth/3)*2)){
                        //Tier de gauche
                        popupButton.style.left = (event.pageX - 170).toString() + "px";
                    }else {
                        //Tiers de droite et centre
                        popupButton.style.left = (event.pageX + 20).toString() + "px";
                    }
                    //Position y de la popup
                    if(event.screenY >= (window.innerHeight/2)){
                        //En dessous de la moitié
                        popupButton.style.top = (event.screenY - 215).toString() + "px";
                    }else{
                        //Au dessus de la moitié
                        popupButton.style.top = (event.screenY - 85).toString() + "px";
                    }

                    popupButton.style.transition = "visibility 0.25s, opacity 0.25s";
                    popupButton.style.visibility = "visible";
                    popupButton.style.opacity = "1";
                });
                //Animation de sortie du curseur sur le bouton (style/transition)
                element.addEventListener('mouseleave', (event) => {
                    popupButton.style.transition = "visibility 1s, opacity 1s";
                    popupButton.style.visibility = "hidden";
                    popupButton.style.opacity = "0";
                });
            }
        }, 250);
    }
});

function isSought(element){
    var result = false;
    //Recherche de l'élement dans la liste des élements à rechercher -> (user input)
    for(var word of wordsToSeekList){
        //Pour tout les éléments de la liste des mots dangereux à rechercher, est-ce que l'élément contient un des ces mots
        if(element.innerHTML.toString().toLowerCase().indexOf(word) >= 0){
            result = true;
        }else if(element.innerText.toLowerCase().indexOf(word) >= 0){
            result = true;
        }
    }
    return result;
}

function isSoughtCGU(element){
    var result = false;
    for(var word of cguWords){
        //Pour tout les mots de la liste des mots à rechercher pour les CGU/CGV, est-ce que l'élément contient un des ces mots
        if(element.innerHTML.toString().toLowerCase().indexOf(word) >= 0){
            result = true;
        }else if(element.innerText.toLowerCase().indexOf(word) >= 0){
            result = true;
        }
    }
    return result;
}

function isCGUAnalysisWord(element) {
    var result = false;
    //L'élement contient-il un mot à rechercher dans l'analyse des CGU/CGV ? 
    for(var word of cguAnalysisWords){
        if(element.innerHTML.toString().toLowerCase().indexOf(word) >= 0){
            result = true;
        }else if(element.innerText.toLowerCase().indexOf(word) >= 0){
            result = true;
        }
    }
    //Ou contient-il un mot à rechercher de la liste des mots dangereux sélectionnés ?
    for(var word of wordsToSeekList){
        if(element.innerHTML.toString().toLowerCase().indexOf(word) >= 0){
            result = true;
        }else if(element.innerText.toLowerCase().indexOf(word) >= 0){
            result = true;
        }
    }
    return result;
}

//Remplir avec les valeurs par défauts la base de données des mots dangereux sélectionnés
function fillEmptyDB(words_to_seekL){
    var words_to_seek = {value: JSON.stringify(words_to_seekL)};
    browser.storage.local.set({words_to_seek});
}

function storageInit(){
    var words_to_seekL = [];
    //Récupérer les éléments actuellements stockés
    browser.storage.local.get("words_to_seek").then((item) => {
        //Si la liste est vide ou ne contient pas les éléments requis
        if(!item.hasOwnProperty("words_to_seek") || item.words_to_seek.value.length < 3) { 
            browser.storage.local.remove('words_to_seek');
            words_to_seekL = ["cookie", "accept", "connect"];
            fillEmptyDB(words_to_seekL);
            
        }else {
            //Sinon on récupère les éléments on les stocks et les retournes
            for(var word of Array.from(JSON.parse(item.words_to_seek.value))) {
                words_to_seekL.push(word);
            }
        }
    });
    return words_to_seekL;
}

function addButtonPopup(){
    //Définir tout le style du bouton
    var buttonPopup = document.createElement("div");
    buttonPopup.id = "cookiesReaderButtonPopup";
    buttonPopup.style.backgroundColor = "#EBEBEB"; //gris clair
    buttonPopup.style.borderRadius = "15px";
    buttonPopup.style.width = "200px";
    buttonPopup.style.height = "100px";
    buttonPopup.style.visibility = "hidden";
    buttonPopup.style.position = "fixed";
    buttonPopup.style.boxShadow = "0px 0px 10px #000000"; //noir
    buttonPopup.style.zIndex = "999"; //Mettre le bouton au dessus de tout les éléments de la page
    buttonPopup.style.textAlign = "center";
    buttonPopup.style.verticalAlign = "middle";
    buttonPopup.style.left = "0px";
    buttonPopup.style.top = "0px";

    //Définir le texte et les ajouter à la page
    var textButtonPopup = document.createElement('p');
    textButtonPopup.innerText = "Attention danger(s) potentiel. Renseignez-vous sur ce bouton."
    buttonPopup.appendChild(textButtonPopup);
    document.body.appendChild(buttonPopup);
}

function runTermsAnalysis(pageCode) {
    //Conversion de la chaine de caractère contenant le code de la page CGU/CGV en document HTML exploitable ici
    const parser = new DOMParser();
    const termsDocument = parser.parseFromString(pageCode, 'text/html');

    //Récupération de tout les élements dans le body de la page
    var termsNodeListElements = termsDocument.querySelectorAll('body *'); 

    //Conversion d'une "NodeListOf<Element>" à une "ListOf<Element>" pour manipuler la classe Element sans erreurs
    var termsElements = []; for(var e of termsNodeListElements) {termsElements.push(e);}

    var allSummarys = "";

    //On fait des petits résumés par éléments textuels
    for(var element of termsElements){
        for(let tagName of textTagNames){
            if(element.tagName.toLowerCase() == tagName && isCGUAnalysisWord(element) && element.innerText != "") {
                allSummarys = allSummarys + generateSummary(element.innerText, 30).trim() + " ";
            }
        }
    }

    //Après les avoir mis bout à bout, on fait un résumé global.
    finalSummary = generateSummary(allSummarys, 2000).trim();
    console.log(finalSummary);

    //Envoie au script popup.js du résumé 
    browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action_ === "getTerms") {
            console.log("a");
            sendResponse({ data: finalSummary});
        }
    });
}

function generateSummary(text, maxLength) {
    // Découper le texte en phrases
    const sentences = text.split('. ');
  
    // Calculer le score de chaque phrase (nombre de mots et si la phrase contient des mots importants et recherchés pour faire monter plus vite son score)
    const scores = sentences.map(sentence => {
        const words = sentence.split(' ');
        var importantWords = 0;
        for(var word of words){
            if(word in cguWords || word in cguAnalysisWords){
                importantWords += 1;
            }
        }
        return words.length + (importantWords * 100);
    });
  
    // Trouver l'indice de la phrase ayant le score le plus élevé
    let maxScoreIndex = 0;
    for(let i = 1; i < scores.length; i++) {
        if(scores[i] > scores[maxScoreIndex]) {
            maxScoreIndex = i;
        }  
    }
  
    // Construire le résumé en concaténant les phrases à partir de l'indice maxScoreIndex
    let summary = sentences[maxScoreIndex] + '.';
    let summaryLength = summary.length;
  
    // Ajouter des phrases jusqu'à atteindre la longueur maximale spécifiée
    let i = maxScoreIndex + 1;
    while (summaryLength < maxLength && i < sentences.length) {
        summary += ' ' + sentences[i] + '.';
        summaryLength += sentences[i].length + 2; // +2 pour le point et l'espace
        i++;
    }
  
    return summary;
}