import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  LegacyStyledText,
  MenuItem,
  MenuList,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { useHomeGantry } from '/app/local-resources/instruments'
import { useIsFlex } from '/app/redux-resources/robots'
import { useLights } from '/app/resources/devices'

import { RestartRobotConfirmationModal } from './RestartRobotConfirmationModal'
import { ShutdownRobotConfirmationModal } from './ShutdownRobotConfirmationModal'

import type { MouseEventHandler } from 'react'

interface NavigationMenuProps {
  onClick: MouseEventHandler
  robotName: string
  setShowNavMenu: (showNavMenu: boolean) => void
}

export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  const { onClick, robotName, setShowNavMenu } = props
  const { t, i18n } = useTranslation(['devices_landing', 'robot_controls'])
  const { lightsOn, toggleLights } = useLights()
  const { homeGantry } = useHomeGantry({})
  const [
    showRestartRobotConfirmationModal,
    setShowRestartRobotConfirmationModal,
  ] = useState<boolean>(false)
  const [
    showShutdownRobotConfirmationModal,
    setShowShutdownRobotConfirmationModal,
  ] = useState<boolean>(false)

  const navigate = useNavigate()
  const isFlex = useIsFlex(robotName)

  const handleRestart = (): void => {
    setShowRestartRobotConfirmationModal(true)
  }

  const handleShutdown = (): void => {
    setShowShutdownRobotConfirmationModal(true)
  }

  const handleHomeGantry = (): void => {
    void homeGantry()
    setShowNavMenu(false)
  }

  return createPortal(
    <>
      {showRestartRobotConfirmationModal ? (
        <RestartRobotConfirmationModal
          robotName={robotName}
          setShowRestartRobotConfirmationModal={
            setShowRestartRobotConfirmationModal
          }
        />
      ) : null}
      {showShutdownRobotConfirmationModal ? (
        <ShutdownRobotConfirmationModal
          robotName={robotName}
          setShowShutdownRobotConfirmationModal={
            setShowShutdownRobotConfirmationModal
          }
        />
      ) : null}
      <MenuList onClick={onClick} isOnDevice={true}>
        <MenuItem key="reset-position" onClick={handleHomeGantry}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="reset-position"
              aria-label="reset-position_icon"
              size="2.5rem"
            />
            <LegacyStyledText
              forwardedAs="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('home_gantry')}
            </LegacyStyledText>
          </Flex>
        </MenuItem>
        <MenuItem key="restart" onClick={handleRestart}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="restart"
              size="2.5rem"
              color={COLORS.black90}
              aria-label="restart_icon"
            />
            <LegacyStyledText
              forwardedAs="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('robot_controls:restart_label')}
            </LegacyStyledText>
          </Flex>
        </MenuItem>
        {isFlex ? (
          <MenuItem key="shutdown" onClick={handleShutdown}>
            <Flex alignItems={ALIGN_CENTER}>
              <Icon
                name="power-off"
                size="2.5rem"
                color={COLORS.black90}
                aria-label="power-off_icon"
              />
              <LegacyStyledText
                forwardedAs="h4"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                marginLeft={SPACING.spacing12}
              >
                {t('robot_controls:turn_off_label')}
              </LegacyStyledText>
            </Flex>
          </MenuItem>
        ) : null}
        <MenuItem
          key="deck-configuration"
          onClick={() => {
            navigate('/deck-configuration')
          }}
        >
          <Flex alignItems={ALIGN_CENTER}>
            <Icon name="deck-map" aria-label="deck-map_icon" size="2.5rem" />
            <LegacyStyledText
              forwardedAs="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('deck_configuration')}
            </LegacyStyledText>
          </Flex>
        </MenuItem>
        <MenuItem key="light" onClick={toggleLights}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="light"
              size="2.5rem"
              color={COLORS.black90}
              aria-label="light_icon"
            />
            <LegacyStyledText
              forwardedAs="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {i18n.format(
                t(lightsOn ? 'lights_off' : 'lights_on'),
                'capitalize'
              )}
            </LegacyStyledText>
          </Flex>
        </MenuItem>
      </MenuList>
    </>,
    getTopPortalEl()
  )
}
