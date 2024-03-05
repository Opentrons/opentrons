// mock electron-store
'use strict'
import { DEFAULTS_V12 } from '../app-shell-odd/src/config/migrate'

const Store = function () {
  // this.get = () => ({
  //   DEFAULTS_V12,
  // })
  this.store = () => ({
    DEFAULTS_V12,
  })
  this.get = property => {
    return DEFAULTS_V12[property]
  }
}
export default Store
