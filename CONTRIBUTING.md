# Contributing

Thank you for helping. This project is intentionally small and plain, so contributing is easy.

## Fix or add a word
1. Fork the repository.
2. Edit or add a `.md` file in the `words/` folder. The file name is the lowercase word, for example `abate.md`.
3. Follow the format in [RULES.md](RULES.md).
4. Run `go run ./build`. It must finish without an error. This also checks that the word fits on one PDF page.
5. Open a pull request.

## Rules for meanings
- Write meanings in your own words.
- Do not copy from Google or Oxford.
- You may use Wiktionary wording. It is CC BY-SA, so the word content stays CC BY-SA 4.0.
- Explain every hard word you use.

## Change the build tool or the site
- Keep it simple. A smart solution is a harder one to maintain.
- Go standard library first. No CSS library. No JavaScript library.
- Code should read like plain English. Names explain themselves, and comments are rare.

## Licence
By contributing you agree that code is released under the MIT licence and word content under CC BY-SA 4.0.
