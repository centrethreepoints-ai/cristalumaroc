#!/usr/bin/env python3
"""Assemble src/*.html + partials/ -> pages statiques à la racine (SEO)."""
import pathlib
R = pathlib.Path(__file__).parent
logo = (R/'partials/logo.svg').read_text().strip()
parts = {k: (R/f'partials/{k}.html').read_text().replace('LOGO_SVG', logo) for k in ('head','header','footer')}
for src in (R/'src').glob('*.html'):
    html = src.read_text()
    for k, v in parts.items(): html = html.replace(f'<!--{k.upper()}-->', v)
    (R/src.name).write_text(html); print('built', src.name)
