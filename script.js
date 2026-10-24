const questions = [
  { construct: "PE", text: "Using generative AI could help me prepare clearer or more useful learning materials." },
  { construct: "PE", text: "Generative AI could improve my teaching performance when I verify and adapt its output." },
  { construct: "EE", text: "I could learn the basic steps for using an approved generative AI tool." },
  { construct: "EE", text: "With a worked example and guided practice, creating a useful prompt would be manageable." },
  { construct: "SI", text: "Colleagues whose judgment I respect would support responsible classroom use." },
  { construct: "SI", text: "School leaders would clearly communicate when and how teachers may use generative AI." },
  { construct: "FC", text: "I have reasonable access to the device, electricity, connectivity, and data needed to practise." },
  { construct: "FC", text: "My school could provide policy guidance, training, and a knowledgeable person when difficulties arise." }
];

const responseLabels = ["Strongly disagree", "Disagree", "Not sure", "Agree", "Strongly agree"];
const $ = selector => document.querySelector(selector);

function renderQuestions() {
  $("#questions").innerHTML = questions.map((question, index) => `
    <div class="question-card"><fieldset>
      <legend>${index + 1}. ${question.text} <small>(${question.construct})</small></legend>
      <div class="scale">${responseLabels.map((label, answerIndex) => `
        <label><input type="radio" name="q${index}" value="${answerIndex + 1}" required>
        <span>${answerIndex + 1}. ${label}</span></label>`).join("")}</div>
    </fieldset></div>`).join("");
}

function classify(value) {
  if (value < 2.5) return ["Current barrier", "#b33a3a"];
  if (value < 3.8) return ["Developing", "#c27800"];
  return ["Relative strength", "#087b72"];
}

$("#readinessForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  if (questions.some((_, index) => !data.get(`q${index}`))) {
    alert("Please answer all eight statements.");
    return;
  }
  const sums = { PE: 0, EE: 0, SI: 0, FC: 0 };
  questions.forEach((question, index) => sums[question.construct] += Number(data.get(`q${index}`)));
  const titles = { PE: "Performance expectancy", EE: "Effort expectancy", SI: "Social influence", FC: "Facilitating conditions" };
  $("#results").innerHTML = `<h3>Your readiness profile</h3><div class="profile-grid">${Object.entries(sums).map(([key, sum]) => {
    const value = sum / 2;
    const [label, color] = classify(value);
    return `<article class="profile"><strong>${key}</strong><div class="score">${value.toFixed(1)}/5</div><div class="meter"><span style="width:${value * 20}%;background:${color}"></span></div><small>${titles[key]} • ${label}</small></article>`;
  }).join("")}</div><p>Treat each construct separately. Begin with the lowest area instead of averaging away the problem.</p>`;
  $("#results").hidden = false;
  $("#results").scrollIntoView({ behavior: "smooth", block: "center" });
});

$("#readinessForm").addEventListener("reset", () => { $("#results").hidden = true; });

function updateLab() {
  const solute = $("#solute").value;
  const mass = Number($("#mass").value);
  const water = Number($("#water").value);
  $("#massOut").textContent = mass;
  $("#waterOut").textContent = water;
  const molarMass = solute === "salt" ? 58.44 : 342.30;
  const particleFactor = solute === "salt" ? 2 : 1;
  const temperature = 100 + particleFactor * 0.512 * (mass / molarMass) / (water / 1000);
  $("#boilingResult").textContent = `${temperature.toFixed(2)} °C`;
  $("#observation").textContent = solute === "salt"
    ? "With sodium chloride, the idealized model predicts more dissolved particles and a larger boiling-point increase."
    : "With sucrose, the idealized model predicts fewer dissolved particles per mole than sodium chloride.";
  const count = Math.min(38, Math.round(mass / 2));
  $("#particles").innerHTML = Array.from({ length: count }, (_, index) => `<circle class="particle" cx="${100 + (index * 47) % 160}" cy="${270 - (index * 31) % 92}" r="${solute === "salt" ? 6 : 8}"/>`).join("");
}

["solute", "mass", "water"].forEach(id => $("#" + id).addEventListener("input", updateLab));

$("#copyPrompt").addEventListener("click", async () => {
  const prompt = $("[data-i18n='promptText']").textContent.replace(/[“”]/g, "");
  await navigator.clipboard.writeText(prompt);
  $("#copyStatus").textContent = "Copied.";
  setTimeout(() => { $("#copyStatus").textContent = ""; }, 2000);
});

$("#readPage").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance($("#main").innerText.replace(/\s+/g, " "));
  utterance.lang = "en-NG";
  window.speechSynthesis.speak(utterance);
});

$("#stopAudio").addEventListener("click", () => window.speechSynthesis?.cancel());

renderQuestions();
updateLab();
