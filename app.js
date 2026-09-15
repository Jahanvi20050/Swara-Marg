// ---- Guided Step-by-Step Conversation & IVR State Machine ----

let currentStep = 1;
let collectedData = {
  occupation: "",
  district: "",
  education: "",
  skills: []
};

window.isCallActive = false;
let callTimerInterval = null;
let callSeconds = 0;

const STEP_QUESTIONS = {
  "en-IN": {
    1: "What work do you do?",
    2: "Which village or block are you in?",
    3: "Can you tell me about your schooling, or any physical limitations that affect what work you can do?",
    4: "Confirmation Step",
    5: "Final Recommendation"
  },
  "hi-IN": {
    1: "आप क्या काम करते हैं?",
    2: "आप किस गाँव या ब्लॉक में रहते हैं?",
    3: "क्या आप अपनी पढ़ाई या किसी शारीरिक समस्या के बारे में बता सकते हैं?",
    4: "पुष्टि चरण",
    5: "अंतिम अनुशंसा"
  }
};

function getLang() {
  const langSelect = document.getElementById("langSelect");
  return langSelect ? langSelect.value : "en-IN";
}

function updateStepUI(step) {
  const stepBadge = document.getElementById("stepBadge");
  if (stepBadge) {
    if (step <= 4) {
      stepBadge.textContent = `Step ${step} of 4`;
    } else {
      stepBadge.textContent = `Completed`;
    }
  }

  // Keypad label hints for Step 4 (Confirmation)
  const keySub1 = document.getElementById("keySub1");
  const keySub2 = document.getElementById("keySub2");
  if (keySub1 && keySub2) {
    if (step === 4) {
      keySub1.textContent = "CONFIRM";
      keySub1.style.color = "#10b981";
      keySub2.textContent = "RESTART";
      keySub2.style.color = "#ef4444";
    } else {
      keySub1.textContent = "YES";
      keySub1.style.color = "";
      keySub2.textContent = "NO";
      keySub2.style.color = "";
    }
  }
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
  stopTimer();
  callSeconds = 0;
  const timerDisplay = document.getElementById("callTimer");
  if (timerDisplay) timerDisplay.textContent = "00:00";

  callTimerInterval = setInterval(() => {
    callSeconds++;
    if (timerDisplay) timerDisplay.textContent = formatTime(callSeconds);
  }, 1000);
}

function stopTimer() {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
}

// Play DTMF / Keypad Touch Beep Sound (Web Audio API)
function playKeyTone(freq = 440) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Audio tone fallback
  }
}

function startCall() {
  window.isCallActive = true;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (typeof stopListening === "function") stopListening();

  // Reset conversation state
  currentStep = 1;
  collectedData = { occupation: "", district: "", education: "", skills: [] };

  // Update Call Screens
  document.getElementById("idleCallScreen")?.classList.remove("active");
  document.getElementById("endedCallScreen")?.classList.remove("active");
  document.getElementById("activeCallScreen")?.classList.add("active");
  
  const resultCard = document.getElementById("resultCard");
  if (resultCard) resultCard.classList.remove("active");

  // Clear Welcome Card from Chatlog if present
  const chatlog = document.getElementById("chatlog");
  if (chatlog) {
    const welcome = chatlog.querySelector(".system-welcome-card");
    if (welcome) welcome.style.display = "none";
  }

  // Start Call Timer
  startTimer();

  // Announce Step 1
  askStepQuestion(1);
}

function endCall() {
  window.isCallActive = false;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (typeof stopListening === "function") stopListening();

  stopTimer();

  const finalDuration = formatTime(callSeconds);

  document.getElementById("activeCallScreen")?.classList.remove("active");
  document.getElementById("idleCallScreen")?.classList.remove("active");
  
  const endedScreen = document.getElementById("endedCallScreen");
  if (endedScreen) {
    endedScreen.classList.add("active");
    const durationEl = document.getElementById("endedDuration");
    const stepsEl = document.getElementById("endedSteps");
    if (durationEl) durationEl.textContent = `Call Duration: ${finalDuration}`;
    if (stepsEl) stepsEl.textContent = `Questions Completed: ${Math.min(currentStep - 1, 4)} / 4`;
  }

  const stepBadge = document.getElementById("stepBadge");
  if (stepBadge) stepBadge.textContent = "Call Ended";

  const callStatus = document.getElementById("callStatus");
  if (callStatus) callStatus.textContent = "Call disconnected";
}

function onKeypadPress(val) {
  playKeyTone(val === '1' ? 697 : val === '2' ? 770 : 852);

  if (!window.isCallActive) return;

  const input = document.getElementById("userInput");
  
  // Special Handling for Step 4 Confirmation
  if (currentStep === 4) {
    if (val === '1') {
      if (input) input.value = "Yes";
      handleSend();
      return;
    } else if (val === '2') {
      if (input) input.value = "No";
      handleSend();
      return;
    }
  }

  // Generic Keypad Press for natural input
  if (input) {
    input.value += val;
    input.focus();
  }
}

function addMsg(text, who) {
  const log = document.getElementById("chatlog");
  if (!log) return;

  const div = document.createElement("div");
  div.className = "msg " + who;

  const timeStr = formatTime(callSeconds);
  const headerHtml = who === "user"
    ? `<div class="msg-header"><span>🎙️ YOU</span><span>${timeStr}</span></div>`
    : `<div class="msg-header"><span>🔊 SWARA-MARG AGENT</span><span>${timeStr}</span></div>`;

  div.innerHTML = headerHtml + `<div>${text}</div>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function addRow(skills, district, course, demand) {
  const note = document.getElementById("emptyNote");
  if (note) note.style.display = "none";
  const tbody = document.getElementById("dashBody");
  if (!tbody) return;
  const tr = document.createElement("tr");
  const time = new Date().toLocaleTimeString();
  tr.innerHTML = `<td>${time}</td>
    <td>${skills.join(", ")}</td>
    <td>${district || "—"}</td>
    <td><strong>${course ? course.name : "No direct match"}</strong></td>
    <td><span style="color: var(--primary-green); font-weight: 700;">${demand ? demand.openings + " openings" : "Standard demand"}</span></td>`;
  tbody.appendChild(tr);
}

function onLanguageChange() {
  if (window.isCallActive) {
    askStepQuestion(currentStep);
  }
}

function askStepQuestion(step) {
  const lang = getLang();
  let questionText = "";

  if (step === 1) {
    questionText = STEP_QUESTIONS[lang][1];
  } else if (step === 2) {
    questionText = STEP_QUESTIONS[lang][2];
  } else if (step === 3) {
    questionText = STEP_QUESTIONS[lang][3];
  } else if (step === 4) {
    if (lang === "hi-IN") {
      questionText = `कृपया पुष्टि करें: आप ${collectedData.occupation} का काम करते हैं, ${collectedData.district} में रहते हैं, और ${collectedData.education}।\n\nपुष्टि के लिए keypad पर 1 दबाएं (हाँ) या फिर से शुरू करने के लिए 2 दबाएं (ना)।`;
    } else {
      questionText = `Please confirm: You do ${collectedData.occupation}, located in ${collectedData.district}, with schooling/notes: "${collectedData.education}".\n\nPress 1 on the keypad for Yes, or Press 2 for No.`;
    }
  }

  if (questionText) {
    updateStepUI(step);

    // Update Live Question Display inside Phone UI
    const liveQuestionText = document.getElementById("liveQuestionText");
    if (liveQuestionText) liveQuestionText.textContent = questionText;

    addMsg(questionText, "bot");

    // Speak out loud, then automatically start listening for response
    speakReply(questionText, () => {
      autoStartListening();
    });
  }
}

async function handleSend() {
  const input = document.getElementById("userInput");
  const btn = document.getElementById("sendBtn");
  const answer = input ? input.value.trim() : "";

  if (!answer) return;

  addMsg(answer, "user");
  if (input) input.value = "";

  btn.disabled = true;
  btn.textContent = "Processing...";

  const liveQuestionText = document.getElementById("liveQuestionText");
  if (liveQuestionText) liveQuestionText.textContent = `Processing response: "${answer}"...`;

  try {
    const lang = getLang();

    if (currentStep === 1) {
      collectedData.occupation = answer;
      try {
        const extracted = await extractStepInfo(1, answer, lang);
        collectedData.skills = extracted.skills || [answer.toLowerCase()];
      } catch (e) {
        collectedData.skills = [answer.toLowerCase()];
      }
      currentStep = 2;
      askStepQuestion(2);

    } else if (currentStep === 2) {
      try {
        const extracted = await extractStepInfo(2, answer, lang);
        collectedData.district = extracted.district || answer;
      } catch (e) {
        collectedData.district = answer;
      }
      currentStep = 3;
      askStepQuestion(3);

    } else if (currentStep === 3) {
      collectedData.education = answer;
      currentStep = 4;
      askStepQuestion(4);

    } else if (currentStep === 4) {
      let isConfirmed = false;
      try {
        const extracted = await extractStepInfo(4, answer, lang);
        isConfirmed = extracted.confirmed;
      } catch (e) {
        isConfirmed = /1|yes|yeah|sure|correct|सही|हाँ|हा|ठीक/i.test(answer);
      }

      if (isConfirmed) {
        currentStep = 5;
        renderFinalRecommendation();
      } else {
        // Restart conversation on rejection
        const resetMsg = lang === "hi-IN" 
          ? "चलिए फिर से शुरू करते हैं।" 
          : "Let's try again from the beginning.";
        addMsg(resetMsg, "bot");
        collectedData = { occupation: "", district: "", education: "", skills: [] };
        currentStep = 1;
        askStepQuestion(1);
      }
    }
  } catch (err) {
    console.error("Step execution error:", err);
    addMsg("Error processing response: " + err.message, "bot");
  } finally {
    btn.disabled = false;
    btn.textContent = "Send";
  }
}

function renderFinalRecommendation() {
  const lang = getLang();
  updateStepUI(5);

  const { course, demand } = matchCourse(collectedData.skills, collectedData.district);

  let replyText = "";
  if (course) {
    if (lang === "hi-IN") {
      replyText = `आपके विवरण के अनुसार, आपके लिए सर्वोत्तम ट्रेनिंग कोर्स ${course.name} (${course.center}) है।${demand ? ' आपके क्षेत्र में ' + demand.openings + ' रोजगार के अवसर उपलब्ध हैं।' : ''}`;
    } else {
      replyText = `Based on your details in ${collectedData.district || "your district"}, the recommended course is ${course.name} at ${course.center}.${demand ? ' There are currently ' + demand.openings + ' local job openings.' : ''}`;
    }
  } else {
    replyText = lang === "hi-IN"
      ? "कोई सटीक कोर्स मैच नहीं मिला। कृपया अपने कौशल का अधिक विस्तार से वर्णन करें।"
      : "Couldn't find a direct course match based on the provided skills.";
  }

  // Update Live Question in phone screen
  const liveQuestionText = document.getElementById("liveQuestionText");
  if (liveQuestionText) liveQuestionText.textContent = "Call completed. Recommendation generated below!";

  // 1. Show message in transcript
  addMsg(replyText, "bot");

  // 2. Render large recommendation card inside Phone Screen
  const card = document.getElementById("resultCard");
  const cardCourse = document.getElementById("cardCourse");
  const cardCenter = document.getElementById("cardCenter");
  const cardDemand = document.getElementById("cardDemand");

  if (card && course) {
    card.classList.add("active");
    if (cardCourse) cardCourse.textContent = course.name;
    if (cardCenter) cardCenter.textContent = "📍 Training Center: " + course.center + " (" + course.district + ")";
    if (cardDemand) cardDemand.textContent = "💼 Job Openings: " + (demand ? demand.openings + " openings available" : "Standard demand");
  }

  // 3. Speak result out loud
  speakReply(replyText);

  // 4. Record entry in officer dashboard table
  addRow(collectedData.skills, collectedData.district, course, demand);
}

// Keydown Enter listener for text input
document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("userInput");
  if (userInput) {
    userInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleSend();
    });
  }

  // Update status bar clock periodically
  const updateClock = () => {
    const clockEl = document.getElementById("statusClock");
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  };
  updateClock();
  setInterval(updateClock, 30000);
});
