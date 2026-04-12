import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# I see the logo overlaps with the desktop navigation menu
# Let's fix the layout of .pc-home-topbar
# I added .pc-mobile-menu-btn to be displayed inline-flex initially but we wanted it hidden on desktop

content = content.replace("""        .pc-mobile-menu-btn {
            display: none;
        }""", """        .pc-mobile-menu-btn {
            display: none !important;
        }""")

# Let's also hide the mobile menu on desktop properly
content = content.replace("""        .pc-home-mobile-dropdown {
            display: none;""", """        .pc-home-mobile-dropdown {
            display: none !important;""")

content = content.replace("""        @media (max-width: 1180px) {
            .pc-home-topbar {
                flex-wrap: wrap;
                position: relative;
            }

            .pc-mobile-menu-btn {
                display: inline-flex;
            }""", """        @media (max-width: 1180px) {
            .pc-home-topbar {
                flex-wrap: wrap;
                position: relative;
            }

            .pc-mobile-menu-btn {
                display: inline-flex !important;
            }

            .pc-home-mobile-dropdown.active {
                display: flex !important;
            }
""")

# We need to give some space for the logo in the desktop navigation
content = content.replace("""                <button type="button" class="pc-home-brand" onclick="openAuthenticatedHome(true)" style="position: absolute; left: 50%; transform: translateX(-50%); background: transparent; border: none; padding: 0; box-shadow: none;">
                    <img src="logo.svg" alt="Papelcool Logo" style="height: 32px; filter: drop-shadow(2px 2px 0px rgba(0,0,0,1));">
                </button>

                <nav class="pc-home-nav" aria-label="Navegación principal">""", """                <nav class="pc-home-nav" aria-label="Navegación principal" style="margin-right: auto;">
                    <button type="button" class="pc-home-chip" onclick="navigateToView('custom')">Crea el tuyo</button>
                    <button type="button" class="pc-home-chip" onclick="navigateToView('presets')">Colecciones</button>
                </nav>

                <button type="button" class="pc-home-brand" onclick="openAuthenticatedHome(true)" style="position: absolute; left: 50%; transform: translateX(-50%); background: transparent; border: none; padding: 0; box-shadow: none; z-index: 10;">
                    <img src="logo.svg" alt="Papelcool Logo" style="height: 32px; filter: drop-shadow(2px 2px 0px rgba(0,0,0,1));">
                </button>

                <nav class="pc-home-nav" aria-label="Navegación principal" style="margin-left: auto;">
                    <button type="button" class="pc-home-chip" onclick="scrollAuthenticatedHomeTo('home-banner-grid')">Novedades</button>
                    <button type="button" class="pc-home-chip" onclick="scrollAuthenticatedHomeTo('home-groups')">Fan Clubs</button>
                    <button type="button" class="pc-home-chip" onclick="scrollAuthenticatedHomeTo('home-community-notes')">Club Papel</button>
                </nav>""")

content = content.replace("""                <nav class="pc-home-nav" aria-label="Navegación principal">
                    <button type="button" class="pc-home-chip" onclick="navigateToView('custom')">Crea el tuyo</button>
                    <button type="button" class="pc-home-chip" onclick="navigateToView('presets')">Colecciones</button>
                    <button type="button" class="pc-home-chip" onclick="scrollAuthenticatedHomeTo('home-banner-grid')">Novedades</button>
                    <button type="button" class="pc-home-chip" onclick="scrollAuthenticatedHomeTo('home-groups')">Fan Clubs</button>
                    <button type="button" class="pc-home-chip" onclick="scrollAuthenticatedHomeTo('home-community-notes')">Club Papel</button>
                </nav>""", "") # Remove original nav block entirely as we splitted it

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated desktop navigation layout to prevent overlap.")
