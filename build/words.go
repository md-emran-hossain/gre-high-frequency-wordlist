package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Word struct {
	Slug     string
	Title    string
	Markdown string
}

func loadWords(directory string) ([]Word, error) {
	paths, err := filepath.Glob(filepath.Join(directory, "*.md"))
	if err != nil {
		return nil, err
	}

	var words []Word
	for _, path := range paths {
		content, err := os.ReadFile(path)
		if err != nil {
			return nil, err
		}
		markdown := string(content)
		firstLine, _, _ := strings.Cut(markdown, "\n")
		words = append(words, Word{
			Slug:     strings.TrimSuffix(filepath.Base(path), ".md"),
			Title:    strings.TrimPrefix(firstLine, "### "),
			Markdown: markdown,
		})
	}
	if len(words) == 0 {
		return nil, fmt.Errorf("no word files found in %s", directory)
	}
	return words, nil
}
