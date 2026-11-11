package main

import (
	"fmt"
	"os"
	"path/filepath"
)

const outputDirectory = "site"

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run() error {
	words, err := loadWords("words")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(outputDirectory, 0o755); err != nil {
		return err
	}
	if err := writePDF(words, filepath.Join(outputDirectory, "gre-high-frequency-wordlist.pdf")); err != nil {
		return err
	}
	return writeSite(words, filepath.Join(outputDirectory, "index.html"))
}
