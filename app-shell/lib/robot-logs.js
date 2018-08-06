'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerRobotLogs = registerRobotLogs;
// download robot logs manager

function registerRobotLogs(dispatch, mainWindow) {
  return function handleIncomingAction(action) {
    var type = action.type,
        logUrls = action.payload.logUrls;

    if (type === 'shell:DOWNLOAD_LOGS') {
      logUrls.forEach(function (url) {
        mainWindow.webContents.downloadURL(url);
      });
    }
  };
}
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }

  __REACT_HOT_LOADER__.register(registerRobotLogs, 'registerRobotLogs', 'src/robot-logs.js');
}();

;