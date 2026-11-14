const questions = [
  { construct: "PE", text: "Using generative AI could help me prepare clearer or more useful learning materials." },
  { construct: "PE", text: "Generative AI could improve my teaching performance when I verify and adapt its output." },
  { construct: "EE", text: "With a worked example and guided practice, I could learn the basic steps for using an approved generative AI tool." },
  { construct: "EE", text: "With a worked example and guided practice, creating a useful prompt would be manageable." },
  { construct: "SI", text: "Colleagues whose judgment I respect would support responsible classroom use." },
  { construct: "SI", text: "School leaders would clearly communicate when and how teachers may use generative AI." },
  { construct: "FC", barrier: "device", text: "I can access a suitable device when I need to practise." },
  { construct: "FC", barrier: "electricity", text: "I have sufficiently reliable electricity for planned use." },
  { construct: "FC", barrier: "connectivity", text: "I can access a sufficiently reliable internet connection when needed." },
  { construct: "FC", barrier: "data", text: "The data required for appropriate use is affordable for me." },
  { construct: "FC", barrier: "policy", text: "My school could provide policy guidance, training, and a knowledgeable person when difficulties arise." }
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
  $("#printQuestionList").innerHTML = questions.map(question =>
    `<li><span>${question.text} <strong>(${question.construct})</strong></span><span class="paper-scale">1 &nbsp; 2 &nbsp; 3 &nbsp; 4 &nbsp; 5</span></li>`
  ).join("");
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
    alert("Please answer every statement.");
    return;
  }
  const sums = { PE: 0, EE: 0, SI: 0, FC: 0 };
  const counts = { PE: 0, EE: 0, SI: 0, FC: 0 };
  questions.forEach((question, index) => sums[question.construct] += Number(data.get(`q${index}`)));
  questions.forEach(question => counts[question.construct] += 1);
  const titles = { PE: "Performance expectancy", EE: "Effort expectancy", SI: "Social influence", FC: "Facilitating conditions" };
  const scores = Object.fromEntries(Object.entries(sums).map(([key, sum]) => [key, sum / counts[key]]));
  const ranked = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const priorityKeys = ranked.slice(0, 2).map(([key]) => key);
  const recommendations = getRecommendations(priorityKeys, data);
  $("#results").innerHTML = `<h3 tabindex="-1">Your readiness profile</h3><div class="profile-grid">${Object.entries(scores).map(([key, value]) => {
    const [label, color] = classify(value);
    return `<article class="profile"><strong>${key}</strong><div class="score">${value.toFixed(1)}/5</div><div class="meter"><span style="width:${value * 20}%;background:${color}"></span></div><small>${titles[key]} • ${label}</small></article>`;
  }).join("")}</div>
    <p>Treat each construct separately. Begin with the lowest area instead of averaging away the problem.</p>
    <section class="next-steps" aria-labelledby="nextStepsTitle"><h4 id="nextStepsTitle">Your recommended next steps</h4><ol>${recommendations.map(item => `<li>${item}</li>`).join("")}</ol></section>`;
  $("#results").hidden = false;
  $("#results h3").focus();
  $("#results").scrollIntoView({ behavior: "smooth", block: "center" });
  const lowestKey = ranked[0][0];
  const barrierMap = { PE: "value", EE: "effort", SI: "support", FC: getLowestAccessBarrier(data) };
  $("#barrierSelect").value = barrierMap[lowestKey];
});

$("#readinessForm").addEventListener("reset", () => { $("#results").hidden = true; });

const matchedPlans = {
  value: ["Compare one authentic planning task with the current method and judge quality as well as time.", "teacher + subject lead", "Does the verified output improve one lesson without reducing quality?"],
  effort: ["Use one short prompt template, a worked example, and guided practice before independent use.", "teacher + GenAI coordinator", "Can the teacher complete the process with fewer prompts for help?"],
  support: ["Invite a respected teacher and school leader to model one approved use and discuss concerns openly.", "teacher + opinion leader + school lead", "Are expectations clearer, and is one voluntary pilot agreed?"],
  device: ["Schedule shared-device access or provide an approved school device for a bounded practice task.", "school lead + ICT coordinator", "Can the teacher complete one practice task on an available device?"],
  electricity: ["Provide an offline worked example and schedule practice during a reliable power period or with backup power.", "teacher + school lead", "Can the teacher complete one practice task despite the power constraint?"],
  connectivity: ["Use low-bandwidth text examples, download materials in advance, and schedule shared connectivity when needed.", "teacher + ICT coordinator", "Can the teacher access, prepare, and verify one example with the available connection?"],
  data: ["Provide a printed worked example and a shared-access plan so individual teachers do not carry the data cost.", "teacher + school lead", "Can the teacher prepare and verify one useful example without buying additional data?"],
  policy: ["Clarify one approved use, one prohibited use, the verification process, and a named route for help.", "school lead + GenAI coordinator", "Can the teacher describe the boundary and identify who to contact?"],
};

function getLowestAccessBarrier(data) {
  const accessItems = questions.map((q, index) => ({ ...q, index })).filter(q => q.barrier);
  return accessItems.sort((a, b) => Number(data.get(`q${a.index}`)) - Number(data.get(`q${b.index}`)))[0]?.barrier || "policy";
}

function getRecommendations(priorityKeys, data) {
  const keyToBarrier = { PE: "value", EE: "effort", SI: "support", FC: getLowestAccessBarrier(data) };
  const actions = priorityKeys.map(key => matchedPlans[keyToBarrier[key]][0]);
  actions.push("After four weeks, check one observable change before deciding to continue, adapt, support further, or discontinue the tool.");
  return actions.slice(0, 3);
}

$("#suggestPlan").addEventListener("click", () => {
  const barrier = $("#barrierSelect").value;
  if (!barrier) {
    $("#barrierSelect").focus();
    return;
  }
  const [action, helper, evidence] = matchedPlans[barrier];
  $("#actionInput").value = action;
  $("#helperInput").value = helper;
  $("#evidenceInput").value = evidence;
});

$("#printIndividual").addEventListener("click", () => {
  document.body.dataset.printMode = "individual";
  window.print();
  delete document.body.dataset.printMode;
});

$("#printGroup").addEventListener("click", () => {
  document.body.dataset.printMode = "group";
  window.print();
  delete document.body.dataset.printMode;
});

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
  const fillBottom = 319;
  const fillTop = 285 - ((water - 100) / 900) * 160;
  $("#waterShape").setAttribute("y", fillTop.toFixed(1));
  $("#waterShape").setAttribute("height", (fillBottom - fillTop).toFixed(1));

  const count = Math.min(38, Math.round(mass / 2));
  const particleRange = Math.max(20, 300 - fillTop);
  $("#particles").innerHTML = Array.from({ length: count }, (_, index) =>
    `<circle class="particle" cx="${100 + (index * 47) % 160}" cy="${fillTop + 10 + (index * 31) % particleRange}" r="${solute === "salt" ? 6 : 8}"/>`
  ).join("");
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
