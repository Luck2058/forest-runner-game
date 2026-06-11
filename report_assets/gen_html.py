import sys, io, os, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

assets = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(assets, 'content.json'), 'r', encoding='utf-8') as f:
    content = json.load(f)
with open(os.path.join(assets, 'tables.json'), 'r', encoding='utf-8') as f:
    tables = json.load(f)
with open(os.path.join(assets, 'img_base64.json'), 'r', encoding='utf-8') as f:
    img_b64 = json.load(f)

fig_map = {
    'image_rId6.png': '图1', 'image_rId7.png': '图2', 'image_rId8.png': '图3',
    'image_rId9.png': '图4', 'image_rId10.png': '图5', 'image_rId11.png': '图6',
    'image_rId12.png': '图7', 'image_rId13.png': '图8', 'image_rId14.png': '图9',
}

CSS = """<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; font-size: 16px; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: #0a1a0a;
    color: #e8f5e8;
    line-height: 1.8;
    overflow-x: hidden;
}
.hero {
    position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 2rem;
    background: linear-gradient(135deg, #0d260d 0%, #1a4a1a 30%, #0d3310 60%, #0a1a0a 100%);
}
.hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 80%, rgba(76,175,80,0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(139,195,74,0.1) 0%, transparent 50%);
}
.hero-content { position: relative; z-index: 1; }
.hero-badge {
    display: inline-block; padding: 0.4rem 1.5rem; border-radius: 50px;
    background: rgba(76,175,80,0.2); border: 1px solid rgba(76,175,80,0.4);
    color: #81c784; font-size: 0.9rem; letter-spacing: 3px; margin-bottom: 1.5rem;
}
.hero h1 { font-size: 3.5rem; font-weight: 800; color: #c8e6c9; text-shadow: 0 0 60px rgba(76,175,80,0.3); margin-bottom: 0.5rem; }
.hero-subtitle { font-size: 1.3rem; color: #81c784; letter-spacing: 8px; margin-bottom: 2rem; }
.hero-meta { display: flex; flex-direction: column; gap: 0.4rem; color: #a5d6a7; font-size: 0.95rem; opacity: 0.85; }
.scroll-hint {
    position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
    color: #4caf50; animation: bounce 2s infinite; font-size: 0.9rem; letter-spacing: 2px;
}
@keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(10px); } }
.section { max-width: 1000px; margin: 0 auto; padding: 4rem 2rem; position: relative; }
.section-chapter { padding: 3rem 2rem; }
.section-title {
    font-size: 2rem; font-weight: 700; color: #a5d6a7; margin-bottom: 2rem;
    padding-bottom: 0.8rem; border-bottom: 2px solid rgba(76,175,80,0.3);
    display: flex; align-items: center; gap: 0.6rem;
}
.toc-section { padding-top: 2rem; }
.toc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.toc-card {
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    padding: 1.8rem 1rem; border-radius: 16px; text-decoration: none;
    background: rgba(76,175,80,0.08); border: 1px solid rgba(76,175,80,0.2);
    color: #c8e6c9; transition: all 0.3s; text-align: center;
}
.toc-card:hover { background: rgba(76,175,80,0.18); border-color: #4caf50; transform: translateY(-3px); box-shadow: 0 8px 30px rgba(76,175,80,0.15); }
.toc-num { font-size: 1.5rem; font-weight: 800; color: #4caf50; }
.feature-list { list-style: none; padding: 0; }
.feature-list li {
    padding: 0.6rem 0; padding-left: 1.8rem; position: relative; color: #c8e6c9;
    border-bottom: 1px solid rgba(76,175,80,0.08);
}
.feature-list li::before { content: '\\25B8'; position: absolute; left: 0; color: #4caf50; }
.card {
    background: rgba(76,175,80,0.05); border: 1px solid rgba(76,175,80,0.15);
    border-radius: 16px; padding: 1.8rem; margin-bottom: 1.5rem;
}
.card h3 { color: #81c784; margin-bottom: 1rem; font-size: 1.15rem; }
.figure { margin: 2rem 0; }
.figure img { width: 100%; border-radius: 12px; border: 1px solid rgba(76,175,80,0.2); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
.figure-caption { text-align: center; color: #81c784; font-size: 0.85rem; margin-top: 0.6rem; opacity: 0.8; }
.data-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
.data-table th { background: rgba(76,175,80,0.2); color: #a5d6a7; padding: 0.8rem 1rem; text-align: left; font-weight: 600; border-bottom: 2px solid rgba(76,175,80,0.3); }
.data-table td { padding: 0.7rem 1rem; border-bottom: 1px solid rgba(76,175,80,0.1); color: #c8e6c9; }
.data-table tr:hover td { background: rgba(76,175,80,0.05); }
.innovation-grid { display: grid; gap: 1.2rem; }
.innovation-card {
    background: rgba(76,175,80,0.06); border: 1px solid rgba(76,175,80,0.15);
    border-radius: 14px; padding: 1.5rem; transition: all 0.3s;
    border-left: 3px solid #4caf50;
}
.innovation-card:hover { background: rgba(76,175,80,0.12); transform: translateX(5px); }
.innovation-card h3 { color: #81c784; margin-bottom: 0.6rem; font-size: 1.05rem; }
.tech-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.tech-card { background: rgba(76,175,80,0.06); border: 1px solid rgba(76,175,80,0.15); border-radius: 14px; padding: 1.5rem; }
.tech-card h3 { color: #81c784; margin-bottom: 1rem; }
.tech-card ul { list-style: none; padding: 0; }
.tech-card li { padding: 0.3rem 0; color: #c8e6c9; font-size: 0.92rem; }
.check-list { list-style: none; padding: 0; }
.check-list li { padding: 0.4rem 0; color: #c8e6c9; }
.code-block {
    background: rgba(0,0,0,0.3); border: 1px solid rgba(76,175,80,0.15);
    border-radius: 12px; padding: 1.5rem; font-family: 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace;
    font-size: 0.82rem; line-height: 1.6; color: #a5d6a7; overflow-x: auto; white-space: pre;
    margin: 1.5rem 0;
}
.footer { text-align: center; padding: 3rem 2rem; color: #4caf50; opacity: 0.6; font-size: 0.9rem; border-top: 1px solid rgba(76,175,80,0.1); }
@media (max-width: 768px) {
    .hero h1 { font-size: 2rem; }
    .toc-grid { grid-template-columns: repeat(2, 1fr); }
    .tech-grid { grid-template-columns: 1fr; }
    .section { padding: 2rem 1rem; }
}
</style>"""

def build_html():
    parts = []
    parts.append('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>森林酷跑游戏系统 - 期末综合训练文档</title>')
    parts.append(CSS)
    parts.append('</head><body>')

    # Hero cover
    parts.append('<section class="hero">')
    parts.append('<div class="hero-content">')
    parts.append('<div class="hero-badge">期末综合训练</div>')
    parts.append('<h1>森林酷跑游戏系统</h1>')
    parts.append('<p class="hero-subtitle">项目文档</p>')
    parts.append('<div class="hero-meta">')
    parts.append('<span>小组成员：焦国坤、丁巴达杰、肖盼、陈宇聪、廖锦源、陈星羽、唐紫高</span>')
    parts.append('<span>项目类型：休闲小游戏</span>')
    parts.append('<span>开发框架：Flask + MySQL + HTML5 Canvas</span>')
    parts.append('<span>提交日期：2026年6月</span>')
    parts.append('</div></div>')
    parts.append('<div class="scroll-hint">向下滚动浏览</div>')
    parts.append('</section>')

    # TOC
    parts.append('<section class="section toc-section">')
    parts.append('<h2 class="section-title">目录</h2>')
    parts.append('<div class="toc-grid">')
    for num, (aid, title) in enumerate([
        ('ch1', '项目概述'), ('ch2', '功能模块图'), ('ch3', '功能模块详述'),
        ('ch4', '技术架构'), ('ch5', '数据库设计'), ('ch6', '项目创新点'),
        ('ch7', '小组分工'), ('ch8', '总结与展望')
    ], 1):
        parts.append(f'<a href="#{aid}" class="toc-card"><span class="toc-num">{num:02d}</span>{title}</a>')
    parts.append('</div></section>')

    # Process content
    ch_map = {
        '一、项目概述': ('ch1', '项目概述'),
        '二、功能模块图': ('ch2', '功能模块图'),
        '三、功能模块详述': ('ch3', '功能模块详述'),
        '四、技术架构': ('ch4', '技术架构'),
        '五、数据库设计': ('ch5', '数据库设计'),
        '六、项目创新点': ('ch6', '项目创新点'),
        '七、小组分工': ('ch7', '小组分工'),
        '八、总结与展望': ('ch8', '总结与展望'),
    }

    in_list = False
    in_card = False
    current_section = None
    db_table_inserted = False
    division_table_inserted = False
    content_started = False  # Flag: skip cover+TOC paragraphs, start after first real chapter heading

    for item in content:
        style = item['style']
        text = item['text'].strip()

        # Skip ALL content before the first real chapter heading "一、项目概述"
        # (cover text and TOC items are already hardcoded above)
        if not content_started:
            if style == 'Heading 1' and text == '一、项目概述':
                content_started = True
            else:
                continue

        if not text and not item['has_image']:
            continue

        # Heading 1
        if style == 'Heading 1':
            if in_list:
                parts.append('</ul>')
                in_list = False
            if in_card:
                parts.append('</div>')
                in_card = False
            if text in ch_map:
                sid, title_short = ch_map[text]
                current_section = sid
                parts.append(f'<section id="{sid}" class="section section-chapter"><h2 class="section-title">{text}</h2>')
            else:
                parts.append(f'<section class="section section-chapter"><h2 class="section-title">{text}</h2>')

        # Heading 2
        elif style == 'Heading 2':
            if in_list:
                parts.append('</ul>')
                in_list = False
            if in_card:
                parts.append('</div>')
                in_card = False
            parts.append(f'<h3 style="color:#81c784;margin:1.5rem 0 0.8rem;font-size:1.25rem;">{text}</h3>')

        # Heading 3
        elif style == 'Heading 3':
            if in_list:
                parts.append('</ul>')
                in_list = False
            if in_card:
                parts.append('</div>')
            parts.append(f'<div class="card"><h3>{text}</h3>')
            in_card = True

        # Normal text
        elif style == 'Normal' and text:
            if in_card:
                parts.append(f'<p>{text}</p>')
            elif text.startswith(('🌲', '🎮', '🌳', '🎁', '🏆', '⭐', '🎵', '👤', '⚙', '🔧', '🎨', '📊')):
                if not in_list:
                    parts.append('<ul class="feature-list">')
                    in_list = True
                clean = text[2:] if len(text) > 2 else text
                parts.append(f'<li>{clean}</li>')
            elif text.startswith('✅'):
                if not in_list:
                    parts.append('<ul class="check-list">')
                    in_list = True
                parts.append(f'<li>{text}</li>')
            elif text == '— 全文完 —':
                if in_list:
                    parts.append('</ul>')
                    in_list = False
                parts.append(f'<p style="text-align:center;color:#4caf50;margin:2rem 0;font-size:1.2rem;opacity:0.7;">{text}</p>')
            elif text.startswith(('图',)):
                parts.append(f'<p class="figure-caption">{text}</p>')
            elif text.startswith('forest-runner-game/'):
                parts.append(f'<div class="code-block">{text}</div>')
            elif '•' in text and text.startswith(('•',)):
                if not in_list:
                    parts.append('<ul class="feature-list">')
                    in_list = True
                parts.append(f'<li>{text[1:].strip()}</li>')
            else:
                parts.append(f'<p>{text}</p>')

        # Images
        if item['has_image']:
            for img_file in item['images']:
                if img_file in img_b64:
                    parts.append(f'<div class="figure"><img src="{img_b64[img_file]}" alt="" loading="lazy"></div>')

    # Clean up
    if in_list:
        parts.append('</ul>')
    if in_card:
        parts.append('</div>')

    # Insert database table into ch5
    if tables and not db_table_inserted:
        db_table = tables[0]
        db_html = '<h3 style="color:#81c784;margin:2rem 0 1rem;font-size:1.15rem;">5.1 数据表一览</h3>'
        db_html += '<table class="data-table">'
        for i, row in enumerate(db_table['rows']):
            tag = 'th' if i == 0 else 'td'
            db_html += '<tr>' + ''.join(f'<{tag}>{cell.replace(chr(10), "<br>")}</{tag}>' for cell in row) + '</tr>'
        db_html += '</table>'
        db_html += '<h3 style="color:#81c784;margin:2rem 0 1rem;font-size:1.15rem;">5.2 核心关系</h3>'
        db_html += '<p>用户(user)与成绩(score)为一对多关系，一个用户可有多条游戏记录。用户(user)与皮肤(user_skin)、道具(user_item)也为一对多关系。系统采用外键约束确保数据完整性（ondelete=CASCADE），用户删除时自动清理关联数据。</p>'
        parts.append(db_html)

    parts.append('</section>' * 8)

    # Add division table as separate section
    if len(tables) > 1 and not division_table_inserted:
        div_table = tables[1]
        parts.append('<section id="ch7" class="section section-chapter">')
        parts.append('<h2 class="section-title">七、小组分工</h2>')
        parts.append('<p>本小组共7名成员，分工如下表所示：</p>')
        parts.append('<table class="data-table">')
        for i, row in enumerate(div_table['rows']):
            tag = 'th' if i == 0 else 'td'
            parts.append('<tr>' + ''.join(f'<{tag} style="vertical-align:top">{cell.replace(chr(10), "<br>")}</{tag}>' for cell in row) + '</tr>')
        parts.append('</table></section>')

    # Footer
    parts.append('<div class="footer">森林酷跑游戏系统 - 期末综合训练文档 - 2026年6月</div>')
    parts.append('</body></html>')

    return '\n'.join(parts)

html = build_html()
out_path = os.path.join(os.path.dirname(assets), '森林酷跑_项目报告.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)

size_kb = os.path.getsize(out_path) / 1024
print(f'HTML report generated: {out_path}')
print(f'Size: {size_kb:.1f} KB')
