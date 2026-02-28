#!/usr/bin/env python3
"""
diagnose.py — show trigger code and _0xlaunch in the GoatPedia script
"""
import os, re

SRC = r"C:\Users\lukep\Desktop\Coding\GoatTech Never Dies\public"

with open(os.path.join(SRC, "index.html"), encoding="utf-8") as f:
    raw = f.read()

m = re.search(r'<script>(.*?)</script>', raw, re.DOTALL | re.IGNORECASE)
if not m:
    print("No script found"); raise SystemExit

script = m.group(1)

# Show _0xlaunch declaration
print("=== _0xlaunch ===")
idx = script.find('_0xlaunch')
if idx >= 0:
    print(script[max(0,idx-50):idx+600])
else:
    print("NOT FOUND")

print("\n=== All Trigger blocks ===")
for tm in re.finditer(r'/\*[^*]*Trigger[^*]*\*/', script):
    start = tm.start()
    print(f"\n--- {tm.group().strip()} (offset {start}) ---")
    print(script[start:start+400])

print("\n=== Copyright / footer click handler ===")
for keyword in ['copyright', 'copy', '©', 'footer', 'triple', 'click']:
    idx = script.lower().find(keyword.lower())
    if idx >= 0:
        print(f"\n[found '{keyword}' at offset {idx}]")
        print(script[max(0,idx-100):idx+300])