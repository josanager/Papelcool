import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

logger_script = """
<div id="debug-log-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);color:#0f0;z-index:999999;font-family:monospace;padding:20px;overflow-y:auto;pointer-events:none;">
    <h3>Debug Console</h3>
    <ul id="debug-log-list" style="list-style:none;padding:0;margin:0;"></ul>
</div>
<script>
    const debugList = document.getElementById('debug-log-list');
    function logToDebug(msg, color) {
        const li = document.createElement('li');
        li.style.color = color;
        li.textContent = msg;
        debugList.appendChild(li);
        console.log(msg);
    }
    window.onerror = function(message, source, lineno, colno, error) {
        logToDebug(`ERROR: ${message} at ${source}:${lineno}:${colno}`, '#f00');
    };
    window.addEventListener('unhandledrejection', function(event) {
        logToDebug(`UNHANDLED PROMISE: ${event.reason}`, '#f50');
    });
    const originalConsoleError = console.error;
    console.error = function(...args) {
        logToDebug(`CONSOLE.ERROR: ${args.join(' ')}`, '#f00');
        originalConsoleError.apply(console, args);
    };
</script>
"""

# Insert right after <body class="pc-ui-body">
start_idx = content.find('<body')
if start_idx != -1:
    end_bracket = content.find('>', start_idx)
    content = content[:end_bracket+1] + logger_script + content[end_bracket+1:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
