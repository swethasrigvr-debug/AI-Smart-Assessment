const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const appState = {
  user: JSON.parse(localStorage.getItem("iaspUser") || "null") || {
    name: "Aarav Sharma",
    email: "candidate@example.in",
    course: "Electric Vehicle Service Technician",
    score: 82,
  },
  answers: JSON.parse(localStorage.getItem("iaspAnswers") || "{}"),
  wrongAnswers: JSON.parse(localStorage.getItem("iaspWrong") || "[]"),
};

const questionBank = {
  Easy: [
    {
      topic: "Safety",
      q: "Which PPE is essential before handling electrical panels?",
      options: ["Cotton gloves", "Insulated gloves", "Wool scarf", "Metal bracelet"],
      answer: 1,
      explanation: "Insulated gloves reduce shock risk while working around live or stored electrical energy.",
    },
    {
      topic: "Digital Skills",
      q: "What does offline assessment mode primarily help with?",
      options: ["Faster animation", "Low-connectivity continuity", "Removing invigilators", "Skipping scoring"],
      answer: 1,
      explanation: "Offline mode lets candidates continue tests where internet access is unreliable.",
    },
    {
      topic: "Employability",
      q: "A good workplace instruction should be:",
      options: ["Ambiguous", "Clear and measurable", "Hidden", "Only verbal"],
      answer: 1,
      explanation: "Clear and measurable instructions make assessment fairer and easier to verify.",
    },
  ],
  Medium: [
    {
      topic: "Assessment",
      q: "Which assessment method is best for observing hands-on competency?",
      options: ["MCQ only", "Practical assessment", "Attendance sheet", "Resume review"],
      answer: 1,
      explanation: "Practical assessments directly observe performance against competency standards.",
    },
    {
      topic: "AI Fairness",
      q: "Why should adaptive difficulty be audited?",
      options: ["To ensure fairness across groups", "To make all tests hard", "To hide scoring", "To remove accessibility"],
      answer: 0,
      explanation: "Audits check that adaptive logic does not disadvantage candidates by language, disability, region, or background.",
    },
    {
      topic: "Data",
      q: "Which metric best indicates topic mastery?",
      options: ["Login time", "Topic-wise accuracy", "Screen size", "Profile photo"],
      answer: 1,
      explanation: "Topic-wise accuracy maps performance to competencies and helps target remediation.",
    },
  ],
  Hard: [
    {
      topic: "Security",
      q: "Which combination best supports secure assessment delivery?",
      options: ["Autosave, session timeout, validation", "Plain passwords, no logs", "Shared accounts", "Unverified exports"],
      answer: 0,
      explanation: "Autosave, timeout cues, and validation reduce data loss and basic security risks.",
    },
    {
      topic: "Accessibility",
      q: "What makes a viva voce evaluation more inclusive?",
      options: ["One fixed language", "Alternate input, captions, rubric-based scoring", "No feedback", "Only fast responses"],
      answer: 1,
      explanation: "Alternative input, captions, and rubrics support diverse candidates and reduce evaluator bias.",
    },
    {
      topic: "Analytics",
      q: "A high score with long time spent most likely suggests:",
      options: ["Strong but slow performance", "No assessment data", "Random guessing", "Invalid course"],
      answer: 0,
      explanation: "Time data should be interpreted with score and accessibility needs before drawing conclusions.",
    },
  ],
};

let exam = {
  current: 0,
  difficulty: "Easy",
  streak: 0,
  score: 0,
  pattern: [],
  questions: [],
  seconds: Number(localStorage.getItem("iaspTimer") || 900),
  timerId: null,
  submitted: false,
};

function saveUser() {
  localStorage.setItem("iaspUser", JSON.stringify(appState.user));
}

function initCommon() {
  const savedTheme = localStorage.getItem("iaspTheme");
  const savedContrast = localStorage.getItem("iaspContrast");
  const savedScale = localStorage.getItem("iaspScale") || "1";
  if (savedTheme === "dark") document.body.classList.add("dark");
  if (savedContrast === "high") document.body.classList.add("high-contrast");
  document.documentElement.style.setProperty("--font-scale", savedScale);

  $$(".nav-toggle").forEach((btn) => {
    btn.addEventListener("click", () => $(".nav-links")?.classList.toggle("open"));
  });

  $$("[data-dark-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("iaspTheme", document.body.classList.contains("dark") ? "dark" : "light");
    });
  });

  $$("[data-contrast-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.classList.toggle("high-contrast");
      localStorage.setItem("iaspContrast", document.body.classList.contains("high-contrast") ? "high" : "normal");
    });
  });

  $$("[data-font]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = Math.min(1.3, Math.max(0.9, Number(getComputedStyle(document.documentElement).getPropertyValue("--font-scale")) + Number(btn.dataset.font)));
      document.documentElement.style.setProperty("--font-scale", next.toFixed(1));
      localStorage.setItem("iaspScale", next.toFixed(1));
    });
  });

  $$("[data-tts]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.dataset.tts || document.body.innerText.slice(0, 600);
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    });
  });

  $("#notifyBtn")?.addEventListener("click", () => $("#notificationPanel")?.classList.toggle("open"));
  $("#chatBtn")?.addEventListener("click", () => $("#chatbot")?.classList.toggle("open"));
  $("#chatForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#chatInput");
    const log = $("#chatLog");
    if (!input.value.trim()) return;
    log.insertAdjacentHTML("beforeend", `<p><strong>You:</strong> ${escapeHtml(input.value)}</p><p><strong>AI:</strong> Focus on one weak topic, attempt 5 practice items, then review explanations.</p>`);
    input.value = "";
  });
}

function initLogin() {
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".tab-btn").forEach((b) => b.classList.remove("active"));
      $$(".auth-form").forEach((form) => form.classList.remove("active"));
      btn.classList.add("active");
      $(`#${btn.dataset.tab}`).classList.add("active");
    });
  });

  $$(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = input.type === "password" ? "Show" : "Hide";
    });
  });

  $$(".auth-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = form.querySelector("[type='email']");
      const password = form.querySelector("[data-password-field]");
      const error = form.querySelector(".error");
      const strong = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!email.value.includes("@")) {
        error.textContent = "Enter a valid email address.";
        return;
      }
      if (!strong.test(password.value)) {
        error.textContent = "Password must be 8+ characters with one capital letter and one number.";
        return;
      }
      appState.user = {
        name: form.dataset.role === "admin" ? "Admin Coordinator" : ($("#registerName")?.value || "Aarav Sharma"),
        email: email.value,
        course: $("#registerCourse")?.value || "Solar PV Installer",
        score: 82,
        role: form.dataset.role || "candidate",
      };
      saveUser();
      location.href = form.dataset.role === "admin" ? "admin.html" : "dashboard.html";
    });
  });
}

function initDashboard() {
  $$(".candidate-name").forEach((el) => (el.textContent = appState.user.name));
  $$(".candidate-course").forEach((el) => (el.textContent = appState.user.course));
  animateStats();
}

function animateStats() {
  $$(".stat[data-target]").forEach((el) => {
    const target = Number(el.dataset.target);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 32));
    const tick = () => {
      current = Math.min(target, current + step);
      el.textContent = `${current}${el.dataset.suffix || ""}`;
      if (current < target) requestAnimationFrame(tick);
    };
    tick();
  });
}

function buildExamQuestions() {
  const savedQuestions = JSON.parse(localStorage.getItem("iaspExamQuestions") || "null");
  if (Array.isArray(savedQuestions) && savedQuestions.length) {
    exam.questions = savedQuestions;
    return;
  }
  const all = [];
  ["Easy", "Medium", "Hard"].forEach((level) => {
    const shuffled = [...questionBank[level]].sort(() => Math.random() - 0.5);
    shuffled.forEach((item) => all.push({ ...item, difficulty: level }));
  });
  exam.questions = all.slice(0, 9);
  localStorage.setItem("iaspExamQuestions", JSON.stringify(exam.questions));
}

function initExam() {
  exam.submitted = false;
  document.body.classList.remove("exam-complete");
  normalizeSavedAnswers();
  buildExamQuestions();
  exam.current = Math.max(0, Math.min(Number(localStorage.getItem("iaspCurrentQuestion") || 0), exam.questions.length - 1));
  $("#totalQuestions").textContent = exam.questions.length;
  renderPalette();
  renderQuestion();
  startTimer();
  $("#prevQuestion")?.addEventListener("click", previousQuestion);
  $("#nextQuestion").addEventListener("click", nextQuestion);
  $("#submitExam").addEventListener("click", finishExam);
  $("#resetExam")?.addEventListener("click", resetExam);
  window.addEventListener("beforeunload", () => localStorage.setItem("iaspTimer", String(exam.seconds)));
}

function normalizeSavedAnswers() {
  const saved = Object.values(appState.answers);
  if (saved.some((item) => !item || !item.q || !Array.isArray(item.q.options))) {
    appState.answers = {};
    localStorage.removeItem("iaspAnswers");
  }
}

function startTimer() {
  const timer = $("#timer");
  const update = () => {
    const min = Math.floor(exam.seconds / 60).toString().padStart(2, "0");
    const sec = (exam.seconds % 60).toString().padStart(2, "0");
    timer.textContent = `${min}:${sec}`;
    if (exam.seconds <= 0) finishExam();
    exam.seconds -= 1;
  };
  update();
  exam.timerId = setInterval(update, 1000);
}

function chooseQuestionByDifficulty() {
  const remaining = exam.questions
    .map((question, idx) => ({ question, idx }))
    .filter((item) => !appState.answers[item.idx]);
  return remaining.find((item) => item.question.difficulty === exam.difficulty) || remaining[0] || null;
}

function renderQuestion() {
  if (exam.submitted) return;
  const q = exam.questions[exam.current];
  if (!q) return;
  localStorage.setItem("iaspCurrentQuestion", String(exam.current));
  $("#questionNumber").textContent = exam.current + 1;
  $("#difficulty").textContent = q.difficulty;
  $("#questionText").textContent = q.q;
  $("#topic").textContent = q.topic;
  $("#progressBar").style.width = `${(Object.keys(appState.answers).length / exam.questions.length) * 100}%`;
  $("#options").innerHTML = q.options
    .map((option, idx) => {
      const selected = appState.answers[exam.current]?.selected === idx;
      return `<label class="option ${selected ? "selected" : ""}"><input type="radio" name="option" value="${idx}" ${selected ? "checked" : ""}> ${option}</label>`;
    })
    .join("");
  $$(".option").forEach((label) => {
    label.addEventListener("click", () => selectAnswer(Number(label.querySelector("input").value)));
  });
  $("#examMessage").textContent = "";
  $("#prevQuestion").disabled = exam.current === 0;
  $("#nextQuestion").textContent = exam.current === exam.questions.length - 1 ? "Last question" : "Next";
  $("#nextQuestion").disabled = exam.current === exam.questions.length - 1;
  renderPalette();
}

function selectAnswer(selected) {
  if (exam.submitted) return;
  const q = exam.questions[exam.current];
  const correct = selected === q.answer;
  const wasUnanswered = !appState.answers[exam.current];
  appState.answers[exam.current] = { selected, correct, q };
  localStorage.setItem("iaspAnswers", JSON.stringify(appState.answers));
  if (wasUnanswered) {
    exam.pattern.push(correct ? 1 : 0);
    exam.streak = correct ? exam.streak + 1 : 0;
    if (correct && exam.difficulty === "Easy") exam.difficulty = "Medium";
    else if (correct && exam.difficulty === "Medium" && exam.streak >= 2) exam.difficulty = "Hard";
    else if (!correct && exam.difficulty === "Hard") exam.difficulty = "Medium";
    else if (!correct && exam.difficulty === "Medium") exam.difficulty = "Easy";
  }
  renderQuestion();
}

function previousQuestion() {
  if (exam.submitted || exam.current === 0) return;
  exam.current -= 1;
  renderQuestion();
}

function nextQuestion() {
  if (exam.submitted) return;
  if (exam.current >= exam.questions.length - 1) return;
  const adaptive = chooseQuestionByDifficulty();
  if (adaptive && adaptive.idx > exam.current) exam.current = adaptive.idx;
  else exam.current += 1;
  renderQuestion();
}

function renderPalette() {
  const palette = $("#palette");
  if (!palette) return;
  palette.innerHTML = exam.questions
    .map((_, idx) => `<button class="${appState.answers[idx] ? "done" : ""}" aria-label="Question ${idx + 1}" data-jump="${idx}">${idx + 1}</button>`)
    .join("");
  $$("[data-jump]", palette).forEach((btn) => {
    btn.addEventListener("click", () => {
      if (exam.submitted) return;
      exam.current = Number(btn.dataset.jump);
      const q = exam.questions[exam.current];
      if (q) exam.difficulty = q.difficulty;
      renderQuestion();
    });
  });
}

function finishExam() {
  if (exam.submitted) return;
  const firstUnanswered = exam.questions.findIndex((_, idx) => !appState.answers[idx]);
  if (firstUnanswered !== -1) {
    exam.current = firstUnanswered;
    renderQuestion();
    $("#examMessage").textContent = `Please answer question ${firstUnanswered + 1} before submitting.`;
    return;
  }
  exam.submitted = true;
  clearInterval(exam.timerId);
  const answers = exam.questions.map((q, idx) => appState.answers[idx] || { selected: -1, correct: false, q });
  const score = Math.round((answers.filter((a) => a.correct).length / exam.questions.length) * 100) || 0;
  appState.user.score = score;
  saveUser();
  const wrong = answers.filter((a) => !a.correct).map((a) => a.q ? { ...a.q, selected: a.selected } : a);
  localStorage.setItem("iaspWrong", JSON.stringify(wrong));
  localStorage.removeItem("iaspTimer");
  localStorage.removeItem("iaspExamQuestions");
  localStorage.removeItem("iaspCurrentQuestion");
  appState.answers = {};
  localStorage.removeItem("iaspAnswers");
  document.body.classList.add("exam-complete");
  $("#examResult").innerHTML = `<div class="card"><h2>Assessment submitted</h2><p>Your adaptive score is <strong>${score}%</strong>. AI recommends revising ${weakTopic(wrong)} before the viva voce round.</p><div class="toolbar"><a class="btn btn-primary" href="analytics.html">Review analysis</a><a class="btn btn-success" href="certificate.html">Certificate</a><button class="btn btn-secondary" type="button" id="restartExam">Start new exam</button></div></div>`;
  const shell = $(".exam-shell");
  if (shell) {
    shell.hidden = true;
    shell.style.display = "none";
  }
  $("#restartExam").addEventListener("click", resetExam);
}

function resetExam() {
  clearInterval(exam.timerId);
  appState.answers = {};
  localStorage.removeItem("iaspAnswers");
  localStorage.removeItem("iaspWrong");
  localStorage.removeItem("iaspTimer");
  localStorage.removeItem("iaspExamQuestions");
  localStorage.removeItem("iaspCurrentQuestion");
  location.reload();
}

function weakTopic(wrong) {
  if (!wrong.length) return "advanced scenario-based problems";
  const counts = wrong.reduce((acc, item) => {
    acc[item.topic] = (acc[item.topic] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function initAnalytics() {
  const wrong = JSON.parse(localStorage.getItem("iaspWrong") || "[]");
  const list = $("#wrongList");
  if (list) {
    list.innerHTML = wrong.length
      ? wrong.map((item) => `<article class="card"><span class="badge">${item.topic}</span><h3>${item.q}</h3><p><strong>Your answer:</strong> ${item.options[item.selected] || "Not attempted"}</p><p><strong>Correct answer:</strong> ${item.options[item.answer]}</p><p>${item.explanation}</p></article>`).join("")
      : `<article class="card"><h3>No weak answers recorded</h3><p>Complete an exam to generate detailed wrong-answer analytics.</p></article>`;
  }
  $("#weakTopic") && ($("#weakTopic").textContent = weakTopic(wrong));
  animateStats();
}

function initRevision() {
  const topics = $$(".revision-item");
  $("#revisionSearch")?.addEventListener("input", (event) => {
    const value = event.target.value.toLowerCase();
    topics.forEach((item) => {
      item.style.display = item.innerText.toLowerCase().includes(value) ? "" : "none";
    });
  });
  $$(".bookmark").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("btn-success");
      btn.textContent = btn.classList.contains("btn-success") ? "Bookmarked" : "Bookmark";
    });
  });
  $$(".flashcard").forEach((card) => card.addEventListener("click", () => card.classList.toggle("flipped")));
}

function initCertificate() {
  $("#certName").textContent = appState.user.name;
  $("#certCourse").textContent = appState.user.course;
  $("#certScore").textContent = `${appState.user.score}%`;
  $("#certDate").textContent = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  $("#certId").textContent = `IASP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  $("#downloadCert").addEventListener("click", () => window.print());
}

function initAdmin() {
  animateStats();
  const table = $("#questionTable");
  const rows = [];
  Object.entries(questionBank).forEach(([level, qs]) => qs.forEach((q) => rows.push({ level, ...q })));
  const render = () => {
    table.innerHTML = rows.map((row, idx) => `<tr><td>${row.q}</td><td>${row.topic}</td><td>${row.level}</td><td><button class="btn btn-secondary" data-edit="${idx}">Edit</button> <button class="btn btn-danger" data-del="${idx}">Delete</button></td></tr>`).join("");
    $$("[data-del]").forEach((btn) => btn.addEventListener("click", () => {
      rows.splice(Number(btn.dataset.del), 1);
      render();
    }));
  };
  render();
  $("#questionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    rows.unshift({
      q: $("#adminQuestion").value,
      topic: $("#adminTopic").value,
      level: $("#adminDifficulty").value,
    });
    event.target.reset();
    render();
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

document.addEventListener("DOMContentLoaded", () => {
  initCommon();
  const page = document.body.dataset.page;
  if (page === "login") initLogin();
  if (page === "dashboard") initDashboard();
  if (page === "exam") initExam();
  if (page === "analytics") initAnalytics();
  if (page === "revision") initRevision();
  if (page === "certificate") initCertificate();
  if (page === "admin") initAdmin();
});
