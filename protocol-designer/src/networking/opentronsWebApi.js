// @flow

import queryString from 'query-string'

export type GateStage = 'loading' | 'identify' | 'checkEmail' | 'failedVerification' | 'analytics'

const OPENTRONS_API_BASE_URL = 'https://staging.web-api.opentrons.com'
const VERIFY_EMAIL_PATH = '/users/verify-email'
const headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

export const getGateStage = (): Promise<GateStage> => {
  const parsedQueryStringParams = (queryString.parse(global.location.search))
  const {token} = parsedQueryStringParams

  if (token) {
    return fetch(
      `${OPENTRONS_API_BASE_URL}${VERIFY_EMAIL_PATH}`,
      {method: 'POST', headers, body: JSON.stringify({token})},
    ).then(response => response.json().then(body => {
      if (response.ok) {
        console.log('Success:', JSON.stringify(body))
        return 'analytics'
      } else {
        return 'failedVerification'
      }
    }).catch(error => {
      console.log('Error:', error)
      return 'failedVerification'
    }))
  } else {
    return Promise.resolve('identify')
  }
}
