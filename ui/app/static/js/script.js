document.addEventListener("DOMContentLoaded", () => {
    const translationIndicator = document.getElementById("translation-indicator");
    const overlayImage = document.getElementById('overlayImage');
    const videoElement = document.getElementById("videoElement");
    const translatedDiv = document.getElementById("translated-op");
    const languageSelect = document.getElementById('language');

    let isNewLineTriggered = false; 
    let isModelRunning = false; 
    let gestureInterval; 
    let gestureString = '';
    let lastGestures = [];

    setIndicatorState(false);

    

    async function runModel() {
        overlayImage.style.display = "none";
        videoElement.style.display = "block";

         try {
            setIndicatorState(true);
            isModelRunning = true;
            const videoFeedUrl = '/video_feed';
            videoElement.src = videoFeedUrl;
            startFetchingGestures();
        } catch (error) {
            console.error('Error starting video feed:', error);
            setIndicatorState(false);
            alert("Failed to start the video feed.");
        }
    }

    
    function setIndicatorState(isTranslating) {
        translationIndicator.style.backgroundColor = isTranslating ? 'green' : 'red';
        translationIndicator.style.color = 'white';
        translationIndicator.textContent = isTranslating ? 'Translating...' : 'Waiting for model to translate...';
        translationIndicator.style.display = 'block';
    }

    function startFetchingGestures() {
        if (gestureInterval) clearInterval(gestureInterval);
        gestureInterval = setInterval(async () => {
            if (!isModelRunning) return;
            try {
                const response = await fetch('/get_gestures');
                const data = await response.json();
                checkAndDisplayNewGestures(data.gesture); // Process unique gestures
            } catch (error) {
                console.error("Failed to fetch gesture:", error);
            }
        }, 2500);
    }

    function checkAndDisplayNewGestures(newGestures) {
        const newUniqueGestures = newGestures.filter(gesture => !lastGestures.includes(gesture));
        if (newUniqueGestures.length > 0) {
            lastGestures.push(...newUniqueGestures);
            if (lastGestures.length > 10) {
                lastGestures = lastGestures.slice(-10); 
            }
            gestureString += ' ' + newUniqueGestures.join(); 
            console.log("Updated Gesture String:", gestureString);
            displayGestureHistory(gestureString);
        }
    }

    function displayGestureHistory(gesture) {
        const inputTextElement = document.getElementById('input-text');
        if (isNewLineTriggered) {
            newLine();
            isNewLineTriggered = false;
        }
        if (inputTextElement) {
            inputTextElement.innerHTML = gesture;
        }
        translateGesture(gesture);
}

    async function translateGesture(gesture) {
        const selectedLanguage = languageSelect.value;
        if (isNewLineTriggered) {
            newLine();
            isNewLineTriggered = false;
        }
        if (!selectedLanguage) {
            translatedDiv.innerHTML = "Text and language are required.";
            return;
        }
        try {
            const response = await fetch('/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: gesture, 
                    language: selectedLanguage
                })
            });
            const data = await response.json();
            if (response.ok) {
                translatedDiv.innerHTML = data.translated_text; //translated text
            } else {
                translatedDiv.innerHTML = data.error || 'Translation failed.';
            }
        } catch (error) {
            console.error('Error:', error);
            translatedDiv.innerHTML = 'An error occurred while translating.';
        }
    }

    function resetNewLineTrigger() {
        isNewLineTriggered = true;
    }

    function newLine() {
        const inputTextElement = document.getElementById('input-text');
        const translatedTextElement = document.getElementById('translated-op');
        if (inputTextElement) {
            if (!inputTextElement.innerHTML.trim().endsWith('.')) {
                inputTextElement.innerHTML += '.';
            }
            inputTextElement.innerHTML += '<br>';
        }
        if (translatedTextElement) {
            if (!translatedTextElement.innerHTML.trim().endsWith('.')) {
                translatedTextElement.innerHTML += '.';
            }
            translatedTextElement.innerHTML += '<br>';
        }
        gestureString = ''; // Clear the gesture string
    }


//speak (text to speech)
document.getElementById("speak-btn").addEventListener("click", function () {
    const translatedText = translatedDiv.innerText;
    console.log("Translated Text:", translatedText);
    if (!window.speechSynthesis) {
        alert("Speech synthesis is not supported in this browser.");
        return;
    }
    if (translatedText) {
        const languageMap = {
            Hindi: 'hi-IN',
            Marathi: 'mr-IN',
            English: 'en-US',
            Urdu: 'ur-IN',
            Tamil: 'ta-IN',
            Telugu: 'te-IN',
            Bengali: 'bn-IN',
            Arabic: 'ar-SA',
            Kannada: 'kn-IN',
            Odia: 'or-IN',
            Malayalam: 'ml-IN',
            Punjabi: 'pa-IN',
            Gujarati: 'gu-IN',
            Sindhi: 'sd-PK',
            Nepali: 'ne-NP',
        };
        const selectedLanguage = document.getElementById("language").value;
        const languageCode = languageMap[selectedLanguage] || 'en-US';
        if (!languageCode) {
            console.error("Invalid language selected.");
            return;
        }
        const utterance = new SpeechSynthesisUtterance(translatedText);
        utterance.lang = languageCode;
        speechSynthesis.speak(utterance);
    } else {
        alert("Please translate some text first.");
    }
});

    window.runModel = runModel;
    window.resetNewLineTrigger = resetNewLineTrigger;
});

let gestureInterval = null;
let gestureString = ''; 

function stop() {
    if (gestureInterval) {
        clearInterval(gestureInterval);
        gestureInterval = null;
    }
    const videoElement = document.getElementById('videoElement');
    if (videoElement) {
        videoElement.src = "";
        videoElement.style.display = "none";
    }

    const overlayImage = document.getElementById('overlayImage');
    if (overlayImage) {
        overlayImage.style.display = "block";
    }
    const inputTextElement = document.getElementById('input-text');
    if (inputTextElement) {
        inputTextElement.innerHTML = '';
    }
    const translatedDiv = document.getElementById('translated-op');
    if (translatedDiv) {
        translatedDiv.innerHTML = '';
    }
    const translationIndicator = document.getElementById("translation-indicator");
    if (translationIndicator) {
        translationIndicator.style.backgroundColor = 'red';
        translationIndicator.textContent = "Model stopped.";
    }
    console.log("Model has stopped.");
}

