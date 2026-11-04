import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { Auth0Provider } from '@auth0/auth0-react'

import '@opentrons/components/styles/global'

import { App } from './App'
import { i18n } from './i18n'
import {
  AUTH0_DOMAIN,
  LOCAL_AUTH0_AUDIENCE,
  LOCAL_AUTH0_CLIENT_ID,
  LOCAL_AUTH0_DOMAIN,
  PROD_AUTH0_AUDIENCE,
  PROD_AUTH0_CLIENT_ID,
  STAGING_AUTH0_AUDIENCE,
  STAGING_AUTH0_CLIENT_ID,
} from './resources/constants'

import '@fontsource/public-sans'
import '@fontsource/public-sans/600.css'
import '@fontsource/public-sans/700.css'
import './global.css'

const rootElement = document.getElementById('root')

const getClientId = (): string => {
  switch (_NODE_ENV_) {
    case 'production':
      return PROD_AUTH0_CLIENT_ID
    case 'development':
      return LOCAL_AUTH0_CLIENT_ID
    default:
      return STAGING_AUTH0_CLIENT_ID
  }
}

const getDomain = (): string => {
  return _NODE_ENV_ === 'development' ? LOCAL_AUTH0_DOMAIN : AUTH0_DOMAIN
}

/** Auth0 must issue tokens for the API audience at login, not only on getAccessTokenSilently. */
const getAuthorizationParams = (): {
  redirect_uri: string
  audience?: string
} => {
  const redirect_uri = window.location.origin
  switch (_NODE_ENV_) {
    case 'development':
      return { redirect_uri, audience: LOCAL_AUTH0_AUDIENCE }
    case 'staging':
      return { redirect_uri, audience: STAGING_AUTH0_AUDIENCE }
    case 'production':
      return { redirect_uri, audience: PROD_AUTH0_AUDIENCE }
    default:
      return { redirect_uri, audience: STAGING_AUTH0_AUDIENCE }
  }
}

if (rootElement != null) {
  const clientId = getClientId()
  const domain = getDomain()

  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <Auth0Provider
        clientId={clientId}
        domain={domain}
        authorizationParams={getAuthorizationParams()}
      >
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </Auth0Provider>
    </StrictMode>
  )
} else {
  console.error('Root element not found')
}
