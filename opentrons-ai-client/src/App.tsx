import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_ROW,
  Flex,
  Link as LinkButton,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SidePanel } from './molecules/SidePanel'
import { ChatContainer } from './organisms/ChatContainer'

const LOGIN_PAGE_URL = 'https://auth-dev.opentrons.com/'

export function App(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { isAuthenticated, logout } = useAuth0()

  // if not authenticated redirect to login page
  if (!isAuthenticated) {
    window.location.href = LOGIN_PAGE_URL
  }

  return (
    <Flex flexDirection={DIRECTION_ROW} position={POSITION_RELATIVE}>
      {isAuthenticated ? (
        // Note: this logout button is temporary
        <Flex position={POSITION_ABSOLUTE} top="1rem" right="1rem">
          <LinkButton
            onClick={() => logout()}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            {t('logout')}
          </LinkButton>
        </Flex>
      ) : null}
      <SidePanel />
      <ChatContainer />
    </Flex>
  )
}
