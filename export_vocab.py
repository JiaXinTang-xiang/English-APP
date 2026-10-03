from pathlib import Path
import json, re, sys
from docx import Document

# 词表源目录：默认取本脚本同级的「四级核心词Day1-Day45」文件夹；
# 也可在命令行传入自定义路径，例如：
#   python export_vocab.py "D:/你的路径/词表文件夹"
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_DOCS = SCRIPT_DIR / "四级核心词Day1-Day45"
DOCS = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DOCS
OUT = SCRIPT_DIR / 'vocab-data.js'
PUBLIC_OUT = SCRIPT_DIR / 'public' / 'vocab-data.js'

days = []
for day in range(1, 46):
    matches = list(DOCS.glob(f'四级核心词Day{day}（*词记忆）.docx'))
    if not matches:
        print(f'[警告] 未找到 Day{day} 的词表文件，已跳过')
        continue
    path = matches[0]
    doc = Document(path)
    words = []
    for row in doc.tables[0].rows[1:]:
        c = [x.text.strip() for x in row.cells]
        words.append({'word': c[1], 'ipa': c[2], 'pos': c[3], 'meaning': c[4]})
    days.append({'day': day, 'count': len(words), 'words': words})

payload = 'window.CET4_DAYS=' + json.dumps(days, ensure_ascii=False, separators=(',', ':')) + ';\n'
OUT.write_text(payload, encoding='utf-8')
PUBLIC_OUT.parent.mkdir(parents=True, exist_ok=True)
PUBLIC_OUT.write_text(payload, encoding='utf-8')
print(f'exported {sum(x["count"] for x in days)} entries to {OUT} and {PUBLIC_OUT}')
