// @flow

import cookie from 'cookie'
import queryString from 'query-string'

import { i18n } from '../localization'

export type GateStage =
  | 'loading'
  | 'promptVerifyIdentity'
  | 'promptCheckEmail'
  | 'failedIdentityVerification'
  | 'promptOptForAnalytics'
  | 'openGate'

type GateState = { gateStage: GateStage, errorMessage: ?string }

export const isProduction = global.location.host === 'designer.opentrons.com'

const OPENTRONS_API_BASE_URL = isProduction
  ? 'https://web-api.opentrons.com'
  : 'https://staging.web-api.opentrons.com'
const PROTOCOL_DESIGNER_VERIFY_URL = isProduction
  ? global.location.origin
  : 'https://staging.designer.opentrons.com'

const VERIFY_EMAIL_PATH = '/users/verify-email'
const CONFIRM_EMAIL_PATH = '/users/confirm-email'

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

const writeIdentityCookie = (payload: {| name: string, email: string |}) => {
  const domain =
    process.env.NODE_ENV === 'production' ? 'opentrons.com' : undefined
  global.document.cookie = cookie.serialize('ot_name', payload.name, {
    domain,
    maxAge: 10 * 365 * 24 * 60 * 60, // 10 years
  })
  global.document.cookie = cookie.serialize('ot_email', payload.email, {
    domain,
    maxAge: 10 * 365 * 24 * 60 * 60, // 10 years
  })
}

// bypass gating Typeform modal by writing fake cookie
export const writeFakeIdentityCookie = (): void =>
  writeIdentityCookie({
    name: '_skipped_signup',
    email: 'nobody@email.com',
  })

const getStageFromIdentityCookie = (
  token: ?string,
  hasOptedIntoAnalytics: boolean | null
) => {
  const cookies = cookie.parse(global.document.cookie)
  const { ot_email: email, ot_name: name } = cookies
  const hasIdentityCookie = Boolean(email && name)

  if (hasIdentityCookie) {
    return hasOptedIntoAnalytics ? 'openGate' : 'promptOptForAnalytics'
  } else {
    return token ? 'failedIdentityVerification' : 'promptVerifyIdentity'
  }
}

// TODO: BC: 2019-03-05 refactor this and pull the common networking fetch calls out into a helper

export const getGateStage = (
  hasOptedIntoAnalytics: boolean | null
): Promise<GateState> => {
  const parsedQueryStringParams = queryString.parse(global.location.search)
  const { token, name, email } = parsedQueryStringParams
  let gateStage = 'loading'
  let errorMessage = null

  if (token) {
    return fetch(`${OPENTRONS_API_BASE_URL}${VERIFY_EMAIL_PATH}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token }),
    }).then(response =>
      response
        .json()
        .then(body => {
          if (response.ok) {
            // valid identity token, write new cookie
            writeIdentityCookie(body)
            gateStage = getStageFromIdentityCookie(token, hasOptedIntoAnalytics)
            global.location.replace(global.location.origin) // redirect to clean token qs param from url
          } else {
            const { status, statusText } = response
            errorMessage = i18n.t(
              'application.networking.unauthorized_verification_failure'
            )
            if (status !== 401) {
              const specificAddendum =
                (body && body.message) || `${status} ${statusText}`
              errorMessage = `${errorMessage}  (Error Message: ${specificAddendum})`
            }
            gateStage = 'failedIdentityVerification'
          }
          return { gateStage, errorMessage }
        })
        .catch(error => {
          gateStage = getStageFromIdentityCookie(token, hasOptedIntoAnalytics)
          errorMessage =
            error ||
            i18n.t('application.networking.generic_verification_failure')
          return { gateStage, errorMessage }
        })
    )
  } else if (email && name) {
    // if name and email qs present, ignore cookie and hit confirmEmail
    const confirmEmailBody = {
      name,
      email,
      verifyUrl: PROTOCOL_DESIGNER_VERIFY_URL,
      templateName: 'verify-email-pd',
      emailListName: 'pd-users',
    }
    return fetch(`${OPENTRONS_API_BASE_URL}${CONFIRM_EMAIL_PATH}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...confirmEmailBody }),
    }).then(response =>
      response
        .json()
        .then(body => {
          if (response.ok) {
            // valid identity token
            gateStage = 'promptCheckEmail'
          } else {
            console.error('Failed to confirm identity and send user email.')
            errorMessage = i18n.t(
              'application.networking.validation_server_failure'
            )
            gateStage = 'failedIdentityVerification'

            const { status, statusText } = response
            const specificAddendum =
              (body && body.message) || `${status} ${statusText}`
            errorMessage = `${errorMessage}  (Error Message: ${specificAddendum})`
          }
          return { gateStage, errorMessage }
        })
        .catch(error => {
          gateStage = 'failedIdentityVerification'
          errorMessage =
            error || i18n.t('application.networking.validation_server_failure')
          return { gateStage, errorMessage }
        })
    )
  } else {
    // No identity token
    gateStage = getStageFromIdentityCookie(token, hasOptedIntoAnalytics)
    return Promise.resolve({ gateStage, errorMessage })
  }
}
