// mock for 'file-saver' npm module

export const saveAs = (blob, fileName) => {
  global.__lastSavedFileBlob__ = blob
  global.__lastSavedFileName__ = fileName
}
