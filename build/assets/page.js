const themes = ["system", "light", "dark"];
const themeButton = document.getElementById("theme");
const searchInput = document.getElementById("search");
const clearButton = document.getElementById("search-clear");
const resultsList = document.getElementById("results");
const wordSections = document.querySelectorAll("section.word");
const rail = document.querySelector(".rail");

const words = Array.from(wordSections, (section) => ({
  slug: section.id,
  name: section.querySelector("h3").textContent.split(" ")[0],
  firstMeaning: section.querySelector("li").textContent.trim(),
  text: section.textContent.toLowerCase(),
}));

function showTheme(theme) {
  themeButton.style.setProperty("--theme-index", themes.indexOf(theme));
  themeButton.setAttribute("aria-label", `Theme: ${theme}. Click to change.`);
  themeButton.title = `Theme: ${theme}`;
}

themeButton.addEventListener("click", () => {
  themeButton.classList.add("animated");
  const nextTheme = themes[(themes.indexOf(readSavedTheme()) + 1) % themes.length];
  saveTheme(nextTheme);
  applyTheme(nextTheme);
  showTheme(nextTheme);
});

showTheme(readSavedTheme());

function findWords(query) {
  const nameStartsWith = words.filter((word) => word.name.toLowerCase().startsWith(query));
  const nameContains = words.filter((word) => !nameStartsWith.includes(word) && word.name.toLowerCase().includes(query));
  const textContains = words.filter((word) => !nameStartsWith.includes(word) && !nameContains.includes(word) && word.text.includes(query));
  return [...nameStartsWith, ...nameContains, ...textContains];
}

function showResults(matches) {
  resultsList.replaceChildren();
  if (matches.length === 0) {
    const item = document.createElement("li");
    item.className = "no-results";
    item.textContent = "No word found.";
    resultsList.append(item);
  }
  for (const word of matches) {
    const item = document.createElement("li");
    item.setAttribute("role", "option");
    const link = document.createElement("a");
    link.href = `#${word.slug}`;
    const name = document.createElement("strong");
    name.textContent = word.name;
    const meaning = document.createElement("span");
    meaning.textContent = word.firstMeaning;
    link.append(name, meaning);
    item.append(link);
    resultsList.append(item);
  }
  setResultsOpen(true);
}

function setResultsOpen(isOpen) {
  resultsList.hidden = !isOpen;
  searchInput.setAttribute("aria-expanded", isOpen);
}

function clearSearch() {
  searchInput.value = "";
  clearButton.hidden = true;
  setResultsOpen(false);
}

function moveActiveResult(step) {
  const links = Array.from(resultsList.querySelectorAll("a"));
  const activeIndex = links.indexOf(document.activeElement);
  const nextIndex = activeIndex + step;
  if (nextIndex < 0) {
    searchInput.focus();
  } else if (nextIndex < links.length) {
    links[nextIndex].focus();
  }
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  clearButton.hidden = searchInput.value === "";
  if (query === "") {
    setResultsOpen(false);
  } else {
    showResults(findWords(query));
  }
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    resultsList.querySelector("a")?.click();
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    moveActiveResult(1);
  } else if (event.key === "Escape") {
    clearSearch();
  }
});

resultsList.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    moveActiveResult(event.key === "ArrowDown" ? 1 : -1);
  } else if (event.key === "Escape") {
    clearSearch();
    searchInput.focus();
  }
});

resultsList.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    clearSearch();
  }
});

clearButton.addEventListener("click", () => {
  clearSearch();
  searchInput.focus();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-box")) {
    setResultsOpen(false);
  }
});

rail.addEventListener("click", (event) => {
  if (event.target.closest(".rail-words")) {
    event.target.blur();
  }
});

const railGroups = Array.from(rail.querySelectorAll(".rail-group"));
const railLetters = railGroups.map((group) => group.querySelector(".rail-letter"));
const railWordLinks = new Map(
  Array.from(rail.querySelectorAll(".rail-words a"), (link) => [link.getAttribute("href").slice(1), link]),
);
const spyOffset = 96;
let sectionTops = [];
let activeSlug = null;
let spyScheduled = false;

function measureSections() {
  sectionTops = Array.from(wordSections, (section) => section.offsetTop);
}

function findActiveIndex() {
  const position = window.scrollY + spyOffset;
  let low = 0;
  let high = sectionTops.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (sectionTops[middle] <= position) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  return low;
}

function updateScrollSpy() {
  spyScheduled = false;
  const slug = wordSections[findActiveIndex()].id;
  if (slug === activeSlug) {
    return;
  }
  railWordLinks.get(activeSlug)?.classList.remove("active");
  railLetters.forEach((letter) => letter.classList.remove("active"));

  activeSlug = slug;
  const activeLink = railWordLinks.get(slug);
  activeLink.classList.add("active");
  activeLink.closest(".rail-group").querySelector(".rail-letter").classList.add("active");
}

function scrollActiveWordIntoView(group) {
  const list = group.querySelector(".rail-words");
  const activeLink = list.querySelector("a.active");
  if (activeLink) {
    list.scrollTop = activeLink.offsetTop - list.clientHeight / 2;
  }
}

function scheduleScrollSpy() {
  if (!spyScheduled) {
    spyScheduled = true;
    requestAnimationFrame(updateScrollSpy);
  }
}

railGroups.forEach((group) => {
  group.addEventListener("mouseenter", () => scrollActiveWordIntoView(group));
  group.addEventListener("focusin", () => scrollActiveWordIntoView(group));
});

window.addEventListener("scroll", scheduleScrollSpy, { passive: true });
window.addEventListener("resize", () => {
  measureSections();
  scheduleScrollSpy();
});
window.addEventListener("load", () => {
  measureSections();
  updateScrollSpy();
});
measureSections();
updateScrollSpy();

const scrollbarHideDelay = 800;
const minimumThumbHeight = 24;

function showWhileScrolling(element) {
  let hideTimer;
  return () => {
    if (!element.classList.contains("scrolling")) {
      element.classList.add("scrolling");
    }
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => element.classList.remove("scrolling"), scrollbarHideDelay);
  };
}

function drawScrollThumb(scroller) {
  const overflow = scroller.scrollHeight - scroller.clientHeight;
  if (overflow <= 0) {
    return;
  }
  const thumbHeight = Math.max(minimumThumbHeight, scroller.clientHeight ** 2 / scroller.scrollHeight);
  const thumbTravel = scroller.clientHeight - thumbHeight;
  scroller.style.setProperty("--thumb-height", `${thumbHeight}px`);
  scroller.style.setProperty("--thumb-top", `${(scroller.scrollTop / overflow) * thumbTravel}px`);
}

function trackScrollbar(scroller) {
  const showScrollbar = showWhileScrolling(scroller);
  let drawScheduled = false;
  scroller.addEventListener("scroll", () => {
    showScrollbar();
    if (!drawScheduled) {
      drawScheduled = true;
      requestAnimationFrame(() => {
        drawScheduled = false;
        drawScrollThumb(scroller);
      });
    }
  });
}

trackScrollbar(resultsList);
rail.querySelectorAll(".rail-words").forEach(trackScrollbar);

const showPageScrollbar = showWhileScrolling(document.documentElement);
window.addEventListener("scroll", showPageScrollbar, { passive: true });
