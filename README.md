# Swara-Marg — स्वर-मार्ग

Modular frontend prototype with Web Speech API voice input & Groq LLM skill matching. No build step or `npm install` needed — simply open `index.html` in your browser.

## Project File Structure

- **`index.html`**: Pure page structure and markup (chat box, voice controls, input row, dashboard table).
- **`style.css`**: All visual styles (layout, colors, spacing, mic listening states).
- **`data.js`**: Hardcoded `COURSES` and `JOB_DEMAND` arrays + `submissions` store.
- **`matching.js`**: `matchCourse()` function for skill-overlap and district-matching logic.
- **`groq.js`**: `extractWithGroq()` function for Groq LLM API integration.
- **`voice.js`**: Web Speech API speech recognition (`SpeechRecognition`) and synthesis (`speechSynthesis`).
- **`app.js`**: Core glue script (DOM events, `handleSend()`, chat log & table updates).
- **`README.md`**: Project documentation.

## How to Use

1. Get a Groq API key from [https://console.groq.com](https://console.groq.com) (starts with `gsk_`).
2. Paste it into the "Groq API key" input at the top of the page.
3. **Voice Input**: Select language (`English (en-IN)` or `हिंदी (hi-IN)`), click `🎤`, and speak your message.
4. **Text Input**: Type a message like: `"I do plumbing work in Samastipur, studied till class 8"`.
5. Click **Send** (or press Enter) — Groq extracts your skills/district and matches you to local courses and job demand.
6. Submissions dynamically record in the dashboard table below.

## What's Real vs. Fake

- **Real**: Groq API call for skill & district extraction.
- **Real**: Matching algorithm (skill overlap + district bonus).
- **Real**: Web Speech API (`SpeechRecognition`) voice transcription (English & Hindi).
- **Fake/Hardcoded**: Mock course catalog and job demand openings in `data.js`.
- **In-Memory**: Submissions table resets on browser refresh.
