from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        iphone_13 = p.devices['iPhone 13']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            **iphone_13,
            record_video_dir="/home/jules/verification/videos/",
            record_video_size={"width": 390, "height": 844}
        )
        page = context.new_page()
        page.goto("http://localhost:3000/?section=custom")

        # Click the "CREA EL TUYO AHORA" button
        page.click('text="CREA EL TUYO AHORA"')

        # Wait for the model canvas to be ready
        page.wait_for_selector('canvas', state='visible', timeout=15000)
        page.wait_for_timeout(5000) # Give time for textures to load and render

        page.screenshot(path="/home/jules/verification/screenshots/editor_res.png", animations="allow")
        print("Captured editor view")

        browser.close()

run()
