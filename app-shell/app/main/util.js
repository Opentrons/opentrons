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

function downloadFileFromWeb (url, dest, successCb, failureCb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    // Ensure file response is valid
    if (response.statusCode != 200) {
      if (failureCb) failureCb(err.message);
    }
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
  downloadFileFromWeb,
  waitUntilServerResponds
}
