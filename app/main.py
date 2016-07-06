from pathlib import Path
from flask import Flask, request, render_template
import flask

app = Flask(__name__,static_url_path = "", static_folder = "static")
app.jinja_env.autoescape = False
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
    path = filename.replace('.js', '').lower()
    with open('assets/scripts/paths/'+filename) as code:
        return "window.PathHandlers['"+path+"']=(function(){\n"+code.read()+"\n});"

@app.route('/scripts/pages/<path:filename>')
def view_script_loader(filename):
    """ Packs up page-specific code into callable closures. """
    path = filename.replace('.js', '').lower()
    with open('assets/scripts/pages/'+filename) as code:
        return "window.PageHandlers['"+path+"']=(function(){\n"+code.read()+"\n});"


@app.route('/scripts/<path:filename>')
def script_loader(filename):
    return flask.send_from_directory('assets/scripts', filename)

def get_assets(kind, ext, content=False):
    assets = {}
    p = Path('./assets/{}'.format(kind))
    for path in p.glob('**/*.{}'.format(ext)):
        name = str(path).replace('assets/'+kind+'/', '')
        if content:
            with open(str(path)) as data:
                assets[name] = data.read()
        else:
            assets[name] = ''
    return assets

@app.context_processor
def inject_assets():
    views = get_assets('views', 'html', content=True)
    named_views = {}
    scripts = []
    for k, v in views.items():
        k = k.replace('.html', '')
        k = k.replace('/', '.')
        named_views[k] = v
    for s in sorted(get_assets('scripts', 'js')):
        scripts.append('scripts/'+s)
    return dict(
        scripts=scripts,
        views=named_views.items()
    )


@app.route("/<path:path>")
def index(path=None):
    return render_template("welcome.html")



if __name__ == "__main__":
    app.debug = True
    app.run(host='0.0.0.0', port=5000)