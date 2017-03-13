source bin/activate "$(pwd)"; pip install --upgrade $1 ; python -c 'from opentrons import server; server.start()'
