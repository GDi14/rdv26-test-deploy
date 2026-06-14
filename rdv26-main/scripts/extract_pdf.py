import sys
from pathlib import Path

try:
    from PyPDF2 import PdfReader
except Exception:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
    from PyPDF2 import PdfReader

def main():
    try:
        p = Path(__file__).resolve().parents[1] / 'data' / 'v15.pdf'
        if not p.exists():
            print('PDF not found at', p)
            sys.exit(2)

        # Try PyPDF2 extraction
        reader = PdfReader(str(p))
        out = []
        for page in reader.pages:
            try:
                out.append(page.extract_text() or '')
            except Exception as e:
                print('PyPDF2 page extract error:', e)
                out.append('')

        text = "\n\n".join(out)
        outp = p.with_suffix('.txt')
        outp.write_text(text, encoding='utf-8')
        print('wrote', outp)

        # If text looks garbled, try pdfplumber for alternative extraction
        if len(text) < 100 or any(c in text for c in ['�','�']):
            try:
                import pdfplumber
            except Exception:
                import subprocess
                subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber"])
                import pdfplumber

            alt_out = []
            with pdfplumber.open(str(p)) as pdf:
                for page in pdf.pages:
                    alt_out.append(page.extract_text() or '')
            alt_text = "\n\n".join(alt_out)
            alt_outp = p.with_name(p.stem + '_pdfplumber.txt')
            alt_outp.write_text(alt_text, encoding='utf-8')
            print('wrote', alt_outp)
    except Exception as e:
        print('error during extraction:', e)

if __name__ == '__main__':
    main()
