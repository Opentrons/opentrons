import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  SIZE_4,
} from '@opentrons/components'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Portal } from '../../App/portal'
import { ChooseProtocolSlideout } from '../ChooseProtocolSlideout'

import type { StyleProps } from '@opentrons/components'
import type { DiscoveredRobot } from '../../redux/discovery/types'
import { CONNECTABLE } from '../../redux/discovery'

interface RobotOverflowMenuProps extends StyleProps {
  robot: DiscoveredRobot
}

export function RobotOverflowMenu(props: RobotOverflowMenuProps): JSX.Element {
  const { robot, ...styleProps } = props
  const { t } = useTranslation(['protocol_list', 'shared'])
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const [
    showChooseProtocolSlideout,
    setShowChooseProtocolSlideout,
  ] = React.useState<boolean>(false)

  const handleClickRun: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowChooseProtocolSlideout(true)
    setShowOverflowMenu(!showOverflowMenu)
  }
  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(!showOverflowMenu)
  }
  return (
    <Flex
      data-testid={`RobotCard_${robot.name}_overflowMenu`}
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      {...styleProps}
    >
      <OverflowBtn alignSelf={ALIGN_FLEX_END} onClick={handleOverflowClick} />
      {showOverflowMenu ? (
        <Flex
          width={SIZE_4}
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          <MenuItem onClick={handleClickRun}>{t('run')}</MenuItem>
        </Flex>
      ) : null}
      <Portal level="top">
        {robot.status === CONNECTABLE ? (
          <ChooseProtocolSlideout
            robot={robot}
            showSlideout={showChooseProtocolSlideout}
            onCloseClick={() => setShowChooseProtocolSlideout(false)}
          />
        ) : null}
      </Portal>
    </Flex>
  )
}
