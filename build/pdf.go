package main

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/go-pdf/fpdf"
)

const (
	pageWidth           = 132.0
	pageHeight          = 222.0
	pageMargin          = 10.0
	bodyFontSize        = 12.0
	unknownFontSize     = 10.0
	superscriptFontSize = 8.0
	bodyLineHeight      = 6.0
	unknownLineHeight   = 5.0
	listIndent          = 5.0
	superscriptRise     = 1.6
	pageNumberFontSize  = 9.0
	pageNumberBottom    = 7.0
)

var inlinePattern = regexp.MustCompile(`<sup>(\d+)</sup>|\*([^*]+)\*`)
var numberedItemPattern = regexp.MustCompile(`^(\d+)\. `)

type wordPage struct {
	pdf        *fpdf.Fpdf
	toLatin    func(string) string
	linkByItem map[int]int
	fontSize   float64
	lineHeight float64
}

func writePDF(words []Word, path string) error {
	pdf := fpdf.NewCustom(&fpdf.InitType{
		UnitStr: "mm",
		Size:    fpdf.SizeType{Wd: pageWidth, Ht: pageHeight},
	})
	pdf.SetMargins(pageMargin, pageMargin, pageMargin)
	pdf.SetAutoPageBreak(false, 0)
	pdf.SetTitle("GRE High-Frequency Wordlist", false)
	pdf.SetFooterFunc(func() {
		pdf.SetY(pageHeight - pageNumberBottom)
		pdf.SetFont("Helvetica", "", pageNumberFontSize)
		pdf.SetTextColor(110, 110, 110)
		pdf.CellFormat(0, 4, strconv.Itoa(pdf.PageNo()), "", 0, "C", false, 0, "")
		pdf.SetTextColor(0, 0, 0)
	})
	toLatin := pdf.UnicodeTranslatorFromDescriptor("")

	var overflowing []error
	for _, word := range words {
		pdf.AddPage()
		page := wordPage{
			pdf:        pdf,
			toLatin:    toLatin,
			linkByItem: map[int]int{},
			fontSize:   bodyFontSize,
			lineHeight: bodyLineHeight,
		}
		page.draw(word.Markdown)
		if pdf.GetY() > pageHeight-pageMargin {
			overflowing = append(overflowing, fmt.Errorf("%s does not fit on one page (y=%.0f)", word.Slug, pdf.GetY()))
		}
	}
	if len(overflowing) > 0 {
		return errors.Join(overflowing...)
	}
	return pdf.OutputFileAndClose(path)
}

func (page *wordPage) draw(markdown string) {
	for _, line := range strings.Split(markdown, "\n") {
		switch {
		case strings.TrimSpace(line) == "":
			page.pdf.Ln(page.lineHeight / 2)
		case strings.HasPrefix(line, "### "):
			page.drawTitle(strings.TrimPrefix(line, "### "))
		case strings.HasPrefix(line, "##### "):
			page.drawUnknownWordsHeading(strings.TrimPrefix(line, "##### "))
		case strings.HasPrefix(line, "#### "):
			page.drawHeading(strings.TrimPrefix(line, "#### "))
		case strings.HasPrefix(line, "- "):
			page.drawListItem("-", strings.TrimPrefix(line, "- "))
		case numberedItemPattern.MatchString(line):
			page.drawNumberedItem(line)
		default:
			page.drawListItem("", line)
		}
	}
}

func (page *wordPage) drawTitle(title string) {
	page.pdf.SetFont("Helvetica", "B", 20)
	page.pdf.MultiCell(0, 9, page.toLatin(title), "", "L", false)
	page.pdf.Ln(2)
}

func (page *wordPage) drawHeading(heading string) {
	page.pdf.SetFont("Helvetica", "B", 15)
	page.pdf.MultiCell(0, 8, page.toLatin(heading), "", "L", false)
}

func (page *wordPage) drawUnknownWordsHeading(heading string) {
	page.fontSize = unknownFontSize
	page.lineHeight = unknownLineHeight
	page.pdf.SetFont("Helvetica", "B", bodyFontSize)
	page.pdf.MultiCell(0, bodyLineHeight, page.toLatin(heading), "", "L", false)
}

func (page *wordPage) drawNumberedItem(line string) {
	numberText, text, _ := strings.Cut(line, ". ")
	number, _ := strconv.Atoi(numberText)
	page.pdf.SetLink(page.linkFor(number), page.pdf.GetY(), -1)
	page.drawListItem(numberText+".", text)
}

func (page *wordPage) drawListItem(marker, text string) {
	page.pdf.SetFont("Helvetica", "", page.fontSize)
	page.pdf.SetX(pageMargin)
	page.pdf.Write(page.lineHeight, marker)
	page.pdf.SetLeftMargin(pageMargin + listIndent)
	page.pdf.SetX(pageMargin + listIndent)
	page.writeInline(page.toLatin(text))
	page.pdf.Ln(page.lineHeight)
	page.pdf.SetLeftMargin(pageMargin)
}

func (page *wordPage) writeInline(text string) {
	previousEnd := 0
	for _, match := range inlinePattern.FindAllStringSubmatchIndex(text, -1) {
		page.writeText(text[previousEnd:match[0]], "")
		if match[2] >= 0 {
			page.writeSuperscript(text[match[2]:match[3]])
		} else {
			page.writeText(text[match[4]:match[5]], "BI")
		}
		previousEnd = match[1]
	}
	page.writeText(text[previousEnd:], "")
}

func (page *wordPage) writeText(text, style string) {
	if text == "" {
		return
	}
	page.pdf.SetFont("Helvetica", style, page.fontSize)
	page.pdf.Write(page.lineHeight, text)
}

func (page *wordPage) writeSuperscript(digits string) {
	number, _ := strconv.Atoi(digits)
	page.pdf.SetFont("Helvetica", "", superscriptFontSize)
	if page.pdf.GetX()+page.pdf.GetStringWidth(digits) > pageWidth-pageMargin {
		page.pdf.Ln(page.lineHeight)
	}
	x, y := page.pdf.GetXY()
	page.pdf.SetXY(x, y-superscriptRise)
	page.pdf.SetTextColor(0, 80, 170)
	page.pdf.WriteLinkID(page.lineHeight, digits, page.linkFor(number))
	page.pdf.SetTextColor(0, 0, 0)
	page.pdf.SetXY(page.pdf.GetX(), y)
}

func (page *wordPage) linkFor(number int) int {
	if _, exists := page.linkByItem[number]; !exists {
		page.linkByItem[number] = page.pdf.AddLink()
	}
	return page.linkByItem[number]
}
