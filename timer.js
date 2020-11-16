
const request = require('request');
var { Timer } = require('easytimer.js');

var timer = new Timer();

function startButtonClick() {
    disableClockSelectors();
    let curMinValue = document.getElementById("m").value || 0;
    let curSecValue = document.getElementById("s").value || 0;
    addToDebug("start clock with timeValues:" + curMinValue + ":" + curSecValue);
    timer = new Timer();
    timer.addEventListener('targetAchieved', function (e) {
        var messageSpan = document.getElementById("messageSpan");
        messageSpan.innerHTML = "Time's up";
        var messageDiv = document.getElementById("messages");
        messageDiv.classList.remove("hide");        
    });

    timer.addEventListener('secondsUpdated', function (e) {
        document.getElementById("timerBox").innerHTML = timerValuemmss();    
    });

    timer.start({countdown: true, startValues: {
        minutes: parseInt(curMinValue, 10),
        seconds: parseInt(curSecValue, 10)
    }});

}

function timerValuemmss() {
    return timer.getTimeValues().minutes + ":" + timer.getTimeValues().seconds;
}

function stopButtonClick() {
    enableClockSelectors();
    timer.stop();
    addToDebug("Stopping timer at current timeValues:" + timerValuemmss());
}

function resetButtonClick() {
    enableClockSelectors();
    timer.reset();
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
    disableInput("m");
    disableInput("s");
}

function enableClockSelectors() {
    enableInput("m");
    enableInput("s");
}

function resetClockSelectors() {
    var minuteInput = document.getElementById("m");
    minuteInput.value = minuteInput.getAttribute("placeholder");
    var secInput = document.getElementById("s");
    secInput.value = secInput.getAttribute("placeholder");
}

function disableInput(inputId, disableState = true) {
    var inputElem = document.getElementById(inputId);
    inputElem.disabled = disableState;
}

function enableInput(inputId) {
    disableInput(inputId, false);
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

function addToDebug(msg) {
    var textArea = document.getElementById("debugConsole");
    textArea.value += msg + "\n";
}

document.getElementById("start").addEventListener("click", startButtonClick);
document.getElementById("pause").addEventListener("click", pauseButtonClick);
document.getElementById("stop").addEventListener("click", stopButtonClick);
document.getElementById("reset").addEventListener("click", resetButtonClick);
document.getElementById("standup").addEventListener("click", standupButtonClick);
document.getElementById("inspo").addEventListener("click", inspoButtonClick);
