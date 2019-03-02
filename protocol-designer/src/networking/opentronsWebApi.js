// @flow

import cookie from 'cookie'
import queryString from 'query-string'

export type GateStage = 'loading' |
  'promptVerifyIdentity' |
  'promptCheckEmail' |
  'failedIdentityVerification' |
  'promptOptForAnalytics' |
  'openGate'

const OPENTRONS_API_BASE_URL = 'https://staging.web-api.opentrons.com'
const VERIFY_EMAIL_PATH = '/users/verify-email'
const headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

const writeIdentityCookie = (payload) => {
  global.document.cookie = cookie.serialize('name', payload.name)
  global.document.cookie = cookie.serialize('email', payload.email)
}

const getHasIdentityCookie = () => {
  const cookies = cookie.parse(global.document.cookie)
  console.log('found biscuits: ', cookies)
  const {email, name} = cookies
  return Boolean(email && name)
}

export const getGateStage = (hasOptedIntoAnalytics: boolean): Promise<GateStage> => {
  const parsedQueryStringParams = (queryString.parse(global.location.search))
  const {token} = parsedQueryStringParams

  if (token) {
    return fetch(
      `${OPENTRONS_API_BASE_URL}${VERIFY_EMAIL_PATH}`,
      {method: 'POST', headers, body: JSON.stringify({token})},
    ).then(response => response.json().then(body => {
      if (response.ok) {
        writeIdentityCookie(body)
        if (getHasIdentityCookie()) {
          return hasOptedIntoAnalytics ? 'openGate' : 'promptOptForAnalytics'
        } else {
          console.info('failed to find identity cookie')
          return 'failedIdentityVerification'
        }
      } else {
        getHasIdentityCookie()
        return 'failedIdentityVerification'
      }
    }).catch(error => {
      getHasIdentityCookie()
      return 'failedIdentityVerification'
    }))
  } else {
    const hasCookie = getHasIdentityCookie()
    return hasCookie ? Promise.resolve('promptOptForAnalytics') : Promise.resolve('promptVerifyIdentity')
  }
}
