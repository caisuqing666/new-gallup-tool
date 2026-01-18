#!/usr/bin/env python3
import sys


def _load_reader():
    try:
        from pypdf import PdfReader  # type: ignore
        return PdfReader
    except Exception:
        try:
            from PyPDF2 import PdfReader  # type: ignore
            return PdfReader
        except Exception:
            return None


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: scripts/extract-pdf-text.py <pdf_path>", file=sys.stderr)
        return 2

    reader_cls = _load_reader()
    if reader_cls is None:
        print("Missing dependency: install 'pypdf' (or PyPDF2) to extract PDF text.", file=sys.stderr)
        return 1

    pdf_path = sys.argv[1]
    try:
        reader = reader_cls(pdf_path)
    except Exception as exc:
        print(f"Failed to open PDF: {exc}", file=sys.stderr)
        return 1

    parts = []
    for page in reader.pages:
        text = page.extract_text() or ""
        if text.strip():
            parts.append(text.strip())

    sys.stdout.write("\n\n".join(parts))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
