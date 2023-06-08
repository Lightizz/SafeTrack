//Vérification d'utilisation de la bonne bibliothèque en fonction du navigateur pour éviter les erreurs
if (typeof browser === "undefined") { var browser = chrome; }

var severityFactor_ = 1;
storageInitSeverityFactor();

document.getElementById("plusButton").addEventListener("click", function(event) { //Récupération de l'élément "+" et changement de la valeur lors du click 
    severityFactor_ += 1;
    setNewSeverityFactor(severityFactor_);
    document.getElementById("severityFactor").textContent = severityFactor_;
});

document.getElementById("lessButton").addEventListener("click", function(event) { //Récupération de l'élément "-" et changement de la valeur lors du click 
    severityFactor_ -= 1;
    setNewSeverityFactor(severityFactor_);
    document.getElementById("severityFactor").textContent = severityFactor_;
});

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
            severityFactor_ = parseInt(item.severity_factor.value);
        }
        document.getElementById("severityFactor").textContent = severityFactor_;
    });
}