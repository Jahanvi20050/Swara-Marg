// ---- Web Speech API (SpeechRecognition & SpeechSynthesis) ----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

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
  const micStatusText = document.getElementById("micStatusText");
  const audioWave = document.getElementById("audioWave");

  if (micBtn) {
    if (listening) {
      micBtn.classList.add("listening");
      micBtn.setAttribute("title", "Listening...");
    } else {
      micBtn.classList.remove("listening");
      micBtn.setAttribute("title", "Toggle Microphone");
    }
  }

  if (listening) {
    if (callStatus) callStatus.textContent = "Listening for your response...";
    if (micStatusText) micStatusText.textContent = "🎙️ Listening... Speak now";
    if (audioWave) audioWave.classList.add("active");
  } else {
    if (callStatus && window.isCallActive) callStatus.textContent = "Call in progress...";
    if (micStatusText) micStatusText.textContent = "Press mic, type, or use keypad";
    if (audioWave && !window.speechSynthesis?.speaking) audioWave.classList.remove("active");
  }
}

function stopListening() {
  isListening = false;
  updateMicUI(false);
}

function autoStartListening() {
  if (!SpeechRecognition) return;
  if (!window.isCallActive) return; // Only listen during an active call
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
    alert("Web Speech API is not supported in this browser. You can type your response or use keypad instead.");
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
  const micStatusText = document.getElementById("micStatusText");
  const audioWave = document.getElementById("audioWave");

  if (micStatusText) micStatusText.textContent = "🔊 Agent Speaking...";
  if (audioWave) audioWave.classList.add("active");

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
        if (audioWave && !isListening) audioWave.classList.remove("active");
        if (onEndCallback && window.isCallActive) onEndCallback();
      }
    };

    utterance.onend = finish;
    utterance.onerror = (err) => {
      console.warn("SpeechSynthesis error:", err);
      finish();
    };

    window.speechSynthesis.speak(utterance);
  } else if (onEndCallback && window.isCallActive) {
    if (audioWave) audioWave.classList.remove("active");
    onEndCallback();
  }
}
