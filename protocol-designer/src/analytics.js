// @flow
import noop from 'lodash/noop'
import {version} from '../../package.json'

const INTERCOM_ID = process.env.OT_PD_INTERCOM_ID

export function initializeIntercom () {
  if (INTERCOM_ID) {
    console.log('Initializing Intercom')
    const data = {
      app_id: INTERCOM_ID,
      'App Version': version
    }
    const intercom = global.Intercom || noop
    intercom('boot', data)
  }
}
