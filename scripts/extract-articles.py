from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / '四级核心词Day1-Day45'
OUT = ROOT / 'public' / 'articles-data.js'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def paragraphs(path):
    with ZipFile(path) as archive:
        root = ET.fromstring(archive.read('word/document.xml'))
    result = []
    for paragraph in root.findall('.//w:body/w:p', NS):
        value = ''.join(node.text or '' for node in paragraph.findall('.//w:t', NS)).strip()
        if value:
            result.append(value)
    return result

def article_for(path):
    values = paragraphs(path)
    day = int(re.search(r'Day(\d+)', path.name).group(1))
    heading = values[2].split('｜', 1)[-1].strip()
    theme = values[3].removeprefix('主题：').split('加粗词', 1)[0].rstrip('。').strip()
    word_match = re.search(r'原创短文\s*(\d+)词', values[1])
    translation_heading = next(i for i, value in enumerate(values) if value.startswith('二、参考译文'))
    vocab_heading = next(i for i, value in enumerate(values) if value.startswith('三、今日单词表'))
    return {
        'day': day,
        'title': heading,
        'theme': theme,
        'wordCount': int(word_match.group(1)) if word_match else None,
        'english': values[4:translation_heading],
        'translation': values[translation_heading + 1:vocab_heading],
    }

files = sorted(DOCS.glob('*.docx'), key=lambda item: int(re.search(r'Day(\d+)', item.name).group(1)))
articles = [article_for(path) for path in files]
if len(articles) != 45 or [item['day'] for item in articles] != list(range(1, 46)):
    raise SystemExit(f'文章数据异常：{len(articles)}')
OUT.write_text('window.CET4_ARTICLES=' + json.dumps(articles, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(f'Extracted {len(articles)} articles to {OUT}')
