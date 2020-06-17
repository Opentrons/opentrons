// mock for 'file-saver' npm module

export const saveAs = (blob, fileName) => {
  global.__lastSavedBlobZip__ = blob
  global.__lastSavedFileName__ = fileName
}
