import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CSS
css_addition = """
        /* SHOWCASE MODE NAVBAR */
        body.showcase-mode .funko-nav-center { display: none !important; }
        body.showcase-mode .funko-nav-right { display: none !important; }
        body.showcase-mode .pc-mobile-menu-btn { display: none !important; }
    </style>
"""
content = re.sub(r'</style>\n</head>', css_addition + '</head>', content, count=1)

# 2. Update openShowcaseView
old_showcase = "setGlobalTopbarVisible(false);"
new_showcase = "setGlobalTopbarVisible(true);\n            document.body.classList.add('showcase-mode');"
content = content.replace("function openShowcaseView() {\n            openAuthenticatedHome(false);\n            setGlobalTopbarVisible(false);", "function openShowcaseView() {\n            openAuthenticatedHome(false);\n            setGlobalTopbarVisible(true);\n            document.body.classList.add('showcase-mode');")

# 3. Update other functions to remove showcase-mode
content = content.replace("function openAuthenticatedHome(show = true) {\n            ensureDeferredViews();", "function openAuthenticatedHome(show = true) {\n            ensureDeferredViews();\n            document.body.classList.remove('showcase-mode');")
content = content.replace("function openCustomizationView() {\n            openAuthenticatedHome(false);", "function openCustomizationView() {\n            openAuthenticatedHome(false);\n            document.body.classList.remove('showcase-mode');")
content = content.replace("function openPresetsView() {\n            ensureDeferredViews();", "function openPresetsView() {\n            ensureDeferredViews();\n            document.body.classList.remove('showcase-mode');")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
