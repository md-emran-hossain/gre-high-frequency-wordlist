# Rules

Project name: `gre-high-frequency-wordlist`.

## Goal
Learn the GRE high-frequency words from a phone. Every word has its own `.md` file. The files become one PDF (Phase 1) and one static website (Phase 2).

## Keep it dumb
- Nothing smart. Smart things are hard to maintain.
- Word files live in the `words/` folder, one per word, no sub-folders.
- File name is the lowercase word: `abate.md`. No numbers. Alphabetical order is the order.
- If the same word has two entries in the PDF (like `strut`), they share one file.

## Word file format
```
### Levee (n./v.)
#### Meaning:
- A raised embankment<sup>1</sup> beside a river that stops floods.
- (v.) To build a levee along a river.

#### Example:
- The *levee* held, and the town stayed dry during the storm.
- (v.) The farmers *leveed* the riverbank before the rainy season.

##### Unknown words:
1. Embankment - A raised bank of earth or stone.
```

Structure
- The `##### Unknown words:` block (five hashes: the build finds it by heading level) is last, after the examples. It is left out when a word has no unknown words. It is never mixed into the meaning list.
- Bullets start at the left edge. A four-space indent would show as a code block on GitHub and on the website.
- Heading has every part of speech the word is used as (`n.`, `v.`, `adj.`, `adv.`).
- One word must fit on one PDF page. Keep files short.
- Typos are fixed, but old quoted text is left as written.

Meanings
- Written in our own words. Wiktionary may be used with attribution (CC BY-SA). Nothing is copied from Google or Oxford.
- The PDF meaning is a hint, not the truth. Meanings are checked against Wiktionary.
- Short and plain. Usage notes do not go in the meaning list. Show them with an example instead.
- Part-of-speech labels `(n.)`, `(v.)`, `(adj.)`, `(adv.)` are used only when the meanings cover more than one part of speech. A word with one part of speech has none, because the heading already says it. A field label like `(law)` or `(medicine)` can stand in the label's place when a meaning belongs to one field.

Examples
- Practical and real-world: something a person could really read or say.
- Every meaning has at least one example, in the same order as the meanings.
- An example is in the same context as its meaning (the same kind of situation), but it is never the same sentence.
- An example carries the same label as its meaning, if the meaning has one.
- Mark the word with `*word*`. Inflected forms like `*abated*` are fine.
- At most two examples per meaning, and no more than eight in total.

Unknown words
- A word goes in the list only if a learner is unlikely to know it: formal, legal, scientific, old or rare words. Everyday words stay out.
- Each unknown word has a number. The number is its place in the list.
- The word is marked with `<sup>N</sup>` right after it, every time it appears in a meaning or an example. The same word always has the same number.
- The headword itself is never marked. Words inside the unknown list are not marked.
- One short line each, in our own words. An example goes inside the line, like `(ex: memory lapse)`.
- Lines the user wrote or added are never deleted or reworded.

## PDF
- One page per word, large text, wide text area, white space is fine.
- Unknown-word numbers are small raised numbers that link to the entry on the same page. The Unknown words block uses a smaller font.
- The page number is at the bottom middle of every page.
- A word never takes more than one page. The build fails if it does.
- The whole PDF is rebuilt every time. Name is always `gre-high-frequency-wordlist.pdf`.

## Website
- Static HTML built from the same `.md` files.
- No CSS library. Only the CSS rules the page uses.
- Fixed max content width, adaptable text size.
- Top: search bar and, at the far right, a round icon-only theme button. One click cycles system, light, dark (default system) with a slide animation. The choice is saved in local storage. Icons are our own inline SVG.
- Search: typing opens a short list under the box, name matches first, then meaning matches, each with its first meaning. Tap or Enter jumps to the word. Esc or the gray clear icon closes it. Nothing on the page is hidden.
- Right side: one letter per first letter (A to Z). Hover or tap a letter to list its words, then pick one. It works the same on touch devices.
- Unknown-word numbers are small raised links to the entry. The Unknown words block uses a smaller font.
- Scrollbars have no track. In the word list and search results the thumb is drawn over the content (it takes no space) and shows only while scrolling. The page keeps its normal scrollbar, which shows while scrolling or hovering.
- Scroll spy: the letter of the word in view and the word itself are highlighted in the rail, using the hover colors.
- No lines between words. Spacing separates them, with a large gap after each word: most elements have bottom spacing only, boxes may have padding on all sides.
- Spacing numbers (padding, margin, gap, sizes) are steps of 4: 4, 8, 12, 16, 24, 32, 40, 64.
- Bottom: one short footer line with the copyright, a "free to copy" text and the repository link with an SVG icon. "Download as PDF" is fixed at the bottom left so it is always visible.
- Small screens (900px and below): the download button sits at the bottom right, left of the rail. It slides up on load, then after about 3 seconds collapses to a round icon-only button. With reduced motion it is the round icon straight away.

## Build and publish
- `go run ./build` makes `site/index.html` and `site/gre-high-frequency-wordlist.pdf`. It works on any machine with Go, no GitHub needed.
- `site/` is not committed. GitHub Actions builds it on every push to `main` and publishes it with GitHub Pages, so the PDF keeps the same name and git history does not grow.
- If GitHub Actions is ever unavailable, build locally and publish `site/` by hand.

## Code
- Go for the build tool. Vanilla JavaScript, no library.
- Idiomatic and human readable. No unnecessary comments. Names explain themselves.
- Low memory.

## Licence
- Code: MIT. Word content: CC BY-SA 4.0 (Wiktionary is CC BY-SA).

## Working together
- Work is kept in a `TASKS.md` task list, created when needed and deleted when done. When told "go", finish all tasks without asking in between.
- If something new is asked that is not in these rules, ask whether to add it here.
