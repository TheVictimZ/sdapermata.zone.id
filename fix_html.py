import os
import re

html_dir = r'c:\laragon\www\016\online_server\github\permata.env.pm'

for filename in os.listdir(html_dir):
    if filename.endswith('.html'):
        path = os.path.join(html_dir, filename)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Clean up the messed up HTML tag from last run
        content = re.sub(
            r'<html lang="id" x-data="appData"[^>]*>(\s*localStorage\.setItem[^\n]*>)?',
            '<html lang="id" x-data="appData" :class="{ \'dark\': darkMode }" x-init="$watch(\'darkMode\', val => localStorage.setItem(\'theme\', val ? \'dark\' : \'light\'))">',
            content
        )
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Fixed {filename}")
