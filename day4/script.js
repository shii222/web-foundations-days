const noteText = document.getElementById("noteText");
const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeBtn");

function updateCounts() {
  const text = noteText.value;

  const characters = text.length;

  const trimmedText = text.trim();
  const words = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;

  charCount.textContent = `${characters} / 200 characters`;
  wordCount.textContent = `${words} words`;

  charCount.classList.remove("warning", "danger");

  if (characters >= 190) {
    charCount.classList.add("danger");
  } else if (characters >= 160) {
    charCount.classList.add("warning");
  }
}

// Restore the saved draft
const savedDraft = localStorage.getItem("draft");

if (savedDraft !== null) {
  noteText.value = savedDraft;
}

// Update the counters when the page loads
updateCounts();

// Update counters and save the draft whenever the user types
noteText.addEventListener("input", function () {
  updateCounts();

  localStorage.setItem("draft", noteText.value);
});

function clearNote() {
  noteText.value = "";
  localStorage.removeItem("draft");
  updateCounts();
}

clearBtn.addEventListener("click", clearNote);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearNote();
  }
});
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "Light Mode";
}
themeBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    themeBtn.textContent = "Light Mode";
  } else {
    localStorage.setItem("theme", "light");
    themeBtn.textContent = "Dark Mode";
  }
});
