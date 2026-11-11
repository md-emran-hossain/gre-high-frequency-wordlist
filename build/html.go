package main

import (
	"bytes"
	_ "embed"
	"fmt"
	"html/template"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/renderer/html"
)

const (
	repositoryURL            = "https://github.com/md-emran-hossain/gre-high-frequency-wordlist"
	unknownWordsHeadingStart = "<h5>"
)

var (
	markdownConverter = goldmark.New(goldmark.WithRendererOptions(html.WithUnsafe()))
	superscriptNumber = regexp.MustCompile(`<sup>(\d+)</sup>`)
	listItemStart     = regexp.MustCompile(`<li>`)
)

//go:embed assets/page.html
var pageTemplate string

//go:embed assets/style.css
var stylesheet string

//go:embed assets/theme.js
var themeScript string

//go:embed assets/page.js
var pageScript string

type wordSection struct {
	Slug string
	Name string
	HTML template.HTML
}

type letterGroup struct {
	Letter string
	Words  []wordSection
}

type pageData struct {
	Year          int
	RepositoryURL string
	Letters       []letterGroup
	Stylesheet    template.CSS
	ThemeScript   template.JS
	PageScript    template.JS
}

func writeSite(words []Word, path string) error {
	sections, err := renderSections(words)
	if err != nil {
		return err
	}

	page, err := template.New("page").Parse(pageTemplate)
	if err != nil {
		return err
	}

	var output bytes.Buffer
	err = page.Execute(&output, pageData{
		Year:          time.Now().Year(),
		RepositoryURL: repositoryURL,
		Letters:       groupByLetter(sections),
		Stylesheet:    template.CSS(stylesheet),
		ThemeScript:   template.JS(themeScript),
		PageScript:    template.JS(pageScript),
	})
	if err != nil {
		return err
	}
	return os.WriteFile(path, output.Bytes(), 0o644)
}

func renderSections(words []Word) ([]wordSection, error) {
	sections := make([]wordSection, 0, len(words))
	for _, word := range words {
		var converted bytes.Buffer
		if err := markdownConverter.Convert([]byte(word.Markdown), &converted); err != nil {
			return nil, fmt.Errorf("%s: %w", word.Slug, err)
		}
		sections = append(sections, wordSection{
			Slug: word.Slug,
			Name: strings.Fields(word.Title)[0],
			HTML: template.HTML(linkUnknownWords(word.Slug, converted.String())),
		})
	}
	return sections, nil
}

func groupByLetter(sections []wordSection) []letterGroup {
	var groups []letterGroup
	for _, section := range sections {
		letter := strings.ToUpper(section.Slug[:1])
		if len(groups) == 0 || groups[len(groups)-1].Letter != letter {
			groups = append(groups, letterGroup{Letter: letter})
		}
		last := &groups[len(groups)-1]
		last.Words = append(last.Words, section)
	}
	return groups
}

func linkUnknownWords(slug, wordHTML string) string {
	meaningAndExamples, unknownWords, hasUnknownWords := strings.Cut(wordHTML, unknownWordsHeadingStart)
	link := fmt.Sprintf(`<sup><a href="#%s-unknown-$1">$1</a></sup>`, slug)
	meaningAndExamples = superscriptNumber.ReplaceAllString(meaningAndExamples, link)
	if !hasUnknownWords {
		return meaningAndExamples
	}

	itemNumber := 0
	unknownWords = listItemStart.ReplaceAllStringFunc(unknownWords, func(string) string {
		itemNumber++
		return fmt.Sprintf(`<li id="%s-unknown-%d">`, slug, itemNumber)
	})
	return meaningAndExamples + `<div class="unknown-words">` + unknownWordsHeadingStart + unknownWords + `</div>`
}
