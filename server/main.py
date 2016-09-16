import logging
import os
import sys
sys.path.insert(0, os.path.abspath('..'))

import flask
from flask import Flask, render_template
from flask_socketio import SocketIO

from opentrons_sdk.protocol import Protocol

from server.helpers import get_assets, get_frozen_root
from server.process_manager import run_once


protocol = Protocol()
motor_handler = protocol.attach_motor()


TEMPLATES_FOLDER = os.path.join(get_frozen_root() or '', 'templates')
STATIC_FOLDER = os.path.join(get_frozen_root() or '', 'static')

app = Flask(__name__,
            static_folder=STATIC_FOLDER,
            template_folder=TEMPLATES_FOLDER
            )

app.jinja_env.autoescape = False
socketio = SocketIO(app, async_mode='gevent')

# welcome route for connecting to robot
@app.route("/welcome/<path:path>")
def welcome(path):
    return render_template("welcome.html")

# welcome route for uploading protocol
@app.route("/upload/<path:path>")
def upload(path):
    return render_template("upload.html")

# wizard template loader
@app.route("/protocol_setup/<path:path>")
def protocol_setup(path):
    return render_template("protocol_setup.html")

@app.route('/scripts/paths/<path:filename>')
def page_script_loader(filename):
    """ Packs up page-specific code into callable closures. """
    root = get_frozen_root() or app.root_path
    page_scripts_root = os.path.join(root, 'assets', 'scripts', 'paths')
    path = filename.replace('.js', '').lower()
    with open(os.path.join(page_scripts_root, filename)) as code:
        return "window.PathHandlers['"+path+"']=(function(){\n"+code.read()+"\n});"

@app.route('/scripts/pages/<path:filename>')
def view_script_loader(filename):
    """ Packs up page-specific code into callable closures. """
    path = filename.replace('.js', '').lower()
    root = get_frozen_root() or app.root_path
    page_scripts_root = os.path.join(root, 'assets', 'pages', 'paths')
    with open(os.path.join(page_scripts_root, filename)) as code:
        return "window.PageHandlers['"+path+"']=(function(){\n"+code.read()+"\n});"

@app.route('/scripts/<path:filename>')
def script_loader(filename):
    root = get_frozen_root() or app.root_path
    scripts_root_path = os.path.join(root, 'assets', 'scripts')
    return flask.send_from_directory(scripts_root_path, filename)

@app.context_processor
def inject_assets():
    root = get_frozen_root() or app.root_path

    views = get_assets(root, 'views', 'html', content=True)
    named_views = {}
    for k, v in views.items():
        k = k.replace('.html', '')
        k = k.replace('/', '.')
        named_views[k] = v

    scripts = list(sorted(get_assets(root, 'scripts', 'js')))

    return dict(
        scripts=scripts,
        views=named_views.items()
    )


@app.route("/<path:path>")
def index(path=None):
    return render_template("welcome.html")

# Here's the magic.
@socketio.on('connect_serial')
def handle_connect_serial(data):
    motor_handler.connect(data['port'])
    motor_handler.move_motors(x=10, y=10, z=10)

@socketio.on('move')
def handle_move(coords):
    for k in coords:
        coords[k] = int(coords[k])
    motor_handler.move_motors(**coords)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)-8s %(message)s',
    datefmt='%d-%m-%y %H:%M:%S'
)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        data_dir = sys.argv[1]
    else:
        data_dir = os.getcwd()

    IS_DEBUG = os.environ.get('DEBUG', '').lower() == 'true'
    if not IS_DEBUG:
        run_once(data_dir)

    socketio.run(
        app,
        debug=IS_DEBUG,
        port=5000
    )
