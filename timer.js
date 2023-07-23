
const { ipcRenderer, contextBridge } = require('electron');
const request = require('request');
const i18next = require('i18next');
const HttpApi = require('i18next-http-backend');
// const electronRemote = require('electron').remote;
// const processArgv = electronRemote.process.argv;
const processArgv = process.argv;
var { Timer } = require('easytimer.js');
var howler = require('howler');

console.log("the-argv:" + processArgv);
var DEBUG = false;//process.argv[process.argv.length - 1] == "debug" || false;
var lang = getLang(processArgv);

console.log("debug:" + DEBUG)

function getLang(processArgv) {
    console.log("hi:", processArgv);
    let lastArgv = processArgv[processArgv.length - 1];
    // npm start | npm start debug
    if (processArgv.length == 2 || (processArgv.length == 3 && lastArgv == "debug")){
        return 'en';
    }
    // npm start vi
    if (processArgv.length == 3 && lastArgv != "debug") {
        return lastArgv;
    }
    // npm start vi debug
    return processArgv[processArgv.length - 2];
}


let transElemIds = [
    "title",
    "about-section",
    "minLabel",
    "secLabel",
    "start",
    "pause",
    "stop",
    "reset",
    "standup",
    "minRange1Label",
    "secRange1Label",
    "minRange2Label",
    "secRange2Label",
    "rangeCalc",
    "inspo",
    "muteSoundCheckBoxLabel"
];

var timer = new Timer();
var bleep_sound = new howler.Howl({
    src: ['bleep.mp3'],
    loop: true
});

var startColorArray = rgbToColorArray("rgb(49, 28, 19)");
var endColorArray = rgbToColorArray("rgb(246, 111, 111)");
var secondsCounter = null;

var domStore = {
    "start"             : document.getElementById("start"),
    "pause"             : document.getElementById("pause"),
    "stop"              : document.getElementById("stop"),
    "reset"             : document.getElementById("reset"),
    "standup"           : document.getElementById("standup"),
    "inspo"             : document.getElementById("inspo"),
    "rangeCalc"         : document.getElementById("rangeCalc"),
    "muteSoundCheckBox" : document.getElementById("muteSoundCheckBox"),
    "m"                 : document.getElementById("m"),
    "s"                 : document.getElementById("s"),    
    "m2"                : document.getElementById("m2"),
    "m1"                : document.getElementById("m1"),
    "s2"                : document.getElementById("s2"),
    "s1"                : document.getElementById("s1"),
    "messageSpan"       : document.getElementById("messageSpan"),
    "messages"          : document.getElementById("messages"),
    "timerBox"          : document.getElementById("timerBox")
}


function startButtonClick() {
    disableClockSelectors();
    let curMinValue = domStore["m"].value || 0;
    let curSecValue = domStore["s"].value || 0;
    addToDebug("start clock with timeValues:" + curMinValue + ":" + curSecValue);
    timer.addEventListener('targetAchieved', function (e) {
        var messageSpan = domStore["messageSpan"];
        messageSpan.innerHTML = "Time's up";
        var messageDiv = domStore["messages"];
        messageDiv.classList.remove("hide");
    });

    timer.addEventListener('secondsUpdated', function (e) {
        bleep_sound.play();
        let currentSecondCounter = e.detail.timer.getTotalTimeValues().seconds;
        let elapsedSeconds = secondsCounter - currentSecondCounter || 1;
        let factor = elapsedSeconds / secondsCounter;
        let color = lerpc(startColorArray, endColorArray, factor);
        addToDebug("elpasedSeconds:" + elapsedSeconds + "/ factor:" + factor + "/color:" + color + "/colors:" + colorArrayToRgb(color));
        var timerBox = domStore["timerBox"];
        timerBox.innerHTML = timerValuemmss();
        timerBox.style.color = colorArrayToRgb(color);
    });

    timer.addEventListener('started', function(e) {
        if (secondsCounter == null) {
            secondsCounter =  e.detail.timer.getTotalTimeValues().seconds;
        }
    });

    timer.start({countdown: true, startValues: {
        minutes: parseInt(curMinValue, 10),
        seconds: parseInt(curSecValue, 10)
    }});
}

function rangeCalcButtonClick() {
    var m = domStore["m"];
    var s = domStore["s"];
    var m2 = domStore["m2"].value || 0;
    var m1 = domStore["m1"].value || 0 ;
    var s2 = domStore["s2"].value || 0;
    var s1 = domStore["s1"].value || 0;
    // TODO: validation
    var minutesDiff = Math.abs(parseInt(m2, 10) - parseInt(m1, 10));
    var secondsDiff = Math.abs(parseInt(s2, 10) - parseInt(s1, 10));
    addToDebug("(m1:s1) => " + m1 + ":" + s1);
    addToDebug("(m2:s2) => " + m2 + ":" + s2);
    addToDebug("minutes diff:" + minutesDiff);
    addToDebug("seconds diff:" + secondsDiff);
    m.value = minutesDiff;
    s.value = secondsDiff;
}

function timerValuemmss() {
    var minutes = prependZeroOnSingleDigit(timer.getTimeValues().minutes);
    var seconds = prependZeroOnSingleDigit(timer.getTimeValues().seconds);
    addToDebug(minutes + ":" + seconds);
    return minutes + ":" + seconds;
}

function prependZeroOnSingleDigit(value) {
    return value < 10 ? "0" + value : value;
}

function stopButtonClick() {
    enableClockSelectors();
    timer.stop();
    bleep_sound.stop();
    secondsCounter = null;
    addToDebug("Stopping timer at current timeValues:" + timerValuemmss());
}

function resetButtonClick() {
    enableClockSelectors();
    timer.reset();
    secondsCounter == null;
    addToDebug("Reset timer to timeValues:" + timerValuemmss());
}

function pauseButtonClick() {
    if (timer) {
        if (!timer.isRunning()) {
            timer.start();
            bleep_sound.play();                  
            addToDebug("Resume timer at current timeValues:" + timerValuemmss());
        } else {
            timer.pause();
            bleep_sound.pause();
            addToDebug("pause timer at current timeValues:" + timerValuemmss());
        }
    }
}


function standupButtonClick() {
    var minInput = domStore["m"];
    var secInput = domStore["s"];
    minInput.value = 3;
    secInput.value = 0;
    let curMinValue = minInput.value || 0;
    let curSecValue = secInput.value || 0;
    addToDebug("Standup timeValues:" + curMinValue + ":" + curSecValue);
}


function disableClockSelectors() {
    disableElem("m");
    disableElem("s");
    disableElem("start");
    disableElem("rangeCalc")
}

function enableClockSelectors() {
    enableElem("m");
    enableElem("s");
    enableElem("start");
    enableElem("rangeCalc");
}

function resetClockSelectors() {
    var minuteInput = domStore["m"];
    minuteInput.value = minuteInput.getAttribute("placeholder");
    var secInput = domStore["s"];
    secInput.value = secInput.getAttribute("placeholder");
}

function disableElem(inputId, disableState = true) {
    findElemByIdAndInvoke(inputId, function(elem){
        addToDebug(inputId + "to be:" + disableState);
        elem.disabled = disableState;
    });

}

function enableElem(inputId) {
    disableElem(inputId, false);
}

function findElemByIdAndInvoke(inputId, onElem) {
    console.log("the domstore:" + inputId + ":" + domStore[inputId]);
    var elem = domStore[inputId] || document.getElementById(inputId);
    if (elem) {
        onElem(elem);
    }
}


function inspoButtonClick() {
    request('https://quotes.rest/qod?category=inspire', { json: true }, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        console.log(body);
        var q_html = ""
        var quotes = body.contents.quotes;
        quotes.forEach(element => {
            console.log("elem:" + element);
            q_html += element.quote + "-" + element.author;
        });
        findElemByIdAndInvoke("quoteContent", function(quoteContent){
            quoteContent.innerHTML = q_html + "<br/> ( Source:https://theysaidso.com ) <br />";
            quoteContent.classList.remove("hide");
        });        
    });
}

function muteSoundClick(e) {
    shouldMute = e.currentTarget.checked;
    addToDebug("muteSoundStatus:" + shouldMute);
    bleep_sound.mute(shouldMute);
}

function addToDebug(msg) {
    findElemByIdAndInvoke("debugConsole", function(elem) {
        elem.value += msg + "\n";
    });
}


// rgb(0,0,0)
function rgbToColorArray(rgb) {
    return rgb.split("(")[1].split(")")[0].split(",").map(Number);
}

function colorArrayToRgb(c) {
    return "rgb(" + c.join(",") + ")";
}

// c1, c2 array converted from rgbToColorArray
function lerpc(c1, c2, t) {
    var lerpedColor = []
    for(var i = 0; i < 3; i++) {
        lerpedColor.push(Math.round(lerp(c1[i], c2[i], t)));
    }
    return lerpedColor;
}

function lerp(start, end, t) {
    return (1-t)*start + t*end;
}

function onDebug() {
    var consoleDiv = document.createElement('div');
    consoleDiv.innerHTML = "<textarea disabled id=\"debugConsole\"></textarea>";
    document.body.appendChild(consoleDiv);
}

if (DEBUG){
    onDebug();
    addToDebug("argv:" + processArgv.length + "=>[" + processArgv + "]");
    addToDebug("argv.slec(-1):" + processArgv.slice(-1));
    addToDebug("last[-1]:" + processArgv[-1]);
    addToDebug("last:" + processArgv[processArgv.length - 1]);
    addToDebug("Picking lang:" + lang);
}

domStore["start"].addEventListener("click", startButtonClick);
domStore["pause"].addEventListener("click", pauseButtonClick);
domStore["stop"].addEventListener("click", stopButtonClick);
domStore["reset"].addEventListener("click", resetButtonClick);
domStore["standup"].addEventListener("click", standupButtonClick);
domStore["inspo"].addEventListener("click", inspoButtonClick);
domStore["rangeCalc"].addEventListener("click", rangeCalcButtonClick);
domStore["muteSoundCheckBox"].addEventListener("click", muteSoundClick);


// https://github.com/i18next/i18next-http-backend
i18next.use(HttpApi).init({
    debug: DEBUG,
    lng: lang,
    fallbackLng: 'en',
    backend: {
        loadPath:  './locales/{{lng}}/{{ns}}.json'
    }
}, function(err, t) {
    if (DEBUG && err) {
        console.log("Got err:" + err);
    }
    transElemIds.forEach(function(elemId){
        findElemByIdAndInvoke(elemId, function(elem) {
            let translationKey = elem.dataset.i18n || elemId;
            elem.innerHTML = i18next.t(translationKey)        ;   
        })
    });

    // send message for main process to show the windows
    // https://www.electronjs.org/docs/api/ipc-main
    ipcRenderer.send("finished-rendering", "finished-rendering");
    if (DEBUG) {
        console.log("sent finished rendering messages");
    }
});
