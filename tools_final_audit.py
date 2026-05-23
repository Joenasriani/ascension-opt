#!/usr/bin/env python3
import json
import re
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parent
LEVELS = ROOT / 'levels_1_21.json'
INDEX = ROOT / 'index.html'

PATTERNS = [r'TODO', r'FIXME', r'placeholder', r'\btemp\b', r'\bdummy\b', r'\bmock\b', r'\bWIP\b', r'\blorem\b', r'\btbd\b', r'coming soon', r'\{0\}']
COMPILED = re.compile('|'.join(PATTERNS), re.IGNORECASE)


def load_levels(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def audit_levels(levels):
    issues = []
    for lvl in levels:
        blocks = lvl.get('blocks', [])
        ids = [b.get('id') for b in blocks]
        dup_ids = [k for k, v in Counter(ids).items() if v > 1]
        if dup_ids:
            issues.append({'type': 'duplicate_ids', 'level': lvl.get('id'), 'ids': dup_ids})

        id_map = {b.get('id'): b for b in blocks}
        for b in blocks:
            for link in b.get('links', []):
                if link not in id_map:
                    issues.append({'type': 'missing_link', 'level': lvl.get('id'), 'source': b.get('id'), 'target': link})

        poses = defaultdict(list)
        for b in blocks:
            p = b.get('position', {})
            key = (p.get('x'), p.get('y'), p.get('z'))
            poses[key].append(b.get('id'))
        for pos, members in poses.items():
            if len(members) > 1:
                issues.append({'type': 'duplicate_transform', 'level': lvl.get('id'), 'position': pos, 'ids': members})

    return issues


def audit_index_assets(index_path: Path):
    txt = index_path.read_text(encoding='utf-8')
    refs = re.findall(r'(?:src|href)="\./([^\"]+)"', txt)
    checks = []
    for ref in refs:
        p = ROOT / ref
        checks.append({'ref': ref, 'exists': p.exists()})
    return checks


def scan_placeholders(root: Path):
    hits = []
    for p in root.rglob('*'):
        if not p.is_file():
            continue
        if '.git' in p.parts:
            continue
        if p.suffix.lower() in {'.png', '.jpg', '.jpeg', '.mp3', '.woff', '.woff2', '.ico'}:
            continue
        try:
            content = p.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        for i, line in enumerate(content.splitlines(), start=1):
            if COMPILED.search(line):
                hits.append({'file': str(p.relative_to(root)), 'line': i, 'text': line.strip()[:180]})
    return hits


def main():
    levels = load_levels(LEVELS)
    level_issues = audit_levels(levels)
    asset_checks = audit_index_assets(INDEX)
    placeholder_hits = scan_placeholders(ROOT)

    summary = {
        'levels_count': len(levels),
        'level_integrity_issues': level_issues,
        'index_asset_checks': asset_checks,
        'placeholder_hits': placeholder_hits,
        'blocking': bool(level_issues) or any(not c['exists'] for c in asset_checks),
    }

    out = ROOT / 'FINAL_ZERO_TOLERANCE_AUDIT_STATIC.json'
    out.write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(f'Wrote {out.name}')
    print(f"Levels: {summary['levels_count']}; level issues: {len(level_issues)}")
    print(f"Index refs checked: {len(asset_checks)}; missing: {sum(not c['exists'] for c in asset_checks)}")
    print(f"Placeholder hits: {len(placeholder_hits)}")


if __name__ == '__main__':
    main()
