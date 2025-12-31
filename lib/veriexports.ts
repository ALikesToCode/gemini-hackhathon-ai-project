import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { Pack } from "./types";

function wrapText(text: string, maxWidth: number, font: PDFFont, size: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export async function buildPdf(pack: Pack) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();
  const margin = 48;
  let cursorY = height - margin;

  const drawLine = (text: string, size: number, font = regular) => {
    if (cursorY < margin) {
      page = pdfDoc.addPage();
      ({ width, height } = page.getSize());
      cursorY = height - margin;
    }
    page.drawText(text, {
      x: margin,
      y: cursorY,
      size,
      font,
      color: rgb(0.12, 0.12, 0.12)
    });
    cursorY -= size * 1.4;
  };

  const drawParagraph = (text: string, size = 11, font = regular) => {
    const lines = wrapText(text, width - margin * 2, font, size);
    lines.forEach((line) => drawLine(line, size, font));
  };

  drawLine(pack.title, 20, bold);
  drawLine(`Generated: ${new Date(pack.createdAt).toLocaleString()}`, 10, regular);
  drawLine(" ", 8, regular);

  drawLine("Blueprint", 14, bold);
  pack.blueprint.topics.forEach((topic, index) => {
    drawParagraph(
      `${index + 1}. ${topic.title} (Weight ${topic.weight}%)`,
      11,
      regular
    );
  });
  drawLine(" ", 8, regular);

  drawLine("Notes", 14, bold);
  pack.notes.forEach((note) => {
    drawLine(note.lectureTitle, 12, bold);
    drawParagraph(note.summary, 11, regular);
    note.keyTakeaways.forEach((takeaway) => {
      drawParagraph(`• ${takeaway}`, 10, regular);
    });
    if (note.visuals?.length) {
      drawParagraph("Visual references:", 10, bold);
      note.visuals.forEach((visual) => {
        drawParagraph(
          `• [${visual.timestamp}] ${visual.description} (${visual.url})`,
          9,
          regular
        );
      });
    }
    drawLine(" ", 8, regular);
  });

  drawLine("Question Bank", 14, bold);
  pack.questions.forEach((question, index) => {
    drawParagraph(`${index + 1}. ${question.stem}`, 11, bold);
    if (question.options) {
      question.options.forEach((option) => {
        drawParagraph(`(${option.id}) ${option.text}`, 10, regular);
      });
    }
    drawParagraph(`Answer: ${question.answer}`, 10, regular);
    drawLine(" ", 8, regular);
  });

  return pdfDoc.save();
}
