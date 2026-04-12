# The issue is that the mock I injected was an array of objects but the implementation uses an array of strings (the names).
# So the mock in my python test just broke it and displayed [object Object] because it passed objects instead of strings!
# Let me re-run the test with correct mock data.
