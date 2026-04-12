from playwright.sync_api import sync_playwright

def verify_home_desktop():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Load the local HTML file
        page.goto('http://localhost:8000/index.html')

        # Wait for initialization (simulating authenticated state)
        page.evaluate("openAuthenticatedHome(true)")

        # Set viewport to desktop
        page.set_viewport_size({"width": 1280, "height": 800})
        page.wait_for_timeout(2000)

        # Take screenshot of the top navigation
        page.screenshot(path='/home/jules/verification/screenshots/home_desktop_nav_fixed.png', animations="allow")

        # Set viewport to mobile
        page.set_viewport_size({"width": 375, "height": 812})
        page.wait_for_timeout(1000)

        # Take screenshot of mobile nav
        page.screenshot(path='/home/jules/verification/screenshots/home_mobile_nav_fixed.png', animations="allow")

        # Open mobile menu
        page.evaluate("document.getElementById('mobile-dropdown-menu').classList.toggle('active')")
        page.wait_for_timeout(500)

        # Take screenshot of mobile menu open
        page.screenshot(path='/home/jules/verification/screenshots/home_mobile_nav_open_fixed.png', animations="allow")

        browser.close()

if __name__ == '__main__':
    verify_home_desktop()
