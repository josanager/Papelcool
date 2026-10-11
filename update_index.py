import re
import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert CSS before </head>
css_block = """
    <!-- FUNKO STYLE REDESIGN OVERRIDES -->
    <style>
        /* TOPBAR FULL WIDTH FUNKO STYLE */
        #app-global-topbar {
            position: fixed; top: 0; left: 0; right: 0; z-index: 9500; display: none;
        }
        #app-global-topbar.active { display: block; }
        
        .funko-style-nav {
            display: flex; align-items: center; justify-content: space-between;
            width: 100vw; max-width: 100%; padding: 0.8rem 2rem;
            background-color: #111827;
            border-bottom: 4px solid #000;
        }
        
        .funko-nav-left, .funko-nav-right { flex: 1; display: flex; align-items: center; }
        .funko-nav-right { justify-content: flex-end; gap: 1rem; }
        .funko-nav-center { flex: 2; display: flex; justify-content: center; gap: 1.5rem; }
        
        .funko-nav-link {
            background: transparent; border: none; font-family: 'Fredoka', sans-serif;
            font-weight: 700; font-size: 1rem; color: #fff; text-transform: uppercase; cursor: pointer;
            transition: color 0.15s; letter-spacing: 0.05em;
        }
        .funko-nav-link:hover { color: #FFE600; }
        
        .funko-search {
            display: flex; align-items: center; background: #fff; border: 3px solid #000;
            border-radius: 99px; padding: 0.4rem 1rem; width: 260px; box-shadow: 3px 3px 0 #fff;
        }
        .funko-search input {
            border: none; outline: none; background: transparent; font-family: 'Fredoka', sans-serif;
            font-weight: 600; font-size: 0.9rem; color: #000; width: 100%; margin-left: 0.5rem;
        }
        .funko-avatar-btn {
            width: 44px; height: 44px; border-radius: 50%; border: 3px solid #000;
            background: #FFE600; font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 1.2rem;
            display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 0 #fff; cursor: pointer;
            margin-right: 0.5rem;
        }
        .funko-avatar-btn span { color: #000 !important; }

        /* HERO IMMERSIVE (FULL BLEED) */
        #authenticated-home-view { padding-top: 5rem; width: 100%; overflow-x: hidden; }
        .funko-hero-wrapper {
            width: 100vw; margin-left: calc(-50vw + 50%);
            background: linear-gradient(135deg, #FF4D94 0%, #FFE600 100%);
            border-bottom: 5px solid #000; position: relative; overflow: hidden;
            display: flex; align-items: center; justify-content: center;
        }
        .funko-hero-inner {
            width: min(1400px, 100%); display: flex; min-height: 480px; align-items: center; padding: 3rem 2rem;
        }
        .funko-hero-content {
            flex: 1; max-width: 600px; z-index: 2; position: relative;
        }
        .funko-hero-label {
            font-family: 'Fredoka', sans-serif; font-size: 1.2rem; font-weight: 700; color: #000; text-transform: uppercase;
            background: #fff; border: 3px solid #000; padding: 0.4rem 1rem; border-radius: 99px; display: inline-block; margin-bottom: 1.5rem;
            box-shadow: 4px 4px 0 #000;
        }
        .funko-hero-content h1 {
            font-family: 'Fredoka', sans-serif; font-size: 3.5rem; font-weight: 900; line-height: 1.1; color: #000; text-transform: uppercase; margin-bottom: 1.5rem;
            text-shadow: 3px 3px 0 #fff;
        }
        .funko-hero-content p {
            font-family: 'Montserrat', sans-serif; font-size: 1.2rem; font-weight: 600; color: #000; line-height: 1.5; margin-bottom: 2.5rem;
            background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 12px; border: 3px solid #000;
        }
        .funko-hero-cta {
            background: #fff; border: 4px solid #000; padding: 1rem 2rem; border-radius: 99px; cursor: pointer;
            font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 1.2rem; text-transform: uppercase; color: #000;
            box-shadow: 6px 6px 0 #000; transition: transform 0.1s, box-shadow 0.1s; display: inline-block;
        }
        .funko-hero-cta:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 #000; }
        .funko-hero-art {
            flex: 1; display: flex; justify-content: flex-end; align-items: flex-end; position: relative; z-index: 1; height: 100%; padding-top: 2rem;
        }
        .funko-hero-art img {
            height: 480px; width: auto; filter: drop-shadow(15px 15px 0 rgba(0,0,0,0.8)); margin-left: -50px;
        }

        /* NEW PICKS FOR YOU SECTION */
        .funko-section { width: min(1400px, 100%); margin: 4rem auto 2rem; padding: 0 2rem; }
        .funko-section h2 {
            text-align: center; font-family: 'Fredoka', sans-serif; font-size: 2.8rem; font-weight: 900; color: #111827; text-transform: uppercase; margin-bottom: 3rem;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
        }
        .funko-new-picks-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 2rem;
        }
        .funko-card {
            background: #fff; border: 4px solid #000; border-radius: 16px; position: relative; overflow: hidden;
            display: flex; flex-direction: column; cursor: pointer; transition: transform 0.2s; box-shadow: 0 0 0 #000;
        }
        .funko-card:hover { transform: translateY(-5px); box-shadow: 8px 8px 0 #000; }
        .funko-card-ribbon {
            position: absolute; top: 18px; left: -32px; background: #FF4D94; border: 2px solid #000; color: #fff;
            padding: 4px 35px; font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; transform: rotate(-45deg); z-index: 10;
        }
        .funko-card-ribbon.exclusive { background: #FFE600; color: #000; }
        .funko-card-heart {
            position: absolute; top: 12px; right: 12px; z-index: 10; color: #000; opacity: 0.3; transition: opacity 0.2s;
        }
        .funko-card-heart .material-symbols-outlined { font-size: 32px; font-variation-settings: 'FILL' 0; }
        .funko-card:hover .funko-card-heart { opacity: 1; color: #FF4D94; font-variation-settings: 'FILL' 1;}
        .funko-card-img-container {
            background: #f8fafc; width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
            border-bottom: 4px solid #000;
        }
        .funko-card-img-container img { width: 85%; object-fit: contain; filter: drop-shadow(5px 5px 0 rgba(0,0,0,0.5)); transition: transform 0.3s; }
        .funko-card:hover .funko-card-img-container img { transform: scale(1.1); }
        .funko-card-info { padding: 1.25rem; }
        .funko-card-info h3 { font-family: 'Fredoka', sans-serif; font-size: 1.3rem; font-weight: 800; color: #000; margin: 0 0 0.3rem; text-transform: uppercase; }
        .funko-card-info p { font-family: 'Montserrat', sans-serif; font-size: 0.95rem; font-weight: 600; color: #475569; margin: 0; }

        /* FANDOMS 4-COL GRID */
        .funko-banners-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;
        }
        .funko-banner-card {
            border: 4px solid #000; border-radius: 16px; overflow: hidden; position: relative; height: 500px;
            display: flex; flex-direction: column; cursor: pointer; transition: transform 0.2s;
        }
        .funko-banner-card:hover { transform: translateY(-5px); box-shadow: 10px 10px 0 #000; }
        .funko-banner-card-top { flex: 1; padding: 2.5rem 1.5rem; position: relative; z-index: 2; display: flex; flex-direction: column; }
        .funko-banner-tag {
            font-family: 'Fredoka', sans-serif; font-size: 1rem; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.9); margin-bottom: 0.5rem; letter-spacing: 0.05em; text-shadow: 2px 2px 0 #000;
        }
        .funko-banner-card h3 {
            font-family: 'Fredoka', sans-serif; font-size: 2.5rem; font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 1rem; text-shadow: 3px 3px 0 #000; text-transform: uppercase;
        }
        .funko-banner-card p {
            font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 600; color: #f8fafc; line-height: 1.4; flex-grow: 1; text-shadow: 2px 2px 0 #000;
        }
        .funko-banner-shop-btn {
            align-self: flex-start; background: #fff; border: 4px solid #000; padding: 0.8rem 1.8rem; border-radius: 99px;
            font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 1rem; color: #000; text-transform: uppercase; box-shadow: 4px 4px 0 #000;
            transition: transform 0.1s; margin-top: auto;
        }
        .funko-banner-card:hover .funko-banner-shop-btn { transform: scale(1.05); }
        .funko-banner-card-art {
            position: absolute; bottom: -20px; left: 0; width: 100%; display: flex; justify-content: center; z-index: 1;
        }
        .funko-banner-card-art img { height: 280px; filter: drop-shadow(8px 8px 0 rgba(0,0,0,0.8)); margin: 0 -15px; }

        @media (max-width: 1180px) {
            .funko-nav-center { display: none !important; }
            .funko-banners-grid { grid-template-columns: repeat(2, 1fr); }
            .funko-hero-inner { flex-direction: column; text-align: center; padding: 2rem; }
            .funko-hero-art { margin-top: 2rem; justify-content: center; }
            .funko-hero-art img { margin: 0; height: 350px; }
            .funko-hero-content { margin-top: 2rem; }
        }
        @media (max-width: 768px) {
            .funko-nav-right .funko-search { display: none !important; } 
            .funko-banners-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
"""
content = re.sub(r'</head>', css_block, content, count=1)


# 2. Replace the HTML topbar
topbar_start = content.find('<div id="app-global-topbar">')
topbar_end = content.find('</div>\n    </div>\n\n    <!-- Authentication Modal')
if topbar_end != -1:
    # include the two closing divs
    topbar_end += 13

topbar_replacement = """<div id="app-global-topbar">
        <header class="funko-style-nav">
            <!-- Mobile Menu -->
            <button type="button" id="app-mobile-menu-btn" class="pc-home-icon pc-mobile-menu-btn" aria-label="Menú" onclick="document.getElementById('app-mobile-dropdown-menu').classList.toggle('active')">
                <span class="material-symbols-outlined">menu</span>
            </button>

            <!-- Logo (Left) -->
            <div class="funko-nav-left">
                <button type="button" class="pc-home-brand" onclick="navigateToView('home')" style="border: none; background: transparent; cursor: pointer;">
                    <img src="logo.svg" alt="Papelcool Logo" style="height: 38px; filter: drop-shadow(3px 3px 0px rgba(0,0,0,1)); display: block;">
                </button>
            </div>

            <!-- Nav (Center) -->
            <nav class="funko-nav-center" aria-label="Navegación principal">
                <button type="button" class="funko-nav-link" onclick="navigateToView('custom')">Crea el tuyo</button>
                <button type="button" class="funko-nav-link" onclick="navigateToView('presets')">Colecciones</button>
                <button type="button" class="funko-nav-link" onclick="navigateToView('home'); setTimeout(() => scrollAuthenticatedHomeTo('home-banner-grid'), 0)">Novedades</button>
                <button type="button" class="funko-nav-link" onclick="navigateToView('home'); setTimeout(() => scrollAuthenticatedHomeTo('home-groups'), 0)">Fan Clubs</button>
                <button type="button" class="funko-nav-link" onclick="navigateToView('home'); setTimeout(() => scrollAuthenticatedHomeTo('home-community-notes'), 0)">Club Papel</button>
            </nav>

            <!-- Search & Actions (Right) -->
            <div class="funko-nav-right">
                <label class="funko-search" aria-label="Buscar">
                    <span class="material-symbols-outlined">search</span>
                    <input type="text" id="global-search-input" placeholder="Busca ideas o fandoms..." />
                </label>
                <button type="button" class="funko-avatar-btn" onclick="toggleUserDropdown()" aria-label="Perfil">
                    <span id="global-profile-initial">P</span>
                </button>
            </div>

            <!-- Mobile Dropdown -->
            <div id="app-mobile-dropdown-menu" class="pc-home-mobile-dropdown">
                <button type="button" class="pc-home-chip" onclick="navigateToView('custom'); document.getElementById('app-mobile-dropdown-menu').classList.remove('active')">Crea el tuyo</button>
                <button type="button" class="pc-home-chip" onclick="navigateToView('presets'); document.getElementById('app-mobile-dropdown-menu').classList.remove('active')">Colecciones</button>
                <button type="button" class="pc-home-chip" onclick="navigateToView('home'); document.getElementById('app-mobile-dropdown-menu').classList.remove('active'); setTimeout(() => scrollAuthenticatedHomeTo('home-banner-grid'), 0)">Novedades</button>
                <button type="button" class="pc-home-chip" onclick="navigateToView('home'); document.getElementById('app-mobile-dropdown-menu').classList.remove('active'); setTimeout(() => scrollAuthenticatedHomeTo('home-groups'), 0)">Fan Clubs</button>
                <button type="button" class="pc-home-chip" onclick="navigateToView('home'); document.getElementById('app-mobile-dropdown-menu').classList.remove('active'); setTimeout(() => scrollAuthenticatedHomeTo('home-community-notes'), 0)">Club Papel</button>
            </div>
        </header>
    </div>"""

if topbar_start != -1 and topbar_end != -1:
    content = content[:topbar_start] + topbar_replacement + content[topbar_end:]

# 3. Replace the HTML authenticated-home-view
auth_home_start = content.find('<div id="authenticated-home-view">')
auth_home_end = content.find('<!-- USER PROFILE VIEW (Hidden by default) -->')

auth_home_replacement = """<div id="authenticated-home-view">
        <main>
            <!-- Hero Banner -->
            <div id="home-top"></div>

            <!-- New Picks For You -->
            <section class="funko-section">
                <h2>Ediciones del momento</h2>
                <div class="funko-new-picks-grid" id="home-collection-grid"></div>
            </section>

            <!-- Fandom / Banners Area -->
            <section class="funko-section">
                <h2>Papelcool Originals & Fandoms</h2>
                <div class="funko-banners-grid" id="home-banner-grid"></div>
            </section>
        </main>
        
        <nav class="pc-home-mobile-nav" aria-label="Navegación móvil" style="z-index: 1000;">
            <button type="button" class="pc-home-chip" onclick="window.scrollTo({top:0, behavior:'smooth'})">Home</button>
            <button type="button" class="pc-home-chip" onclick="navigateToView('custom')">Custom</button>
            <button type="button" class="pc-home-chip" onclick="navigateToView('presets')">Colección</button>
            <button type="button" class="pc-home-chip" onclick="toggleUserDropdown()">Perfil</button>
        </nav>
    </div>

    """

if auth_home_start != -1 and auth_home_end != -1:
    content = content[:auth_home_start] + auth_home_replacement + content[auth_home_end:]


# 4. Modify renderAuthenticatedHome JS
# Replace the body of function renderAuthenticatedHome()
js_start = content.find('function renderAuthenticatedHome() {')
js_end = content.find('// Fandoms Dropdown')

if js_start != -1 and js_end != -1:
    new_js = """function renderAuthenticatedHome() {
            ensureDeferredViews();
            const heroTop = document.getElementById('home-top');
            const collectionGrid = document.getElementById('home-collection-grid');
            const bannerGrid = document.getElementById('home-banner-grid');

            if (heroTop) {
                // Hardcoded the hero banner to match 'Anyone for Tennis?'
                heroTop.innerHTML = `
                    <div class="funko-hero-wrapper">
                        <div class="funko-hero-inner">
                            <div class="funko-hero-content">
                                <span class="funko-hero-label">POP! YOURSELF</span>
                                <h1>Hola josanager,<br>hoy toca estrenar vitrina</h1>
                                <p>Recreate the fan in your life as a customised Papelcool! It's sure to be an amazing match.<br>Empieza con el editor de customización Pop-Art.</p>
                                <button type="button" class="funko-hero-cta" onclick="navigateToView('custom')">CREA EL TUYO AHORA</button>
                            </div>
                            <div class="funko-hero-art">
                                <img src="logo.svg" alt="Char 1" style="z-index: 2;" onerror="this.src='webclip.png'">
                            </div>
                        </div>
                    </div>
                `;
            }

            if (collectionGrid) {
                // Mix the collections for 'New Picks'
                const combined = [...authenticatedHomeCollections, {name: 'Zoey', subtitle: 'New Arrival'}];
                collectionGrid.innerHTML = combined.map((card, i) => {
                    const tagClass = i % 2 === 0 ? "funko-card-ribbon" : "funko-card-ribbon exclusive";
                    const tagText = i % 2 === 0 ? "NEW IN" : "WEB EXCLUSIVE";
                    return `
                    <article class="funko-card" onclick="navigateToView('presets')">
                        <div class="${tagClass}">${tagText}</div>
                        <div class="funko-card-heart"><span class="material-symbols-outlined">favorite</span></div>
                        <div class="funko-card-img-container">
                            <img src="${getPresetIconSource(card.name)}" alt="${card.name}" loading="lazy" onerror="this.src='webclip.png'">
                        </div>
                        <div class="funko-card-info">
                            <h3>${card.name}</h3>
                            <p>${card.subtitle}</p>
                        </div>
                    </article>
                `}).slice(0, 5).join('');
            }

            if (bannerGrid) {
                // Render the 4 columns
                const banners = [
                    { title: "Time for a Takedown", tag: "KPOP DEMON HUNTERS", body: "Display your idols with official collectibles.", color: "#B8860B", art: ["Mira", "Rumi"] },
                    { title: "Ready, Set, Morph!", tag: "POWER RANGERS", body: "Power up your collection with new arrivals.", color: "#556B2F", art: ["Zoey"] },
                    { title: "New to the Crew", tag: "ONE PIECE", body: "Set sail for new collectibles to complete your anime display.", color: "#8B4513", art: ["Baby", "Abby"] },
                    { title: "Make an Entrance", tag: "WWE", body: "New collectibles have entered the ring.", color: "#8B0000", art: ["Steve", "Jinu"] }
                ];
                bannerGrid.innerHTML = banners.map(b => `
                    <article class="funko-banner-card" style="background: ${b.color};">
                        <div class="funko-banner-card-top">
                            <span class="funko-banner-tag">${b.tag}</span>
                            <h3>${b.title}</h3>
                            <p>${b.body}</p>
                            <button type="button" class="funko-banner-shop-btn" onclick="navigateToView('presets')">VER COLECCIÓN</button>
                        </div>
                        <div class="funko-banner-card-art">
                            ${b.art.map(name => `<img src="${getPresetIconSource(name)}" alt="${name}" onerror="this.src='webclip.png'">`).join('')}
                        </div>
                    </article>
                `).join('');
            }
        }

        """
    content = content[:js_start] + new_js + content[js_end:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
