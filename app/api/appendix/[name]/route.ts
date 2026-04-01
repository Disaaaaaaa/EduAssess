import path from "node:path";
import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";

const APPENDIX_FILES = {
  a: { fileName: "Appendix A.docx", downloadName: "Appendix-A.docx" },
  b: { fileName: "Appendix B .docx", downloadName: "Appendix-B.docx" },
} as const;

export async function GET(
  _request: Request,
  { params }: { params: { name: string } }
) {
  const appendix = APPENDIX_FILES[params.name as keyof typeof APPENDIX_FILES];

  if (!appendix) {
    return NextResponse.json({ error: "Appendix not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), appendix.fileName);

  try {
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `inline; filename="${appendix.downloadName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Appendix file is missing" },
      { status: 404 }
    );
  }
}
