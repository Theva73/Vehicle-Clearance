import io
import os
import re
import base64
import pandas as pd
from PIL import Image
import numpy as np
import streamlit as st

# Optional: point pytesseract at your install if Windows didn't add to PATH
# import pytesseract
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

try:
    import pytesseract
    TESS_OK = True
except Exception:
    TESS_OK = False

st.set_page_config(page_title="Image → CSV (Vehicle Clearance)", page_icon="📄", layout="centered")

st.title("📄 Image → CSV (Vehicle Clearance)")
st.caption("Upload your clearance image, extract rows, edit if needed, then download CSV or a self-contained Tailwind HTML with a Download button.")

DEFAULT_COLUMNS = ["Type", "Code", "Number", "Suffix", "Date", "Location"]

def parse_ocr_text_to_rows(text: str):
    """
    Heuristic parser for lines like:
    [Type?] DOC|OC  CODE  NUMBER  SUFFIX  18TH AUG 2025  LOCATION
    """
    rows = []

    # Normalize whitespace, split by lines, keep only lines with DOC/OC
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in text.splitlines()]
    lines = [ln for ln in lines if ln]  # non-empty

    # Regex: optional TYPE (all-caps words/spaces), then DOC|OC, then columns
    pattern = re.compile(
        r"^(?:(?P<type>[A-Z][A-Z ]{1,})\s+)?"
        r"(?P<doctype>DOC|OC)\s+"
        r"(?P<code>[A-Z]{2,3})\s+"
        r"(?P<number>\d{1,5})\s+"
        r"(?P<suffix>[A-Z]?)\s+"
        r"(?P<date>\d{1,2}(?:ST|ND|RD|TH)\s+[A-Z]{3}\s+\d{4})\s+"
        r"(?P<location>[A-Z]+)"
    )

    for ln in lines:
        m = pattern.search(ln)
        if m:
            typ = (m.group("type") or "").strip()
            rows.append([
                typ,
                m.group("code"),
                m.group("number"),
                m.group("suffix") or "",
                m.group("date"),
                m.group("location"),
            ])

    # Deduplicate obvious header lines if OCR captured them as text rows
    rows_clean = []
    for r in rows:
        if not ("VEHICLE" in r[0] or "CLEARANCE" in r[0]):
            rows_clean.append(r)

    return rows_clean

def image_to_text(img: Image.Image) -> str:
    """
    Run OCR with pytesseract; a little pre-processing for better results.
    """
    if not TESS_OK:
        return ""

    # Convert to grayscale and increase contrast slightly
    gray = img.convert("L")
    arr = np.array(gray)
    # Simple normalization / threshold-ish
    arr = np.clip((arr - arr.mean()) * 1.2 + arr.mean(), 0, 255).astype(np.uint8)

    proc_img = Image.fromarray(arr)
    text = pytesseract.image_to_string(proc_img, lang="eng")
    return text

def df_to_csv_bytes(df: pd.DataFrame) -> bytes:
    return df.to_csv(index=False).encode("utf-8")

def make_tailwind_html(csv_text: str, download_name: str) -> str:
    """
    Build a single-file HTML (Tailwind via CDN) that, when opened,
    shows a big button to download the embedded CSV via Blob.
    """
    # Escape backticks in CSV to keep JS template literal intact
    csv_escaped = csv_text.replace("`", "\\`")

    html = f"""<!DOCTYPE html>
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
    const csv = `""" + csv_escaped + """`;
    const name = """ + (f'"{download_name}"') + """;
    document.getElementById('dl').addEventListener('click', () => {
      const blob = new Blob([csv], {{ type: 'text/csv;charset=utf-8;' }});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  </script>
</body>
</html>"""
    return html

# --- UI ---

st.subheader("1) Upload image")
up = st.file_uploader("JPG/PNG of the clearance table", type=["jpg", "jpeg", "png"])

st.subheader("2) Extract rows")
col1, col2 = st.columns(2)
with col1:
    want_ocr = st.toggle("Use OCR (Tesseract)", value=True, help="If off, start from an empty table and enter rows manually.")
with col2:
    default_filename = st.text_input("Base filename (without extension)", value="IMG_7620")

rows = []
if up:
    image = Image.open(up).convert("RGB")
    st.image(image, caption="Uploaded image", use_column_width=True)

    if want_ocr:
        if not TESS_OK:
            st.warning("pytesseract not available or Tesseract not installed. Switch off OCR and enter rows manually.")
        else:
            with st.spinner("Running OCR…"):
                txt = image_to_text(image)
            if not txt.strip():
                st.info("OCR returned nothing—try increasing image quality or switch off OCR and type rows manually.")
            else:
                # Show raw OCR text collapsed (for debugging)
                with st.expander("Show OCR text"):
                    st.code(txt)
                rows = parse_ocr_text_to_rows(txt)

# Build an editable grid
st.subheader("3) Review & edit rows")
if not rows:
    df = pd.DataFrame(columns=DEFAULT_COLUMNS)
else:
    df = pd.DataFrame(rows, columns=DEFAULT_COLUMNS)

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
    "⬇️ Download Tailwind HTML (with CSV inside)",
    data=html_text.encode("utf-8"),
    file_name=html_name,
    mime="text/html",
)

st.caption("Tip: If OCR misses columns, toggle OCR off and type rows directly in the table. You can also paste rows and edit freely.")
