// ── API Config ──
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_KEY = "Add your api here";

// ── DOM References ──
const languageEl = document.getElementById("language");
const genderEl = document.getElementById("gender");
const categoryEl = document.getElementById("category");
const crushNameEl = document.getElementById("crush-name");
const userMsgEl = document.getElementById("user-message");
const crushField = document.getElementById("crush-name-field");
const msgField = document.getElementById("message-field");
const generateBtn = document.getElementById("generate-btn");
const btnText = document.getElementById("btn-text");
const btnSpinner = document.getElementById("btn-spinner");
const outputSec = document.getElementById("output-section");
const outputBox = document.getElementById("output-box");
const errorBox = document.getElementById("error-box");
const copyBtn = document.getElementById("copy-btn");
const copyText = document.getElementById("copy-text");
const copyIcon = document.getElementById("copy-icon");

// ── Animated Background Particles ──
(function initParticles() {
  const container = document.getElementById("bg-particles");
  if (!container) return;
  const colors = ["#ff3d7f", "#ff8c42", "#ff6b9d", "#ffb366"];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.classList.add("particle");
    const size = Math.random() * 4 + 2;
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "%";
    p.style.bottom = -(Math.random() * 20) + "%";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (Math.random() * 12 + 8) + "s";
    p.style.animationDelay = (Math.random() * 10) + "s";
    container.appendChild(p);
  }
})();

// ── Restore saved settings from localStorage ──
(function restoreSettings() {
  const saved = JSON.parse(localStorage.getItem("xflirting_settings") || "{}");
  if (saved.language) languageEl.value = saved.language;
  if (saved.gender) genderEl.value = saved.gender;
  if (saved.category) categoryEl.value = saved.category;
  updateFields();
})();

// ── Save settings on change ──
[languageEl, genderEl, categoryEl].forEach(el => {
  el.addEventListener("change", () => {
    localStorage.setItem("xflirting_settings", JSON.stringify({
      language: languageEl.value,
      gender: genderEl.value,
      category: categoryEl.value
    }));
    updateFields();
  });
});

// ── Show/hide input fields based on category ──
function updateFields() {
  const cat = categoryEl.value;
  const needsCrush = ["crush_name_shayari", "crush_name_flirt"].includes(cat);
  const needsMsg = ["message_reply", "flirting_reply"].includes(cat);

  crushField.classList.toggle("hidden", !needsCrush);
  msgField.classList.toggle("hidden", !needsMsg);
}

updateFields();

// ── Build prompt ──
function buildPrompt(language, gender, category, crushName, userMsg) {
  const lang = language === "hinglish"
    ? "Hinglish (Hindi written in English letters, e.g. 'Tumhari aankhein mujhe pagal kar deti hain...')"
    : "English";

  let target = "a person";
  let targetPron = "them";

  if (gender === "girl") {
    target = "a girl";
    targetPron = "her";
  } else if (gender === "boy") {
    target = "a boy";
    targetPron = "him";
  }

  const categoryPrompts = {
    random:
      `Generate a random flirting line or shayari for ${target} in ${lang}. Make it charming and creative.`,

    crush_name_shayari:
      `Generate a romantic shayari that includes the name "${crushName || "Priya"}" for ${target} in ${lang}. The name must appear naturally in the shayari.`,

    crush_name_flirt:
      `Generate a flirting line that includes the name "${crushName || "Priya"}" for ${target} in ${lang}. The name must appear naturally and make ${targetPron} smile.`,

    message_reply:
      `The user received this message: '${userMsg || "kya kar rahe ho?"}'

Detect the flirting tone/intent and generate a witty, flirtatious reply in ${lang} as if sending to ${target}. Keep it playful and clever.`,

    flirting_reply:
      `The user received this message: '${userMsg || "hey, what's up?"}'

Generate a flirty and engaging reply in ${lang} to send to ${target}. Make it charming and initiate a conversation.`,

    random_flirt:
      `Generate a fresh, creative flirting line for ${target} in ${lang}. Make it memorable and charming.`,

    shayari:
      `Generate a beautiful romantic shayari for ${target} in ${lang}. Make it poetic and heartfelt.`,

    sad_shayari:
      `Generate a sad shayari about love and longing in ${lang}. Make it emotional and touching.`,

    funny_shayari:
      `Generate a funny shayari for ${target} in ${lang}. Make it clever and make ${targetPron} laugh.`,

    motivation_shayari:
      `Generate an inspiring motivation shayari in ${lang}. Make it uplifting and powerful.`,

    random_shayari:
      `Generate a random style shayari (romantic, funny, or thoughtful) in ${lang}. Make it unique and creative.`
  };

  return categoryPrompts[category] || categoryPrompts.random;
}

// ── System prompt ──
function buildSystemPrompt(language) {
  if (language === "hinglish") {
    return `You are a charming AI that generates flirting lines, shayari, and witty replies. 
You ALWAYS write in Hinglish — Hindi words and phrases written in English letters (Roman script), NOT Devanagari script.
Examples of Hinglish style:
- "Tumhari muskaan dil ko chhoo jaati hai..."
- "Aankhen teri, dil mera kho gaya..."
- "Tum ho toh zindagi rangeen lagti hai 😊"
Keep the output natural, romantic, and culturally relevant. Use emojis where fitting.
Output ONLY the generated content — no explanations, no preamble, no quotes around the text.`;
  }
  return `You are a charming AI that generates flirting lines, shayari, and witty replies in English.
Keep them creative, romantic, witty, and culturally appropriate.
Output ONLY the generated content — no explanations, no preamble, no quotes around the text.
Use emojis where fitting.`;
}

// ── Call Groq API directly (no Chrome extension needed) ──
async function callGroq(systemPrompt, userPrompt) {
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "No response generated.";
}

// ── Generate handler ──
generateBtn.addEventListener("click", async () => {
  const language = languageEl.value;
  const gender = genderEl.value;
  const category = categoryEl.value;
  const crushName = crushNameEl.value.trim();
  const userMsg = userMsgEl.value.trim();

  // Validation
  if (["crush_name_shayari", "crush_name_flirt"].includes(category) && !crushName) {
    showError("Please enter your crush's name 💫");
    return;
  }
  if (["message_reply", "flirting_reply"].includes(category) && !userMsg) {
    showError("Please enter their message to reply to 💬");
    return;
  }

  // UI: loading
  setLoading(true);
  hideError();
  hideOutput();

  try {
    const systemPrompt = buildSystemPrompt(language);
    const userPrompt = buildPrompt(language, gender, category, crushName, userMsg);
    const result = await callGroq(systemPrompt, userPrompt);

    outputBox.textContent = result;
    outputSec.classList.remove("hidden");

    // Show the Auto Reply button
    document.getElementById("reply-ai-btn").style.display = "flex";
  } catch (err) {
    showError(`Failed to generate: ${err.message}`);
  } finally {
    setLoading(false);
  }
});

// ── Copy handler ──
copyBtn.addEventListener("click", async () => {
  const text = outputBox.textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add("copied");
    copyText.textContent = "Copied!";
    copyIcon.textContent = "✓";
    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyText.textContent = "Copy";
      copyIcon.textContent = "⧉";
    }, 2000);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
});

// ── Auto Reply Handler ──
const replyAiBtn = document.getElementById("reply-ai-btn");
const replyAiText = document.getElementById("reply-text");

replyAiBtn.addEventListener("click", async () => {
  const generatedText = outputBox.textContent;
  if (!generatedText) return;

  const language = languageEl.value;
  const gender = genderEl.value;

  // Disable button during generation
  replyAiBtn.disabled = true;
  replyAiText.textContent = "Replying...";
  hideError();

  try {
    const systemPrompt = buildSystemPrompt(language);

    // Create prompt for replying to the AI's generated message in a flirting way
    let target = "a person";
    if (gender === "girl") target = "a girl";
    else if (gender === "boy") target = "a boy";

    const lang = language === "hinglish"
      ? "Hinglish (Hindi written in English letters)"
      : "English";

    const userPrompt = `The user sent this flirty message: '${generatedText}'

Generate a witty, charming, and flirty reply to this message in ${lang} playing along as ${target}. Keep it conversational.`;

    const result = await callGroq(systemPrompt, userPrompt);

    outputBox.textContent = result;

    // Hide reply button since we just generated a reply
    replyAiBtn.style.display = "none";
  } catch (err) {
    showError(`Failed to generate reply: ${err.message}`);
  } finally {
    replyAiBtn.disabled = false;
    replyAiText.textContent = "Auto Reply";
  }
});

// ── Helpers ──
function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  btnText.classList.toggle("hidden", isLoading);
  btnSpinner.classList.toggle("hidden", !isLoading);
}

function showError(msg) {
  errorBox.textContent = "⚠ " + msg;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

function hideOutput() {
  outputSec.classList.add("hidden");
  replyAiBtn.style.display = "none";
}
