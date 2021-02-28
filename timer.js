
const request = require('request');
var { Timer } = require('easytimer.js');
var howler = require('howler');

var DEBUG = require('electron').remote.process.argv.slice(-1)[0] == "debug" || false;

var timer = new Timer();
var bleep_sound = new howler.Howl({
    src: ['bleep.mp3'],
    loop: true
});

var startColorArray = rgbToColorArray("rgb(49, 28, 19)");
var endColorArray = rgbToColorArray("rgb(246, 111, 111)");
var secondsCounter = null;

function startButtonClick() {
    disableClockSelectors();
    let curMinValue = document.getElementById("m").value || 0;
    let curSecValue = document.getElementById("s").value || 0;
    addToDebug("start clock with timeValues:" + curMinValue + ":" + curSecValue);
    timer.addEventListener('targetAchieved', function (e) {
        var messageSpan = document.getElementById("messageSpan");
        messageSpan.innerHTML = "Time's up";
        var messageDiv = document.getElementById("messages");
        messageDiv.classList.remove("hide");
    });

    timer.addEventListener('secondsUpdated', function (e) {       
        bleep_sound.play();
        let currentSecondCounter = e.detail.timer.getTotalTimeValues().seconds;
        let elapsedSeconds = secondsCounter - currentSecondCounter || 1;
        let factor = elapsedSeconds / secondsCounter;
        let color = lerpc(startColorArray, endColorArray, factor);
        addToDebug("elpasedSeconds:" + elapsedSeconds + "/ factor:" + factor + "/color:" + color + "/colors:" + colorArrayToRgb(color));
        var timerBox = document.getElementById("timerBox");
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
    var m = document.getElementById("m");
    var s = document.getElementById("s");
    var m2 = document.getElementById("m2").value || 0;
    var m1 = document.getElementById("m1").value || 0 ;
    var s2 = document.getElementById("s2").value || 0;
    var s1 = document.getElementById("s1").value || 0;
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
            addToDebug("Resume timer at current timeValues:" + timerValuemmss());
        } else {
            timer.pause();
            addToDebug("pause timer at current timeValues:" + timerValuemmss());
        }
    }
}


function standupButtonClick() {
    var minInput = document.getElementById("m");
    var secInput = document.getElementById("s");
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
    var minuteInput = document.getElementById("m");
    minuteInput.value = minuteInput.getAttribute("placeholder");
    var secInput = document.getElementById("s");
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
    var elem = document.getElementById(inputId);
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
        var quoteContent = document.getElementById("quoteContent");
        quoteContent.innerHTML = q_html + "<br/> ( Source:https://theysaidso.com ) <br />";
        quoteContent.classList.remove("hide");

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
}

document.getElementById("start").addEventListener("click", startButtonClick);
document.getElementById("pause").addEventListener("click", pauseButtonClick);
document.getElementById("stop").addEventListener("click", stopButtonClick);
document.getElementById("reset").addEventListener("click", resetButtonClick);
document.getElementById("standup").addEventListener("click", standupButtonClick);
document.getElementById("inspo").addEventListener("click", inspoButtonClick);
document.getElementById("rangeCalc").addEventListener("click", rangeCalcButtonClick);
document.getElementById("muteSoundCheckBox").addEventListener("click", muteSoundClick);