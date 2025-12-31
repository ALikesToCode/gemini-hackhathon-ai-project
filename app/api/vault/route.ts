import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { setVaultDoc } from "../../../lib/store";
import { makeId } from "../../../lib/utils";
import { VaultDoc } from "../../../lib/types";

const MAX_CHARS = 20000;

export const runtime = "nodejs";

function truncate(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_CHARS) return clean;
  return `${clean.slice(0, MAX_CHARS)}…`;
}

async function extractText(file: File) {
  const name = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(Buffer.from(arrayBuffer));
    return truncate(data.text ?? "");
  }

  const decoder = new TextDecoder("utf-8");
  return truncate(decoder.decode(arrayBuffer));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files");

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const docs: Array<{ id: string; name: string; chars: number }> = [];

  for (const entry of files) {
    if (!(entry instanceof File)) {
      continue;
    }
    let content = "";
    try {
      content = await extractText(entry);
    } catch {
      content = "Extraction failed. Please upload a readable PDF or TXT file.";
    }
    const doc: VaultDoc = {
      id: makeId("vault"),
      name: entry.name,
      content,
      createdAt: new Date().toISOString()
    };
    await setVaultDoc(doc);
    docs.push({ id: doc.id, name: doc.name, chars: doc.content.length });
  }

  return NextResponse.json({ docs });
}
