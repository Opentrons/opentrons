import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { ModalShell } from '../../../molecules/Modal'
import { home, ROBOT } from '../../../redux/robot-controls'
import { restartRobot } from '../../../redux/robot-admin'
import { useLights } from '../../Devices/hooks'

import type { Dispatch } from '../../../redux/types'

interface NavigationMenuProps {
  onClick: React.MouseEventHandler
  robotName: string
}

export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  const { onClick, robotName } = props
  const { t, i18n } = useTranslation(['devices_landing', 'robot_controls'])
  const { toggleLights } = useLights()
  const dispatch = useDispatch<Dispatch>()

  return (
    <ModalShell
      borderRadius={BORDERS.size_three}
      onOutsideClick={onClick}
      width="18.0625rem"
      isOnDeviceDisplay
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        padding={`0rem ${SPACING.spacingL}`}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          height="4.875rem"
          onClick={() => dispatch(home(robotName, ROBOT))}
        >
          <Icon
            name="reset-position"
            aria-label="reset-position_icon"
            size="2rem"
            color={COLORS.black}
          />
          <StyledText
            fontSize={TYPOGRAPHY.fontSize28}
            lineHeight={TYPOGRAPHY.lineHeight36}
            marginLeft={SPACING.spacing5}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('home_gantry')}
          </StyledText>
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          height="4.875rem"
          onClick={() => dispatch(restartRobot(robotName))}
        >
          <Icon
            name="restart"
            size="2rem"
            color={COLORS.black}
            aria-label="restart_icon"
          />
          <StyledText
            fontSize={TYPOGRAPHY.fontSize28}
            lineHeight={TYPOGRAPHY.lineHeight36}
            marginLeft={SPACING.spacing5}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('robot_controls:restart_label')}
          </StyledText>
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          height="4.875rem"
          onClick={toggleLights}
        >
          <Icon
            name="light"
            size="2rem"
            color={COLORS.black}
            aria-label="light_icon"
          />
          <StyledText
            color={COLORS.black}
            fontSize={TYPOGRAPHY.fontSize28}
            marginLeft={SPACING.spacing5}
            lineHeight={TYPOGRAPHY.lineHeight36}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {i18n.format(t('lights_on'), 'capitalize')}
          </StyledText>
        </Flex>
      </Flex>
    </ModalShell>
  )
}
