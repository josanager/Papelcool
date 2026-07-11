import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# The logger was wrapped in <div id="debug-log-overlay"> ... </script>
start_idx = content.find('<div id="debug-log-overlay"')
end_idx = content.find('</script>', start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx+9:]
    print("Removed logger.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
