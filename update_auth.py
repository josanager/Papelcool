import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for auth-container
auth_container_pattern = r'<!-- Auth Button \(Login/User Menu\) -->\s*<div id="auth-container" class="auth-container-responsive">.*?</div>\s*</div>'
auth_match = re.search(auth_container_pattern, content, re.DOTALL)
if auth_match:
    content = content[:auth_match.start()] + content[auth_match.end():]
    print("Removed auth container from original position.")

nav_right_pattern = r'<div class="funko-nav-right">\s*<label class="funko-search" aria-label="Buscar">.*?</label>\s*<button type="button" class="funko-avatar-btn" onclick="toggleUserDropdown\(\)" aria-label="Perfil">\s*<span id="global-profile-initial">P</span>\s*</button>\s*</div>'
nav_replacement = """<div class="funko-nav-right">
                <label class="funko-search" aria-label="Buscar">
                    <span class="material-symbols-outlined">search</span>
                    <input type="text" id="global-search-input" placeholder="Busca ideas o fandoms..." />
                </label>
                <div id="auth-container" style="display: flex; gap: 12px; align-items: center;">
                    <button type="button" id="auth-register-btn" onclick="navigateToView('register')"
                        class="pc-auth-motion px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center font-bold"
                        style="background: #FFE600; border: 3px solid black; border-radius: 99px; box-shadow: 3px 3px 0 white; font-family: 'Fredoka', sans-serif; font-size: 0.9rem; color: black;"
                        aria-label="Register">
                        ¡Regístrate!
                    </button>
                    <button type="button" id="auth-login-btn" onclick="navigateToView('login')"
                        class="pc-auth-motion px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center font-bold"
                        style="background: white; border: 3px solid black; border-radius: 99px; box-shadow: 3px 3px 0 white; font-family: 'Fredoka', sans-serif; font-size: 0.9rem; color: black;"
                        aria-label="Login">
                        Login
                    </button>
                    <div id="auth-user-menu" style="display: none; align-items: center; gap: 12px;">
                        <button id="auth-user-avatar" onclick="toggleUserDropdown()"
                            class="funko-avatar-btn" aria-label="Perfil">
                            J
                        </button>
                    </div>
                </div>
            </div>"""
match = re.search(nav_right_pattern, content, re.DOTALL)
if match:
    content = content[:match.start()] + nav_replacement + content[match.end():]
    print("Injected auth container into nav-right.")
else:
    print("Nav right not found!")
    # Let's try simpler replace
    content = content.replace("""<div class="funko-nav-right">
                <label class="funko-search" aria-label="Buscar">
                    <span class="material-symbols-outlined">search</span>
                    <input type="text" id="global-search-input" placeholder="Busca ideas o fandoms..." />
                </label>
                <button type="button" class="funko-avatar-btn" onclick="toggleUserDropdown()" aria-label="Perfil">
                    <span id="global-profile-initial">P</span>
                </button>
            </div>""", nav_replacement)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

