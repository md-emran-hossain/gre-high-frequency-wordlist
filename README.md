# GRE High-Frequency Wordlist

The 333 high-frequency GRE words, each with every part of speech, clear meanings, and examples. Built to read on a phone.

- Website: one static page, minimal-style, with search, a dark theme, and a PDF download.
- PDF: one word per page, large text.
- Free and open. Copy it, fork it, make your own list.

## Requirements
Go. The first `go run ./build` downloads two small packages once into Go's shared cache (not into this folder): `go-pdf/fpdf` draws the PDF and `goldmark` turns Markdown into HTML. `go.mod` and `go.sum` pin their versions. There is no `node_modules` folder.

## How it works
Every word is one Markdown file in [words/](words), like [abate.md](words/abate.md). One Go program turns all of them into the PDF and the website.

```
go run ./build
```

The result is in the `site/` folder: `index.html` and `gre-high-frequency-wordlist.pdf`. Every push to `main` builds and publishes it with GitHub Actions and GitHub Pages.

## Add or fix a word
Read [CONTRIBUTING.md](CONTRIBUTING.md) and [RULES.md](RULES.md).

## Licence
- Code: [MIT](LICENSE)
- Word content: [CC BY-SA 4.0](LICENSE-CONTENT). Parts of the wording follow [Wiktionary](https://en.wiktionary.org), which is CC BY-SA.

The word list itself comes from a Barron's GRE high-frequency list. This project is not affiliated with Barron's.
