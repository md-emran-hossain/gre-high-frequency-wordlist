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

const railGroups = Array.from(rail.querySelectorAll(".rail-group"));
const railLetters = railGroups.map((group) => group.querySelector(".rail-letter"));
const railLetterByInitial = new Map(railLetters.map((letter) => [letter.textContent, letter]));
let zoomedCenters = null;
const maxZoom = 2.4;
const zoomReachInLetters = 3.5;
const maxLift = 8;
const springStiffness = 420;
const springDamping = 26;
const settleThreshold = 0.001;

const letterMotion = railLetters.map(() => ({
  zoom: { value: 1, velocity: 0, target: 1 },
  shift: { value: 0, velocity: 0, target: 0 },
  lift: { value: 0, velocity: 0, target: 0 },
}));
let animationFrame = null;
let lastFrameTime = 0;

function nearestLetterIndex(pointerY, centers) {
  let nearest = 0;
  centers.forEach((center, index) => {
    if (Math.abs(center - pointerY) < Math.abs(centers[nearest] - pointerY)) {
      nearest = index;
    }
  });
  return nearest;
}

function measureRailCenters() {
  return railGroups.map((group) => {
    const box = group.getBoundingClientRect();
    return box.top + box.height / 2;
  });
}

function aimRailLetters(pointerY) {
  const centers = measureRailCenters();
  const spacing = centers.length > 1 ? centers[1] - centers[0] : 1;
  const reach = spacing * zoomReachInLetters;
  const zooms = centers.map((center) => {
    const distance = Math.abs(center - pointerY);
    const closeness = distance < reach ? (1 + Math.cos((Math.PI * distance) / reach)) / 2 : 0;
    return 1 + (maxZoom - 1) * closeness;
  });

  const railTop = centers[0] - spacing / 2;
  const slotStarts = [];
  let slotEnd = 0;
  zooms.forEach((zoom) => {
    slotStarts.push(slotEnd);
    slotEnd += zoom * spacing;
  });

  const pointerSlots = Math.min(Math.max((pointerY - railTop) / spacing, 0), zooms.length - 1e-6);
  const pointerSlot = Math.floor(pointerSlots);
  const pointerOffset = slotStarts[pointerSlot] + (pointerSlots - pointerSlot) * zooms[pointerSlot] * spacing;
  const anchorShift = pointerSlots * spacing - pointerOffset;

  zoomedCenters = centers.map((center, index) => {
    const zoomedCenter = railTop + anchorShift + slotStarts[index] + (zooms[index] * spacing) / 2;
    letterMotion[index].zoom.target = zooms[index];
    letterMotion[index].shift.target = zoomedCenter - center;
    letterMotion[index].lift.target = ((zooms[index] - 1) / (maxZoom - 1)) * maxLift;
    return zoomedCenter;
  });
  startRailAnimation();
}

function relaxRailLetters() {
  zoomedCenters = null;
  letterMotion.forEach(({ zoom, shift, lift }) => {
    zoom.target = 1;
    shift.target = 0;
    lift.target = 0;
  });
  startRailAnimation();
}

function stepSpring(spring, seconds) {
  const acceleration = (spring.target - spring.value) * springStiffness - spring.velocity * springDamping;
  spring.velocity += acceleration * seconds;
  spring.value += spring.velocity * seconds;
}

function isSettled(spring) {
  return Math.abs(spring.target - spring.value) < settleThreshold && Math.abs(spring.velocity) < settleThreshold;
}

function drawRailLetters(time) {
  const seconds = Math.min((time - lastFrameTime) / 1000, 1 / 30);
  lastFrameTime = time;
  let settled = true;
  railLetters.forEach((letter, index) => {
    const { zoom, shift, lift } = letterMotion[index];
    for (const spring of [zoom, shift, lift]) {
      stepSpring(spring, seconds);
      settled = settled && isSettled(spring);
    }
    letter.style.setProperty("--zoom", zoom.value);
    letter.style.transform = `translate(${-lift.value}px, ${shift.value}px)`;
  });
  if (settled) {
    animationFrame = null;
    if (zoomedCenters === null) {
      railLetters.forEach((letter) => {
        letter.style.removeProperty("--zoom");
        letter.style.removeProperty("transform");
      });
    }
  } else {
    animationFrame = requestAnimationFrame(drawRailLetters);
  }
}

function startRailAnimation() {
  if (animationFrame === null) {
    lastFrameTime = performance.now();
    animationFrame = requestAnimationFrame(drawRailLetters);
  }
}

rail.addEventListener("pointerdown", (event) => aimRailLetters(event.clientY));
rail.addEventListener("pointermove", (event) => aimRailLetters(event.clientY));
rail.addEventListener("pointerleave", relaxRailLetters);
rail.addEventListener("pointercancel", relaxRailLetters);
rail.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "mouse") {
    relaxRailLetters();
  }
});

rail.addEventListener("click", (event) => {
  if (event.detail === 0) {
    return;
  }
  event.preventDefault();
  const nearest = nearestLetterIndex(event.clientY, zoomedCenters ?? measureRailCenters());
  const target = railLetters[nearest].getAttribute("href");
  location.hash = target;
});

const spyOffset = 96;
let sectionTops = [];
let activeInitial = null;
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
  const initial = wordSections[findActiveIndex()].id[0].toUpperCase();
  if (initial === activeInitial) {
    return;
  }
  railLetterByInitial.get(activeInitial)?.classList.remove("active");
  activeInitial = initial;
  railLetterByInitial.get(initial).classList.add("active");
}

function scheduleScrollSpy() {
  if (!spyScheduled) {
    spyScheduled = true;
    requestAnimationFrame(updateScrollSpy);
  }
}

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

const showPageScrollbar = showWhileScrolling(document.documentElement);
window.addEventListener("scroll", showPageScrollbar, { passive: true });
