# Analysis in Wasmer cloud demo

## What is this???

WebAssembly (Wasm) is an assembly language and virtual machine that is available in modern browsers. It's supposed to be nearly as fast as native machine code. So you can compile a C (or Rust or Go) function to Wasm, and call it from JavaScript, allowing you to create web apps that do heavy and complicated computations (e.g., game engines).

Running Python code in the browser is a bit harder. There's no easy way to compile Python directly to machine code, whether Wasm or x86 (although some people are trying, e.g. Nuitka). Instead, various projects have tried to take the CPython or PyPy interpreter, and compile _that_ to Wasm, and use it to run your Python code. They also have to handle things like opening "files," which don't exist in Wasm but are needed for a functioning Python interpreter.

It'd be really cool if we can get this to work because then we'd be able to run our Opentrons API and engine code directly in the browser. That would let us do things like analyze protocols in the user's browser. Less ambitiously, we'd be able to run pieces of Python code like `TransferComponentsExecutor` or the stacking logic in the browser, so apps like Protocol Designer could just call the Python function instead of reimplementing the logic in JavaScript.

Meanwhile, cloud computing providers are interested in Wasm as a leaner "unit of work" to run. Briefly: in the beginning, cloud providers would rent you an entire **virtual machine**, but that's slow and expensive because you'd have to ship everything from the operating system on up, and it would take minutes for your virtual machine to boot up before it could start doing the work that you want. Then **containers** became the new hotness, where you bundle up your program and libries and environment, but you share an operating system with the other containers running on the machine --- a Python container can cold-start in a handful of seconds. With **Wasm**, a cloud provider could potentially run Wasm programs from different clients in the same container, making them even faster to start, because the Wasm enviornment itself guarantees isolation.

Wasmer is a startup cloud hosting provider that runs Wasm programs in their cloud, called "Wasmer Edge."

This branch contains a small web ([`main.py`](main.py)) server that runs on Wasmer Edge. The web server has an endpoint where you can `POST` a protocol, and it'll analyze the protocol in the cloud.

## Building and deploying

Pick a clean directory for the build such as `~/wasmer/`. Everything in this directory will get sent to Wasmer's cloud build service.

### 1. Directory setup

Populate the directory with the contents of `opentrons/api/src`:

```sh
cp -R ~/opentrons/api/src/ ~/wasmer/
```

Also copy `shared-data` into the build directory:

```sh
cp -R ~/opentrons/shared-data ~/wasmer/
```

Move `shared-data/python/opentrons_shared_data` into the top level of the build directory. This way, when you run a Python program from the build directory, and it says `from opentrons_shared_data import ...`, it will find `opentrons_shared_data`:

```sh
mv ~/wasmer/shared-data/python/opentrons_shared_data ~/wasmer/
```

Your build directory should now look like this:

- [`main.py`](main.py)
- [`requirements.txt`](requirements.txt) (I made this based on [`api/pyproject.toml`](../pyproject.toml))
- [`app.yml`](app.yaml) (This tells Wasmer the name of our app and other configuration)
- `opentrons/`
- `opentrons_shared_data/`
- `shared-data/`

### 2. Don't import serial

Our function `serial_communication.get_ports_by_name()` imports `serial`, which tries to do things like `fcntl()` that are not supported inside the Wasm environment. This branch has already commented out the offending imports, which are in:

- [`api/src/opentrons/__init__.py`](opentrons/__init__.py)
- [`api/src/opentrons/drivers/smoothie_drivers/driver_3_0.py`](opentrons/drivers/smoothie_drivers/driver_3_0.py)

### 3. Hacking NumPy

Wasmer has done the hard work of building and tweaking the Python packages we need to run in the Wasm environment, including things like Pydantic and NumPy. Unfortunately, their verison of NumPy has a small bug: if you use it as-is, you'll get the error:

```
File "/opt/venv/lib/python3.13/site-packages/numpy/__init__.py", line 481, in <module>
  del sys, warnings, os
NameError: name 'os' is not defined. Did you forget to import 'os'?
```

So we're going to edit that file to fix the offending line of code. Download the NumPy 1.26.5 wheel from Wasmer's package repository: https://pythonindex.wasix.org/simple/numpy/index.html. Extract it into your the build directory, and edit `numpy/__init__.py`:

```sh
unzip -d ~/wasmer ~/Downloads/numpy-1.26.5-cp313-cp313-wasix_wasm32.whl
```

Change the last line of `numpy/__init__.py`:

```diff
--- __init__.py
+++ __init__.py
@@ -480,2 +480,2 @@
 # Remove symbols imported for internal use
-del sys, warnings, os
+del sys, warnings
```

This is wild and hacky. Because this edited `numpy/` is in the same directory as our web app, Python finds it first when importing.

### 4. Do a bit of cleanup

Remove some files that aren't needed for analysis in the cloud, to reduce the size of the deploy:

```sh
find ~/wasmer -name __pycache__ -type d | xargs rm -r
find ~/wasmer -name node_modules -type d | xargs rm -r
find ~/wasmer/shared-data -name fixtures -type d | xargs rm -r
rm -r ~/wasmer/shared-data/js
rm -r ~/wasmer/shared-data/python_tests
rm -r ~/wasmer/shared-data/labware/images
rm -r ~/wasmer/shared-data/.venv
rm -r ~/wasmer/shared-data/lib
find ~/wasmer/numpy -name tests -type d | xargs rm -r
```

### 5. Build and deploy

Build and deloy with the Wasmer CLI tool. (You'll have to install the Wasmer CLI first, and create an account.)

```
wasmer deploy --verbose

> No wasmer.toml manifest found in /Users/.../wasmer. Deploy with a remote build instead?
yes

> Creating deployment archive from /Users/.../wasmer...
> Packaging project directory (2509 files, 24.3 MB)
> Requesting upload target...
> Uploading archive (24.3 MB bytes) to Wasmer...
> Determining build configuration...
> ...
```

Wasmer takes the files in our directory, uploads them into their cloud builder, starts a Docker container to do the build, and adds in all the Python packages listed in [`requirements.txt`](requirements.txt).

The resulting Wasm binary runs the command `python -m uvicorn main:app --host ... --port ...`, which invokes our code in [`main.py`](main.py).

## Paste

```sh
mkdir ~/staging
git --git-dir ~/opentrons/.git --work-tree ~/staging checkout wasmercloud -- api/src/ shared-data/
cp ~/{opentrons,staging}/api/src/opentrons/_version.py
cp ~/{opentrons,staging}/shared-data/python/opentrons_shared_data/_version.py

mv ~/staging/api/src ~/wasmer
mv ~/staging/shared-data ~/wasmer/
rm -r ~/staging
mv ~/wasmer/shared-data/python/opentrons_shared_data ~/wasmer/

unzip -d ~/wasmer ~/Downloads/numpy-1.26.5-cp313-cp313-wasix_wasm32.whl
sed -i '' 's/^del sys, warnings, os/del sys, warnings/' ~/wasmer/numpy/__init__.py
find ~/wasmer/numpy -name tests -type d | xargs rm -r

find ~/wasmer/shared-data -name fixtures -type d | xargs rm -r
rm -r ~/wasmer/shared-data/js
rm -r ~/wasmer/shared-data/python_tests
rm -r ~/wasmer/shared-data/labware/images

cd ~/wasmer
wasmer deploy --verbose
```
