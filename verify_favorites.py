from playwright.sync_api import sync_playwright
import time
import json

def verify_favorites():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to home page...")
        page.goto('http://localhost:8000/index.html')

        print("Bypassing initial screens...")
        page.evaluate("openAuthenticatedHome(true)")
        time.sleep(1)

        print("Adding a favorite with correct schema (array of strings)...")
        # the favorites are just string names of characters
        favorite_mock = ["Papelcool Original", "Cyberpunk", "Fantasy Hero"]
        page.evaluate(f"localStorage.setItem('papelcool_favorites', '{json.dumps(favorite_mock)}')")

        print("Opening favorites filled view...")
        page.evaluate("openFavoritesView()")
        time.sleep(1)
        page.screenshot(path='/home/jules/verification/screenshots/favorites_filled_fixed.png', full_page=True, animations="allow")

        browser.close()

if __name__ == "__main__":
    verify_favorites()
