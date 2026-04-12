with open('index.html', 'r') as f:
    content = f.read()

# Change the text color of the title and back button
search = """                        <button type="button" class="pc-home-icon" onclick="document.getElementById('favorites-view').style.display='none'; openAuthenticatedHome(true);" style="margin-right: 1rem;">
                            <span class="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 style="font-family: 'Fredoka', sans-serif; font-weight: 700; margin: 0; font-size: 1.5rem;">Mis Favoritos</h1>"""

replace = """                        <button type="button" class="pc-home-icon" onclick="document.getElementById('favorites-view').style.display='none'; openAuthenticatedHome(true);" style="margin-right: 1rem; color: #fff;">
                            <span class="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 style="font-family: 'Fredoka', sans-serif; font-weight: 700; margin: 0; font-size: 1.5rem; color: #fff;">Mis Favoritos</h1>"""

content = content.replace(search, replace)

with open('index.html', 'w') as f:
    f.write(content)
