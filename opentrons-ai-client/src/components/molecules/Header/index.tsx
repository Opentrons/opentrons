import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useAtom } from 'jotai'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Link as LinkButton,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { displayExitConfirmModalAtom } from '/ai-client/resources/atoms'
import { CLIENT_MAX_WIDTH } from '/ai-client/resources/constants'
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'

import { SettingsButton } from '../SettingsButton'

const HeaderBar = styled(Flex)`
  position: ${POSITION_RELATIVE};
  background-color: ${COLORS.white};
  width: 100%;
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  height: 60px;
`

const HeaderBarContent = styled(Flex)`
  position: ${POSITION_ABSOLUTE};
  padding: 18px 32px;
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  width: 100%;
  max-width: ${CLIENT_MAX_WIDTH};
`

const HeaderGradientTitle = styled(StyledText)`
  background: linear-gradient(90deg, #562566 0%, #893ba4 47.5%, #c189d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 16px;
`

const HeaderTitle = styled(StyledText)`
  font-size: 16px;
`

const LogoutOrExitButton = styled(LinkButton)`
  color: ${COLORS.grey50};
  font-size: ${TYPOGRAPHY.fontSizeH3};
`

interface HeaderProps {
  isExitButton?: boolean
}

export function Header({ isExitButton = false }: HeaderProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { logout } = useAuth0()
  const navigate = useNavigate()
  const location = useLocation()
  const trackEvent = useTrackEvent()
  const [, setDisplayExitConfirmModal] = useAtom(displayExitConfirmModalAtom)

  async function handleLoginOrExitClick(): Promise<void> {
    if (isExitButton) {
      setDisplayExitConfirmModal(true)
      return
    }

    await logout()
    trackEvent({ name: 'user-logout', properties: {} })
  }

  function handleSettingsClick(): void {
    if (location.pathname === '/settings') {
      navigate(-1)
    } else {
      navigate('/settings')
    }
  }

  return (
    <HeaderBar>
      <HeaderBarContent>
        <Flex>
          <HeaderTitle>{t('opentrons')}</HeaderTitle>
          <HeaderGradientTitle>{t('ai')}</HeaderGradientTitle>
        </Flex>
        <Flex alignItems={ALIGN_CENTER}>
          <LogoutOrExitButton onClick={handleLoginOrExitClick}>
            {isExitButton ? t('exit') : t('logout')}
          </LogoutOrExitButton>
          {(location.pathname === '/' || location.pathname === '/settings') && (
            <Box marginLeft={SPACING.spacing16}>
              <SettingsButton onClick={handleSettingsClick} />
            </Box>
          )}
        </Flex>
      </HeaderBarContent>
    </HeaderBar>
  )
}
