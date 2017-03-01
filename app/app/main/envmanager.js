const childProcess = require('child_process')
const electron = require('electron')
const fs = require('fs')
const fstream = require('fstream')
const path = require('path')
const rimraf = require('rimraf')
const tar = require('tar')
const unzip = require('unzip')

const {app} = electron

class PythonEnvManager {
  getEnvAppDataDirPath () {
    return path.join(app.getPath('userData'), 'venv')
  }

  getPackedEnvPath () {
    let venvRoot = process.resourcesPath
    if (process.env.NODE_ENV === 'development') {
      venvRoot = process.cwd()
    }
    return path.join(venvRoot, 'env-dist', 'venv.zip')
  }

  copyAndDecompressEnvironment (backendEnvSrcPath, backendEnvDestPath) {
    rimraf.sync(backendEnvDestPath)  // Remove existing env dir if any
    fs.mkdirSync(backendEnvDestPath)  // Create env dir

    const backendEnvDestStream = fstream.Writer(backendEnvDestPath);
    console.log(backendEnvSrcPath, backendEnvDestPath)

    fs.createReadStream(backendEnvSrcPath)
      .pipe(unzip.Extract({ path: backendEnvDestPath}))
      .on('close', function () {
        fs.createReadStream(path.join(backendEnvDestPath, 'venv.tar'))
          .pipe(tar.Extract({ path: path.join(backendEnvDestPath)}))
          .on('close', function () {
            app.emit('python-env-ready')
          })
      })
  }

  /**
  * Decompresses python environment in apps data dir if env does not exist
  * or if environment version differs from current app version
  */
  setupEnvironment () {
    // FIXME: Ignore this until embeddable python is figured out
    app.emit('python-env-ready')
    return
    // const hasPythonEnvironment = fs.existsSync(this.getVersionFilePath())
    // const isSameVersion = this.getEnvVersionTag() === app.getVersion()
    // if (!hasPythonEnvironment || !isSameVersion) {
    //     console.log('Updating app python environment')
    //     this.copyAndDecompressEnvironment(
    //       this.getPackedEnvPath(),
    //       this.getEnvAppDataDirPath()
    //     )
    //     this.writeEnvVersionTag()
    // } else {
    //   app.emit('python-env-ready')
    // }
  }

  /**
  * Returns env version file path
  */
  getVersionFilePath () {
    return path.join(this.getEnvAppDataDirPath(), 'version')
  }

  /**
  * Writes current application version tag to environment dir
  */
  writeEnvVersionTag () {
    fs.writeFile(this.getVersionFilePath(), app.getVersion())
  }

  /**
  * Gets application version tag last saved in environment dir
  */
  getEnvVersionTag () {
    if (fs.existsSync(this.getVersionFilePath())) {
      return fs.readFileSync(this.getVersionFilePath(), 'utf8')
    }
  }
}

module.exports = {
  PythonEnvManager
}
