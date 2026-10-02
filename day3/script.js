let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  return notes.filter(function (note) {
    return note.text.toLowerCase().includes(word.toLowerCase());
  });
}
console.log(searchNotes("milk")); // Expected: note containing "Buy milk and bread"

console.log(searchNotes("pizza")); // Expected: []

function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (let note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }

  return longest;
}

console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

let savedNotes = notes;
notes = [];
console.log(longestNote()); // Expected: null
notes = savedNotes;

function countByCategory() {
  let counts = {};

  for (let note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }

  return counts;
}

console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

let originalNotes = notes;
notes = [];
console.log(countByCategory()); // Expected: {}
notes = originalNotes;

function getSummary() {
  let counts = countByCategory();
  let noteWord = notes.length === 1 ? "note" : "notes";

  return `${notes.length} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

let summarySavedNotes = notes;
notes = [notes[0]];

console.log(getSummary());
// Expected: "1 note: 1 personal, 0 work, 0 study."

notes = summarySavedNotes;

function isDuplicate(text) {
  let cleanText = text.trim().toLowerCase();

  return notes.some(function (note) {
    return note.text.trim().toLowerCase() === cleanText;
  });
}

console.log(isDuplicate("  BUY MILK AND BREAD  "));
// Expected: true

console.log(isDuplicate("Walk the dog"));
// Expected: false

function addNote(text, category) {
  let cleanText = text.trim();
  let validCategories = ["personal", "work", "study"];

  if (cleanText.length < 1 || cleanText.length > 200) {
    console.log("Note must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(cleanText)) {
    console.log("This note already exists.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Invalid category.");
    return false;
  }

  let newId = notes.length + 1;

  notes.push({
    id: newId,
    text: cleanText,
    category: category
  });

  return true;
}

console.log(addNote("Plan weekend", "personal"));
// Expected: true

console.log(addNote("Buy milk and bread", "personal"));
// Expected: false because it is a duplicate

