import * as React from 'react'
import { useDispatch } from 'react-redux'
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
import { home, ROBOT } from '../../redux/robot-controls'
import { useLights } from '../Devices/hooks'
import { RestartRobotConfirmationModal } from './RestartRobotConfirmationModal'

import type { Dispatch } from '../../redux/types'

interface NavigationMenuProps {
  onClick: React.MouseEventHandler
  robotName: string
}

export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  const { onClick, robotName } = props
  const { t, i18n } = useTranslation(['devices_landing', 'robot_controls'])
  const { lightsOn, toggleLights } = useLights()
  const dispatch = useDispatch<Dispatch>()
  const [
    showRestartRobotConfirmationModal,
    setShowRestartRobotConfirmationModal,
  ] = React.useState<boolean>(false)

  const handleRestart = (): void => {
    setShowRestartRobotConfirmationModal(true)
  }

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
      <MenuList onClick={onClick} isOnDevice={true}>
        <MenuItem
          key="home-gantry"
          onClick={() => dispatch(home(robotName, ROBOT))}
        >
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="home-gantry"
              aria-label="home-gantry_icon"
              size="2.5rem"
            />
            <StyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('home_gantry')}
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
