import * as React from 'react'
import { COLORS, Flex, Icon, SPACING, SIZE_2 } from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { StyledText } from '../../../atoms/text'
import { restartRobot } from '../../../redux/robot-admin'
import { home, ROBOT } from '../../../redux/robot-controls'
import type { Dispatch } from '../../../redux/types'
import { useLights } from '../../Devices/hooks'

interface NavigationMenuProps {
  onClick: React.MouseEventHandler
  robotName: string
}

export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  const { onClick, robotName } = props
  const { t, i18n } = useTranslation(['devices_landing', 'robot_controls'])
  const { lightsOn, toggleLights } = useLights()
  const dispatch = useDispatch<Dispatch>()

  return (
    <MenuList onClick={onClick} isOnDevice={true}>
      <MenuItem
        key="home-gantry"
        onClick={() => dispatch(home(robotName, ROBOT))}
      >
        <Flex>
          <Icon
            name="home-gantry"
            aria-label="home-gantry_icon"
            size={SIZE_2}
          />
          <StyledText marginLeft={SPACING.spacing5}>
            {t('home_gantry')}
          </StyledText>
        </Flex>
      </MenuItem>
      <MenuItem key="restart" onClick={() => dispatch(restartRobot(robotName))}>
        <Flex>
          <Icon
            name="restart"
            size={SIZE_2}
            color={COLORS.black}
            aria-label="restart_icon"
          />
          <StyledText marginLeft={SPACING.spacing5}>
            {t('robot_controls:restart_label')}
          </StyledText>
        </Flex>
      </MenuItem>
      <MenuItem key="light" onClick={toggleLights}>
        <Flex>
          <Icon
            name="light"
            size={SIZE_2}
            color={COLORS.black}
            aria-label="light_icon"
          />
          <StyledText marginLeft={SPACING.spacing5}>
            {i18n.format(
              t(lightsOn ? 'lights_off' : 'lights_on'),
              'capitalize'
            )}
          </StyledText>
        </Flex>
      </MenuItem>
    </MenuList>
  )
}
