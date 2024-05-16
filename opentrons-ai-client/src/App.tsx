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
import { Loading } from './molecules/Loading'
import { ChatContainer } from './organisms/ChatContainer'

export function App(): JSX.Element | null {
  const { t } = useTranslation('protocol_generator')
  const { isAuthenticated, logout, isLoading, loginWithRedirect } = useAuth0()

  React.useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      void loginWithRedirect()
    }
  }, [isAuthenticated, isLoading, loginWithRedirect])

  if (isLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Flex flexDirection={DIRECTION_ROW} position={POSITION_RELATIVE}>
      <Flex position={POSITION_ABSOLUTE} top="1rem" right="1rem">
        <LinkButton
          onClick={() => logout()}
          textDecoration={TYPOGRAPHY.textDecorationUnderline}
        >
          {t('logout')}
        </LinkButton>
      </Flex>
      <SidePanel />
      <ChatContainer />
    </Flex>
  )
}
