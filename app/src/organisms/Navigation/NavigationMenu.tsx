import * as React from 'react'
// import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { MenuList } from '../../atoms/MenuList'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useLights } from '../Devices/hooks'
import { RestartRobotConfirmationModal } from './RestartRobotConfirmationModal'

import { GantryControlModal } from './GantryControlModal'

interface NavigationMenuProps {
  onClick: React.MouseEventHandler
  robotName: string
  setShowNavMenu: (showNavMenu: boolean) => void
}

export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  const { onClick, robotName } = props
  const { t, i18n } = useTranslation(['devices_landing', 'robot_controls'])
  const { lightsOn, toggleLights } = useLights()
  const [
    showRestartRobotConfirmationModal,
    setShowRestartRobotConfirmationModal,
  ] = React.useState<boolean>(false)
  const [
    showGantryControlModal,
    setShowGantryControlModal,
  ] = React.useState<boolean>(false)

  const handleRestart = (): void => {
    setShowRestartRobotConfirmationModal(true)
  }

  // const handleHomeGantry = (): void => {
  //   dispatch(home(robotName, ROBOT))
  //   setShowNavMenu(false)
  // }

  // ToDo (kk:10/02/2023)
  // Need to update a function for onClick
  return (
    <>
      {showRestartRobotConfirmationModal ? (
        <RestartRobotConfirmationModal
          robotName={robotName}
          setShowRestartRobotConfirmationModal={
            setShowRestartRobotConfirmationModal
          }
        />
      ) : null}
      {showGantryControlModal ? (
        <GantryControlModal
          robotName={robotName}
          close={() => setShowGantryControlModal(false)}
        />
      ) : null}
      <MenuList onClick={onClick} isOnDevice={true}>
        <MenuItem 
          key="home-gantry" 
          onClick={() => {
            // handleHomeGantry
            setShowGantryControlModal(true)
          }}
        >
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="home-gantry"
              aria-label="control-gantry_icon"
              size="2.5rem"
            />
            <StyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('control_gantry')}
            </StyledText>
          </Flex>
        </MenuItem>
        <MenuItem key="restart" onClick={handleRestart}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="restart"
              size="2.5rem"
              color={COLORS.black}
              aria-label="restart_icon"
            />
            <StyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('robot_controls:restart_label')}
            </StyledText>
          </Flex>
        </MenuItem>
        <MenuItem key="deck-configuration" onClick={() => {}}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon name="deck-map" aria-label="deck-map_icon" size="2.5rem" />
            <StyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('deck_configuration')}
            </StyledText>
          </Flex>
        </MenuItem>
        <MenuItem key="light" onClick={toggleLights}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="light"
              size="2.5rem"
              color={COLORS.black}
              aria-label="light_icon"
            />
            <StyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {i18n.format(
                t(lightsOn ? 'lights_off' : 'lights_on'),
                'capitalize'
              )}
            </StyledText>
          </Flex>
        </MenuItem>
      </MenuList>
    </>
  )
}
