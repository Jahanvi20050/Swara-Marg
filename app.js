// ---- Guided Step-by-Step Conversation State Machine ----

let currentStep = 1;
let collectedData = {
  occupation: "",
  district: "",
  education: "",
  skills: []
};

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
}

function addMsg(text, who) {
  const log = document.getElementById("chatlog");
  if (!log) return;
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.innerHTML = (who === "user" ? "<b>You:</b> " : "<b>Assistant:</b> ") + text;
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
  tr.innerHTML = `<td>${time}</td><td>${skills.join(", ")}</td><td>${district || "—"}</td>
    <td>${course ? course.name : "No match"}</td>
    <td>${demand ? demand.openings + " openings" : "—"}</td>`;
  tbody.appendChild(tr);
}

function onLanguageChange() {
  // Re-announce current step question in new language if started
  askStepQuestion(currentStep);
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
      questionText = `कृपया पुष्टि करें: आप ${collectedData.occupation} का काम करते हैं, ${collectedData.district} में रहते हैं, और ${collectedData.education}। क्या यह जानकारी सही है? कृपया हाँ या ना कहें।`;
    } else {
      questionText = `Please confirm: You do ${collectedData.occupation}, located in ${collectedData.district}, with schooling/notes: "${collectedData.education}". Is this information correct? Please say Yes or No.`;
    }
  }

  if (questionText) {
    updateStepUI(step);
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
        isConfirmed = /yes|yeah|sure|correct|सही|हाँ|हा|ठीक/i.test(answer);
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
    btn.textContent = "Send Answer";
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

  // 1. Show message in chat
  addMsg(replyText, "bot");

  // 2. Render large text backup card
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

document.getElementById("userInput").addEventListener("keydown", e => {
  if (e.key === "Enter") handleSend();
});

// Initialize Step 1 question on load
window.addEventListener("DOMContentLoaded", () => {
  askStepQuestion(1);
});
