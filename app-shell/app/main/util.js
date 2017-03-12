const http = require('http');
const fs = require('fs');
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

function download (url, dest, successCb, failureCb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(successCb);
    });
  }).on('error', function(err) {
    fs.unlink(dest);
    if (failureCb) failureCb(err.message);
  });
};

module.exports = {
  download,
  waitUntilServerResponds
}
