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

  // Remove old character-limit states
  charCount.classList.remove("warning", "over");

  // More than 200 characters
  if (characters > 200) {
    charCount.classList.add("over");

  // More than 180 characters
  } else if (characters > 180) {
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


// Clear the note when Escape is pressed
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearNote();
  }
});


// Restore saved theme
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "Light Mode";
}


// Change between dark and light mode
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