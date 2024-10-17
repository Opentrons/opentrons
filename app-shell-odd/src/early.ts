// things intended to execute early in app-shell initialization
// do as little as possible in this file and do none of it at import time

import { app } from 'electron'
import { ODD_DATA_DIR } from './constants'

let path: string

export const setUserDataPath = (): string => {
  if (path == null) {
    console.log(
      `node env is ${process.env.NODE_ENV}, path is ${app.getPath('userData')}`
    )
    if (process.env.NODE_ENV === 'production') {
      console.log(`setting app path to ${ODD_DATA_DIR}`)
      app.setPath('userData', ODD_DATA_DIR)
    }
    path = app.getPath('userData')
    console.log(`app path becomes ${app.getPath('userData')}`)
  }
  return app.getPath('userData')
}
