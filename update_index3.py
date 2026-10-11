import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace everything from `</div>\n                <div style="min-width: 0;">` down to the end of file
start_idx = content.find('                <div style="min-width: 0;">')
if start_idx != -1:
    # Find the closing tag of the landing view before this
    landing_end = content.find('</div>', start_idx - 10)
    
    tail = """    <!-- USER PROFILE VIEW (Hidden by default) -->
    <div id="user-profile-view" style="display: none; position: fixed; inset: 0; z-index: 9000; overflow-y: auto; background: linear-gradient(135deg, #E0F2FE 0%, #F8FAFC 100%); color: var(--pc-ink);">
        <!-- bg floating shapes -->
        <div style="position: fixed; top: 10%; right: -50px; width: 300px; height: 300px; background: #FFE600; opacity: 0.2; clip-path: polygon(10% 0%, 100% 5%, 90% 95%, 5% 100%); transform: rotate(12deg); pointer-events: none; z-index: 0;"></div>
        <div style="position: fixed; bottom: -50px; left: -50px; width: 400px; height: 400px; background: #407BFF; opacity: 0.15; clip-path: polygon(5% 15%, 95% 0%, 100% 85%, 15% 100%); transform: rotate(-12deg); pointer-events: none; z-index: 0;"></div>

        <div class="pc-home-shell" style="min-height: 100vh; padding: 6rem 2rem 2rem; max-width: 900px; margin: 0 auto; position: relative; z-index: 10;">
            <section class="ui-panel" style="background: white; border: 4px solid black; border-radius: 20px; box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1); padding: 2rem; display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; margin-bottom: 2rem; position: relative;">
                
                <!-- Avatar Sticker -->
                <div style="width: 140px; height: 140px; border-radius: 50%; border: 4px solid #000; overflow: hidden; box-shadow: 6px 6px 0 rgba(0,0,0,1); background: #FFE600; display: flex; align-items: center; justify-content: center; transform: rotate(-3deg);">
                    <span id="profile-avatar-initial" style="font-family: 'Fredoka', sans-serif; font-size: 4rem; font-weight: 800; color: #000;">U</span>
                </div>
                
                <div style="flex: 1; min-width: 250px;">
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <h2 id="profile-username" style="font-family: 'Fredoka', sans-serif; font-size: 2.5rem; font-weight: 900; margin: 0; color: #000; text-transform: uppercase;">Username</h2>
                        <span id="profile-handle" style="font-family: 'Fredoka', sans-serif; font-size: 1.2rem; font-weight: 700; color: #FF4D94; border: 3px solid #000; border-radius: 99px; padding: 0.2rem 0.8rem; background: white; box-shadow: 3px 3px 0 #000;">@username</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 1rem;">
                        <div style="background: #E0F2FE; border: 3px solid #000; padding: 0.5rem 1rem; border-radius: 12px; box-shadow: 3px 3px 0 #000; text-align: center;">
                            <strong id="profile-favorites-count" style="display: block; font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #000;">0</strong>
                            <span style="font-family: 'Fredoka', sans-serif; font-size: 0.9rem; color: #000; font-weight: 700; text-transform: uppercase;">Favoritos</span>
                        </div>
                        <div style="background: #E0F2FE; border: 3px solid #000; padding: 0.5rem 1rem; border-radius: 12px; box-shadow: 3px 3px 0 #000; text-align: center;">
                            <strong id="profile-customs-count" style="display: block; font-family: 'Fredoka', sans-serif; font-size: 1.5rem; color: #000;">0</strong>
                            <span style="font-family: 'Fredoka', sans-serif; font-size: 0.9rem; color: #000; font-weight: 700; text-transform: uppercase;">Customs</span>
                        </div>
                    </div>
                    <p id="profile-status" style="font-family: 'Montserrat', sans-serif; font-size: 1.1rem; line-height: 1.45; margin: 0 0 1rem; color: #000; font-weight: 600;">Coleccionando favoritos y creando nuevos Papelcool.</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
                        <span id="profile-email" style="font-family: 'Montserrat', sans-serif; font-size: 0.95rem; font-weight: 700; color: #555;"></span>
                        <span id="profile-joined" style="font-family: 'Montserrat', sans-serif; font-size: 0.95rem; font-weight: 700; color: #555;"></span>
                    </div>
                </div>
            </section>

            <div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 2rem;">
                <button id="tab-favorites" class="icon-btn active" style="flex: 1; max-width: 250px; text-align: center; justify-content: center; padding: 1rem; font-family: 'Fredoka', sans-serif; font-size: 1.2rem; font-weight: 700; text-transform: uppercase; background: #FFE600; cursor: pointer; border: 4px solid #000; box-shadow: 4px 4px 0 #000; border-radius: 12px; transition: transform 0.1s;" onmousedown="this.style.transform='translate(2px, 2px)'; this.style.boxShadow='2px 2px 0 #000';" onmouseup="this.style.transform='translate(0, 0)'; this.style.boxShadow='4px 4px 0 #000';" onclick="switchProfileTab('favorites')">
                    Favoritos
                </button>
                <button id="tab-customs" class="icon-btn" style="flex: 1; max-width: 250px; text-align: center; justify-content: center; padding: 1rem; font-family: 'Fredoka', sans-serif; font-size: 1.2rem; font-weight: 700; text-transform: uppercase; background: white; cursor: pointer; border: 4px solid #000; box-shadow: 4px 4px 0 #000; border-radius: 12px; transition: transform 0.1s;" onmousedown="this.style.transform='translate(2px, 2px)'; this.style.boxShadow='2px 2px 0 #000';" onmouseup="this.style.transform='translate(0, 0)'; this.style.boxShadow='4px 4px 0 #000';" onclick="switchProfileTab('customs')">
                    Customs
                </button>
            </div>

            <main id="profile-content-area" style="padding: 0;">
                <!-- Content injected via JS -->
            </main>
        </div>
    </div>

</body>
</html>
"""
    content = content[:landing_end + 6] + "\n" + tail
    print("Fixed profile view tail!")

# Ensure body.customization-active hides the landing view properly
content = content.replace("body.customization-active #authenticated-home-view { display: none !important; }", "body.customization-active #authenticated-home-view { display: none !important; }")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
