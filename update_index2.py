import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Modify #canvas-container.showcase-active z-index
content = content.replace("z-index: 100 !important;", "z-index: 0 !important;")

# Modify background of the body or main sections so it's opaque when scrolling
# We can just add a big class "funko-content-wrapper" inside authenticated-home-view
auth_home_start = content.find('<div id="authenticated-home-view">')
main_start = content.find('<main>', auth_home_start)
main_end = content.find('</main>', auth_home_start)


# Replace the entire authenticated-home-view content with the new wrapper logic
new_auth_content = """<div id="authenticated-home-view">
        <div style="height: 100vh; pointer-events: none; width: 100%; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 5vh; z-index: 10; position: relative;">
            <div class="showcase-buttons" style="display: flex; gap: 24px; pointer-events: auto; justify-content: center;">
                <button type="button" class="pc-auth-motion" onclick="navigateToView('custom')"
                    style="background: #FF4D94; border: 4px solid black; box-shadow: 6px 6px 0px 0px rgba(0,0,0,1); border-radius: 20px; padding: 16px 32px; cursor: pointer;">
                    <span style="font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 1.5rem; color: black; text-transform: uppercase;">CUSTOM</span>
                </button>
                <button type="button" class="pc-auth-motion" onclick="navigateToView('presets')"
                    style="background: #FFE600; border: 4px solid black; box-shadow: 6px 6px 0px 0px rgba(0,0,0,1); border-radius: 20px; padding: 16px 32px; cursor: pointer;">
                    <span style="font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 1.5rem; color: black; text-transform: uppercase;">PRESETS</span>
                </button>
            </div>
        </div>

        <main style="background: linear-gradient(135deg, #E0F2FE 0%, #F8FAFC 100%); position: relative; z-index: 15; border-top: 5px solid #000; box-shadow: 0 -10px 20px rgba(0,0,0,0.2);">
            
            <!-- Hero Banner -->
            <div id="home-top"></div>

            <!-- New Picks For You -->
            <section class="funko-section" style="padding-top: 3rem;">
                <h2>Ediciones del momento</h2>
                <div class="funko-new-picks-grid" id="home-collection-grid"></div>
            </section>

            <!-- Fandom / Banners Area -->
            <section class="funko-section">
                <h2>Papelcool Originals & Fandoms</h2>
                <div class="funko-banners-grid" id="home-banner-grid"></div>
            </section>

            <!-- FUNKO-STYLE FOOTER -->
            <footer style="background: #111827; margin-top: 4rem; padding: 4rem 2rem 2rem; border-top: 5px solid #000; position: relative; overflow: hidden;">
                <!-- Newsletter block acting like a Pop-art Sticker -->
                <div style="background: white; border: 4px solid #000; padding: 3rem; max-width: 800px; margin: -8rem auto 4rem; position: relative; z-index: 20; box-shadow: 12px 12px 0px 0px rgba(0,0,0,1); border-radius: 12px; transform: rotate(-1deg);">
                    <h3 style="font-family: 'Fredoka', sans-serif; font-size: 3rem; font-weight: 900; color: #000; text-transform: uppercase; margin-bottom: 1rem; text-align: center;">Únete al Newsletter</h3>
                    <p style="font-family: 'Montserrat', sans-serif; font-size: 1.1rem; color: #111; text-align: center; margin-bottom: 2rem;">¡Entérate primero de nuevos drops, figuras especiales y eventos en TikTok!</p>
                    <div style="display: flex; gap: 1rem; justify-content: center; max-width: 500px; margin: 0 auto;">
                        <input type="text" placeholder="Email Address..." style="flex: 1; padding: 1rem; border: 3px solid #000; font-family: 'Montserrat', sans-serif; font-size: 1rem;">
                        <button style="background: #000; color: #FFE600; font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 1.2rem; padding: 0 2rem; border: 3px solid #000; cursor: pointer; text-transform: uppercase;">SIGN UP</button>
                    </div>
                </div>

                <!-- Social & Links -->
                <div style="max-width: 1400px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 4rem; justify-content: space-between;">
                    <div style="flex: 1; min-width: 250px;">
                        <img src="logo.svg" alt="Papelcool" style="height: 50px; filter: drop-shadow(3px 3px 0 white); margin-bottom: 2rem;">
                        <div style="display: flex; gap: 1rem;">
                            <div style="width: 44px; height: 44px; background: white; border: 3px solid #000; border-radius: 50%; box-shadow: 4px 4px 0 #FF4D94; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                <span class="material-symbols-outlined" style="color: #000;">photo_camera</span>
                            </div>
                            <div style="width: 44px; height: 44px; background: white; border: 3px solid #000; border-radius: 50%; box-shadow: 4px 4px 0 #407BFF; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                <span class="material-symbols-outlined" style="color: #000;">play_arrow</span>
                            </div>
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <h4 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 1.5rem;">My Account</h4>
                        <ul style="list-style: none; padding: 0; margin: 0; font-family: 'Montserrat', sans-serif; color: #bbb; display: flex; flex-direction: column; gap: 0.8rem;">
                            <li style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#bbb'">Order History</li>
                            <li style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#bbb'">Wishlist</li>
                        </ul>
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <h4 style="font-family: 'Fredoka', sans-serif; font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 1.5rem;">Contact Us</h4>
                        <ul style="list-style: none; padding: 0; margin: 0; font-family: 'Montserrat', sans-serif; color: #bbb; display: flex; flex-direction: column; gap: 0.8rem;">
                            <li style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#bbb'">Support Centre</li>
                            <li style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#bbb'">TikTok Events</li>
                        </ul>
                    </div>
                </div>

                <div style="max-width: 1400px; margin: 4rem auto 0; padding-top: 2rem; border-top: 2px solid #333; display: flex; justify-content: space-between; color: #888; font-family: 'Montserrat', sans-serif; font-size: 0.9rem;">
                    <span>© 2026 Papelcool. All Rights Reserved.</span>
                    <span>Built with ❤️ for Fandoms.</span>
                </div>
            </footer>
        </main>
        
        <nav class="pc-home-mobile-nav" aria-label="Navegación móvil" style="z-index: 10000; position: fixed;">
            <button type="button" class="pc-home-chip" onclick="window.scrollTo({top:0, behavior:'smooth'})">Showcase</button>
            <button type="button" class="pc-home-chip" onclick="navigateToView('custom')">Custom</button>
            <button type="button" class="pc-home-chip" onclick="navigateToView('presets')">Colección</button>
            <button type="button" class="pc-home-chip" onclick="toggleUserDropdown()">Perfil</button>
        </nav>
    </div>"""

if auth_home_start != -1:
    end_of_nav = content.find('</div>', main_end + 10)
    end_of_div = content.find('</div>', end_of_nav + 5)
    content = content[:auth_home_start] + new_auth_content + content[end_of_div + 6:]
    print("Replaced authenticated-home-view smoothly.")

# Remove the old showcase buttons container so they don't appear twice
old_showcase_btn_start = content.find('<div id="showcase-buttons-container"')
if old_showcase_btn_start != -1:
    old_showcase_btn_end = content.find('</div>\n    </div>', old_showcase_btn_start)
    if old_showcase_btn_end != -1:
        # Erase it
        content = content[:old_showcase_btn_start] + content[old_showcase_btn_end + 16:]
        print("Removed old showcase buttons.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
