import re

with open('index.html', 'r') as f:
    content = f.read()

# I need to find the item.name interpolation in renderFavorites()
# Let's see what's in index.html exactly.
