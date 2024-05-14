import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  Link as LinkButton,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SidePanel } from './molecules/SidePanel'
import { ChatContainer } from './organisms/ChatContainer'
import { Loading } from './molecules/Loading'

export function App(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { isAuthenticated, logout, isLoading, loginWithRedirect } = useAuth0()

  console.log('isAuthenticated', isAuthenticated)

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {isAuthenticated ? (
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
          ) : (
            <Flex justifyContent={JUSTIFY_CENTER} alignItems={ALIGN_CENTER}>
              <LinkButton
                onClick={() => loginWithRedirect()}
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
              >
                {t('login')}
              </LinkButton>
            </Flex>
          )}
        </>
      )}
    </>
  )
}
