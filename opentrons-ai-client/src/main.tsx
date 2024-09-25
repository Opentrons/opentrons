import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { Auth0Provider } from '@auth0/auth0-react'

import { GlobalStyle } from './atoms/GlobalStyle'
import { i18n } from './i18n'
import { App } from './App'
import {
  AUTH0_DOMAIN,
  LOCAL_AUTH0_DOMAIN,
  PROD_AUTH0_CLIENT_ID,
  STAGING_AUTH0_CLIENT_ID,
  LOCAL_AUTH0_CLIENT_ID,
} from './resources/constants'

const rootElement = document.getElementById('root')

const getClientId = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return PROD_AUTH0_CLIENT_ID
    case 'development':
      return LOCAL_AUTH0_CLIENT_ID
    default:
      return STAGING_AUTH0_CLIENT_ID
  }
}

const getDomain = (): string => {
  return process.env.NODE_ENV === 'development'
    ? LOCAL_AUTH0_DOMAIN
    : AUTH0_DOMAIN
}

if (rootElement != null) {
  const clientId = getClientId()
  const domain = getDomain()

  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <Auth0Provider
        clientId={clientId}
        domain={domain}
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
      >
        <GlobalStyle />
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </Auth0Provider>
    </StrictMode>
  )
} else {
  console.error('Root element not found')
}
