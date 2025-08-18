# app.py
# Streamlit app: Image -> CSV for Vehicle Clearance
# - Safe with/without Tesseract on Streamlit Cloud
# - Editable table
# - Download CSV
# - Download single-file Tailwind HTML that contains the CSV + button

import io
import re
import shutil
import base64
import numpy as np
import pandas as pd
from PIL import Image
import streamlit as st

# ---------- App config ----------
st.set_page_config(
    page_title="Image → CSV (Vehicle Clearance)",
    page_icon="📄",
    layout="centered",
)

st.title("📄 Image → CSV (Vehicle Clearance)")
st.caption(
    "Upload your clearance image, optionally run OCR, edit rows if needed, "
    "then download CSV or a self-contained Tailwind HTML that downloads the CSV."
)

DEFAULT_COLUMNS = ["Type", "Code", "Number", "Suffix", "Date", "Location"]

# ---------- Tesseract detection ----------
TESSERACT_PATH = shutil.which("tesseract")
TESS_PRESENT = TESSERACT_PATH is not None

# Lazy import wrappers so the app still works without these libs present
def _lazy_import_pytesseract():
    try:
        import pytesseract
        if TESS_PRESENT:
            # explicitly set path if Cloud provides it
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
        return pytesseract
    except Exception:
        return None

def _prep_image_for_ocr(img: Image.Image) -> Image.Image:
    """Light preprocessing to help OCR."""
    gray = img.convert("L")
    arr = np.array(gray)
    # simple local contrast bump
    arr = np.clip((arr - arr.mean()) * 1.2 + arr.mean(), 0, 255).astype(np.uint8)
    return Image.fromarray(arr)

# ---------- OCR + parsing ----------
def image_to_text(img: Image.Image) -> str:
    """
    Try OCR via pytesseract. If unavailable or fails, return "" and show a friendly note.
    """
    pytesseract = _lazy_import_pytesseract()
    if pytesseract is None or not TESS_PRESENT:
        st.info(
            "OCR is unavailable on this host (Tesseract not found). "
            "You can still enter or paste rows manually below."
        )
        return ""

    try:
        proc = _prep_image_for_ocr(img)
        text = pytesseract.image_to_string(proc, lang="eng")
        return text
    except Exception:
        st.warning(
            "OCR failed while processing this image. "
            "You can switch OCR off and enter rows manually."
        )
        return ""

def parse_ocr_text_to_rows(text: str):
    """
    Heuristic parser for lines like:
    [Type?] (DOC|OC) CODE NUMBER SUFFIX DATE LOCATION
    """
    rows = []
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in text.splitlines() if ln.strip()]
    # Regex with optional Type (capital words/spaces)
    pat = re.compile(
        r"^(?:(?P<type>[A-Z][A-Z ]{1,})\s+)?"
        r"(?P<doctype>DOC|OC)\s+"
        r"(?P<code>[A-Z]{2,3})\s+"
        r"(?P<number>\d{1,5})\s+"
        r"(?P<suffix>[A-Z]?)\s+"
        r"(?P<date>\d{1,2}(?:ST|ND|RD|TH)\s+[A-Z]{3}\s+\d{4})\s+"
        r"(?P<location>[A-Z]+)"
    )

    for ln in lines:
        m = pat.search(ln)
        if m:
            # Treat the optional leading group as "Type"
            typ = (m.group("type") or "").strip()
            rows.append([
                typ,
                m.group("code"),
                m.group("number"),
                m.group("suffix") or "",
                m.group("date"),
                m.group("location"),
            ])

    # Filter accidental header captures
    rows = [r for r in rows if "VEHICLE" not in r[0] and "CLEARANCE" not in r[0]]
    return rows

# ---------- Builders for downloads ----------
def df_to_csv_bytes(df: pd.DataFrame) -> bytes:
    return df.to_csv(index=False).encode("utf-8")

def make_tailwind_html(csv_text: str, download_name: str) -> str:
    """
    Single-file HTML. Loads Tailwind from CDN, has one button, downloads embedded CSV via Blob.
    """
    csv_escaped = csv_text.replace("`", "\\`")  # keep JS template literal safe
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Download CSV</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-50 flex items-center justify-center">
  <main class="bg-white shadow-lg rounded-xl p-8 w-full max-w-xl text-center">
    <h1 class="text-2xl font-semibold mb-4">Vehicle Clearance CSV</h1>
    <p class="text-gray-600 mb-6">Click the button below to download the CSV file.</p>
    <button id="dl" class="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
      Download CSV
    </button>
  </main>
  <script>
    const csv = `{csv_escaped}`;
    const name = "{download_name}";
    document.getElementById('dl').addEventListener('click', () => {{
      const blob = new Blob([csv], {{ type: 'text/csv;charset=utf-8;' }});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }});
  </script>
</body>
</html>"""

# ---------- UI: upload + OCR ----------
st.subheader("1) Upload image")
up = st.file_uploader("JPG/PNG of the clearance table", type=["jpg", "jpeg", "png"])

st.subheader("2) Extract rows")
# Default OCR switch: on if Tesseract is present; off otherwise
want_ocr = st.toggle(
    "Use OCR (Tesseract)",
    value=TESS_PRESENT,
    help=("When on, the app will attempt to read rows automatically. "
          "If OCR is unavailable, leave this off and type rows manually.")
)

default_filename = st.text_input("Base filename (without extension)", value="IMG_7620")

rows = []
if up:
    image = Image.open(up).convert("RGB")
    st.image(image, caption="Uploaded image", use_column_width=True)
    if want_ocr:
        with st.spinner("Running OCR…"):
            txt = image_to_text(image)
        if txt.strip():
            with st.expander("Show OCR text"):
                st.code(txt)
            rows = parse_ocr_text_to_rows(txt)
        else:
            st.info("No OCR text extracted. You can enter rows manually below.")

# ---------- Editable table ----------
st.subheader("3) Review & edit rows")
df = pd.DataFrame(rows, columns=DEFAULT_COLUMNS) if rows else pd.DataFrame(columns=DEFAULT_COLUMNS)

df = st.data_editor(
    df,
    num_rows="dynamic",
    use_container_width=True,
    key="editor",
    column_config={
        "Type": st.column_config.TextColumn("Type"),
        "Code": st.column_config.TextColumn("Code"),
        "Number": st.column_config.Column("Number"),
        "Suffix": st.column_config.TextColumn("Suffix"),
        "Date": st.column_config.TextColumn("Date"),
        "Location": st.column_config.TextColumn("Location"),
    },
)

# ---------- Downloads ----------
st.subheader("4) Download")
csv_name = f"{default_filename}.csv"
html_name = f"{default_filename}.html"

csv_bytes = df_to_csv_bytes(df)
st.download_button(
    "⬇️ Download CSV",
    data=csv_bytes,
    file_name=csv_name,
    mime="text/csv",
)

html_text = make_tailwind_html(csv_bytes.decode("utf-8"), download_name=csv_name)
st.download_button(
    "⬇️ Download Tailwind HTML (with CSV embedded)",
    data=html_text.encode("utf-8"),
    file_name=html_name,
    mime="text/html",
)

st.caption(
    "Tip: If OCR misses columns, toggle it off and type rows directly. "
    "For best OCR, upload a straight, well-lit crop of the table."
)
