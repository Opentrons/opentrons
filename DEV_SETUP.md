# Development Environment Setup

This guide provides a set of opinionated instructions for setting up your computer to work on the software in Opentrons/opentrons. You can choose to set up your machine in a different way with different tools if you desire, but this setup is tested and recommended.

If you notice a discrepancy between these instructions and any instructions in the documentation of tools we reference below, please [file an issue][] or [open a pull request][]!

## System Setup

You will need the following tools installed to develop on the Opentrons platform.

- make
- git
- curl
- ssh
- pyenv (see below) with a recent interpreter of your choice, like 3.10
- Node.js v14

### pyenv

In the past, we recommended pyenv on macos and linux because it made it convenient to install the specific version of python used by our stack. However, we now support so many environments, with different versions of python, that we rely on pyenv internally - and its integration with pipenv - to manage the different interpreters we require. You should now install it on all platforms.

On linux and OSX, use [pyenv][pyenv] (the link has install instructions). On Windows, use [pyenv-win][pyenv-win] which similarly has instructions on installation in the link.

Note: if your system python is 3.10 or 3.8, make sure that you use pyenv to install an interpreter at that minor version with a higher bugfix version than the system; otherwise pipenv will use the wrong one, which will break native code dependencies.

For instance, if your system provides 3.10.6, make sure you use pyenv to install 3.10.7 or higher.

### macOS

On macOS, we rely on:

- [Homebrew][brew] to install general dependencies, like `git`
- [Node Version Switcher][nvs] to install and manage Node.js
- [pyenv][pyenv] to install and manage Python

The setup below is compatible with both Intel and ARM (e.g. M1) machines. It assumes you are using the system default shell of `zsh`.

#### 0. Install `brew` and general dependencies

[Homebrew][brew] is a package manager for macOS, and it is useful to install language-agnostic development tools. Installing the `brew` command will also install the [Xcode Command Line tools][], which are required for development on macOS.

1. Go to [https://brew.sh][brew]
2. Copy and run the install script
3. Follow any directions given to you by the install script

At the end of installation, `brew` will print off a set of "next steps" that you need to run. **Make sure you run these steps**, or your installation of `brew` won't work!

```shell
**==>** **Next steps:**
- Run these two commands in your terminal to add Homebrew to your **PATH**:
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/username/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
- Run **brew help** to get started
- Further documentation:
    https://docs.brew.sh
```

Once you have run these commands, close and re-open your terminal to confirm that `brew` is properly installed:

```shell
brew --version
```

Once `brew` is installed, you can use it to make sure you have the latest version of `git` installed:

```shell
brew install git
```

If you haven't used `git` before, **be sure to complete [first-time Git setup][]**.

#### 1. Install Node.js

Our recommended installation instructions for Node.js differ between `x86_64` (Intel) and `ARM` (M1) Macs.

##### x86-64 Mac (Intel)

On x86, we recommend [nvs][] to install Node.js because it works well and is compatible with macOS, Windows, and Linux.

1. Go to [https://github.com/jasongin/nvs][nvs]
2. Follow the instructions for "Mac, Linux" setup

```shell
export NVS_HOME="$HOME/.nvs"
git clone https://github.com/jasongin/nvs "$NVS_HOME"
. "$NVS_HOME/nvs.sh" install
```

Close and re-open your terminal to confirm `nvs` is installed.

```shell
nvs --version
```

Now we can use nvs to install Node.js v14 and switch on `auto` mode, which will make sure Node.js v14 is used any time we're in the `opentrons` project directory.

```shell
nvs add 14
nvs auto on
```

If the `nvs` command isn't working, confirm that your shell is set up properly. If you print out the contents of `~/.zshrc`, you should see something similar to the following:

```shell
# ~/.zshrc
# ...
export NVS_HOME="$HOME/.nvs"
[ -s "$NVS_HOME/nvs.sh" ] && . "$NVS_HOME/nvs.sh"
# ...
```

##### ARM Mac (M1)

If you are running an ARM (M1) Mac, you **should not use `nvs` nor `nvm`**, because those tools do not have access to Node.js v14 for the ARM architecture. Until we upgrade to version 16 or higher, you need to use an alternative installation method for Node.js.

Fortunately, you can use `brew` to install an ARM-native version of Node v14.

```shell
brew install node@14
```

Once `brew` finishes installing Node, it will print one additional step to complete the installation to ensure your system selects the proper Node executable to use.

```shell
echo 'export PATH="/opt/homebrew/opt/node@14/bin:$PATH"' >> ~/.zshrc
```

Close and re-open your terminal to confirm that the correct version of Node is installed for the correct architecture.

```shell
node -e "console.log(process.version, process.arch)"
# > v14.19.1 arm64
```

If your `node` command isn't working or is printing the wrong information, confirm that your shell is set up properly. If you print out the contents of `~/.zshrc`, you should see something similar to the following:

```shell
# ~/.zshrc
# ...
export PATH="/opt/homebrew/opt/node@14/bin:$PATH"
# ...
```

#### 2. Install `pyenv` Python build dependencies and Python

1. Go to [https://github.com/pyenv/pyenv][pyenv]
2. Follow the instructions for [Basic GitHub Checkout](https://github.com/pyenv/pyenv#basic-github-checkout)
   - **Do not install `pyenv` with `brew`**
   - We've found the GitHub checkout installation to be more reliable, _especially_ on M1/ARM macs

```shell
git clone https://github.com/pyenv/pyenv.git ~/.pyenv
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zprofile
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zprofile
echo 'eval "$(pyenv init --path)"' >> ~/.zprofile
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
```

Close and re-open your terminal to verify that `pyenv` is installed

```shell
pyenv --version
```

If your `pyenv` command isn't working, confirm that your shell is set up properly. If you print out the contents of `~/.zprofile` and `~/.zshrc`, you should see something similar to the following:

```shell
# ~/.zprofile
# ...
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
# ...
```

```shell
# ~/.zshrc
# ...
eval "$(pyenv init -)"
# ...
```

##### Python installation with pyenv

Before you can install python, you'll need to install its build dependencies explicitly. If you're getting errors during environment setup about SSH not working, it's because you built an interpreter without SSH support accidentally because openssh headers weren't installed and python's configuration detected this. Python's build dependencies are:

- [here for Mac](https://devguide.python.org/getting-started/setup-building/#macos-and-os-x)

- [here for Linux](https://devguide.python.org/getting-started/setup-building/#linux)

Install `jpeg` if on ARM Mac (M1)

`/hardware` depends on the Python library Pillow. On ARM Macs, `pip` will build Pillow from source, which requires [jpeg](https://formulae.brew.sh/formula/jpeg) to be installed.

```shell
brew install jpeg
```

Install the required versions of Python. Use the latest available version of `3.10.x` and `3.8.x`

> At the time of writing

```shell
pyenv install 3.10.7
pyenv install 3.8.14
pyenv global 3.10.7 3.8.14
pyenv versions
```

Both Python 3.8 and 3.10 are available with this pyenv global configuration. Because 3.10.7 is first when you set the configuration, `python` will use that version. Pyenv provides `python3.8` and `python3.10` to call minor versions.

With both versions of Python available through pyenv on your system, pipenv will point to the right version given a projects Pipfile.

### Windows

**This section is a work in progress**

On Windows, we rely on:

- [scoop][] to install general dependencies
- [Node Version Switcher][nvs] to install and manage Node.js
- For the Python side, native Windows development is not supported for most of the environments.
  - [environments/app](/environments/app) is supported for Windows opentrons and shared-data package testing
  - [environments/dev](/environments/dev) may work on Windows but is not guaranteed
  - **Instead use Windows Subsystem for Linux (WSL)**
    - [VS Code provides great tools!](https://code.visualstudio.com/docs/remote/wsl)
      - Follow the instructions and then see the [Linux section](#linux)

#### 0. Install `scoop` and general dependencies

#### 1. Install `nvs` and Node.js

#### TODO any instructions for Node side development

### Linux

**This section is a work in progress**

This setup will depend heavily on your exact distribution of Linux and your preferred workflows. For this example, we will provide instructions for an Ubuntu and Fedora variant using Bash. If your setup is different, consult the documentation of your distribution and the tools listed below.

#### 0. Install general dependencies

This list is not exhaustive but on Ubuntu 22.04 these were needed `libudev-dev` `libsystemd-dev`

```shell
sudo apt install libudev-dev libsystemd-dev -y
```

#### 1. Install `nvs` and Node.js

You can follow the [nvs][nvs] instructions to install nvs on your system:

```shell
export NVS_HOME="$HOME/.nvs"
git clone https://github.com/jasongin/nvs "$NVS_HOME"
. "$NVS_HOME/nvs.sh" install
```

#### 2. Install `pyenv` and Python

You can follow the [pyenv][pyenv] "basic github checkout" instructions to install pyenv on your system:

```shell
git clone https://github.com/pyenv/pyenv.git ~/.pyenv
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
```

Also add the above to whatever combination of `~/.profile`, `~/.bash_profile`, etc you like best depending on your ssh workflows.

##### [Python installation with pyenv](#python-installation-with-pyenv)

## Repository Setup

Once your system is set up, you're ready to clone the repository and get the development environment set up.

```shell
git clone https://github.com/Opentrons/opentrons.git
cd ./opentrons
```

Once you are inside the repository for the first time, you should do two things:

1. Confirm that `nvs` selected the proper version of Node.js to use

```shell
# confirm Node v14
node --version

# confirm pyenv has 3.8 and 3.10 with a star by them
pyenv versions
```

Once you've confirmed you're running the correct versions of Node.js and have Python ready, you must install [yarn][] to manage JavaScript dependencies.

```shell
npm install --global yarn@1
```

Finally, you need to download and install all of our various development dependencies. **This step will take several minutes** the first time you run it!

```shell
make setup -j
```

If you experience issues, run `make setup` without the `-j` to see the errors clearly.

Once `make setup` completes, you're ready to start developing! Check out our general [contributing guide][] for more information. If you ever need to remove (or recreate) the steps run in `make setup`, you can use `make teardown` to remove the installed dependencies.

[file an issue]: https://github.com/Opentrons/opentrons/issues
[open a pull request]: https://github.com/Opentrons/opentrons/pulls
[first-time git setup]: https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup
[brew]: https://brew.sh
[xcode command line tools]: https://developer.apple.com/xcode/resources/
[scoop]: https://scoop.sh/
[nvs]: https://github.com/jasongin/nvs
[pyenv]: https://github.com/pyenv/pyenv
[yarn]: https://classic.yarnpkg.com/
[pipenv]: https://github.com/pypa/pipenv
[contributing guide]: ./CONTRIBUTING.md
