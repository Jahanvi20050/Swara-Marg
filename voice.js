// ---- Web Speech API (SpeechRecognition & SpeechSynthesis) ----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let autoListenTimer = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    updateMicUI(true);
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    const input = document.getElementById("userInput");
    if (input && transcript) {
      input.value = transcript;
    }
  };

  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    stopListening();
  };

  recognition.onend = () => {
    stopListening();
  };
}

function updateMicUI(listening) {
  const micBtn = document.getElementById("micBtn");
  const callStatus = document.getElementById("callStatus");
  if (micBtn) {
    if (listening) {
      micBtn.classList.add("listening");
      micBtn.textContent = "🎙️ Listening...";
    } else {
      micBtn.classList.remove("listening");
      micBtn.textContent = "🎤 Speak Answer";
    }
  }
  if (callStatus) {
    callStatus.textContent = listening ? "Listening for your response..." : "Click mic or type answer below";
  }
}

function stopListening() {
  isListening = false;
  updateMicUI(false);
}

function autoStartListening() {
  if (!SpeechRecognition) return;
  if (isListening) return;
  const langSelect = document.getElementById("langSelect");
  if (recognition) {
    recognition.lang = langSelect ? langSelect.value : "en-IN";
    try {
      recognition.start();
    } catch (err) {
      console.warn("Auto-start recognition notice:", err);
    }
  }
}

function toggleListening() {
  if (!SpeechRecognition) {
    alert("Web Speech API is not supported in this browser. You can type your response instead.");
    return;
  }
  if (isListening) {
    recognition.stop();
  } else {
    autoStartListening();
  }
}

// Speech Synthesis with completion callback
function speakReply(text, onEndCallback) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel(); // Cancel active speech
    const cleanText = text.replace(/<[^>]*>/g, ""); // strip HTML
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langSelect = document.getElementById("langSelect");
    utterance.lang = langSelect ? langSelect.value : "en-IN";

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (onEndCallback) onEndCallback();
      }
    };

    utterance.onend = finish;
    utterance.onerror = (err) => {
      console.warn("SpeechSynthesis error:", err);
      finish();
    };

    window.speechSynthesis.speak(utterance);
  } else if (onEndCallback) {
    onEndCallback();
  }
}
