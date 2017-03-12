const rp = require('request-promise')

function waitUntilServerResponds (createWindow, windowUrl) {
  rp(windowUrl)
    .then((html) => {
      return createWindow()
    })
    .catch((err) => {
      setTimeout(() => {
        waitUntilServerResponds(createWindow, windowUrl)
      }, 500)
    })
}

function download (url, dest, cb) {
  console.log('got here..')
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);
    });
  }).on('error', function(err) {
    fs.unlink(dest);
    if (cb) cb(err.message);
  });
};

module.exports = {
  download,
  waitUntilServerResponds
}
