import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_views = """        function openAuthenticatedHome(show = true) {
            ensureDeferredViews();
            document.body.classList.remove('showcase-mode');
            const authContainer = document.getElementById('auth-container');

            if (!authenticatedHomeView) {
                setTimeout(() => openAuthenticatedHome(show), 0);
                return;
            }

            if (show) {
                startShowcase();
                document.body.classList.remove('customization-active');
                if (editorPanelWrapper) editorPanelWrapper.style.display = 'none';
                if (presetsSection) presetsSection.classList.add('hidden');
                if (customizeSection) customizeSection.classList.add('hidden');
                if (fandomsOverlay) fandomsOverlay.classList.remove('active');
                hideCharacterName();

                if (canvasContainer) {
                    canvasContainer.style.display = '';
                    canvasContainer.classList.add('showcase-active');
                }

                shouldRenderScene = true;
                activeAppView = 'home';
                authenticatedHomeView.classList.add('active');
                setGlobalTopbarVisible(true);
                if (authContainer) authContainer.style.display = 'flex';
                if (userProfileView) userProfileView.style.display = 'none';
                syncAuthenticatedHomeUser();
                setTimeout(() => { onWindowResize(); }, 100);
                return;
            }

            authenticatedHomeView.classList.remove('active');
            setGlobalTopbarVisible(false);
            if (fandomsOverlay) fandomsOverlay.classList.remove('active');
        }

        function openShowcaseView() {
            openAuthenticatedHome(true);
            document.body.classList.add('showcase-mode');
            activeAppView = 'showcase';
        }"""

# Find the block from function openAuthenticatedHome to the end of openShowcaseView
start_auth = content.find("function openAuthenticatedHome(show = true) {")
end_showcase = content.find("        function openCustomizationView() {")

if start_auth != -1 and end_showcase != -1:
    content = content[:start_auth] + new_views + "\n\n" + content[end_showcase:]
    print("Replaced view functions")
else:
    print("Could not find the functions block")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
