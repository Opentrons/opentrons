import type { IpcRenderer } from 'electron'

export {}

declare global {
  var APP_SHELL_REMOTE: { ipcRenderer: IpcRenderer };
  // function btoa(str: string | Buffer): string;
  // var _PKG_VERSION_: string;
  // var _OPENTRONS_PROJECT_: string;
}
