import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  useInterval,
  ALIGN_CENTER,
  ALIGN_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import OT3_PNG from '../../assets/images/OT3.png'
import { ToggleButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { useDispatchApiRequest } from '../../redux/robot-api'
import { fetchLights } from '../../redux/robot-controls'
import { CONNECTABLE, getRobotModelByName } from '../../redux/discovery'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import { RobotStatusHeader } from './RobotStatusHeader'
import { ReachableBanner } from './ReachableBanner'
import { RobotOverviewOverflowMenu } from './RobotOverviewOverflowMenu'
import { useIsRobotViewable, useLights, useRobot } from './hooks'

import type { State } from '../../redux/types'

const EQUIPMENT_POLL_MS = 5000

interface RobotOverviewProps {
  robotName: string
}

export function RobotOverview({
  robotName,
}: RobotOverviewProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const [dispatchRequest] = useDispatchApiRequest()

  const robot = useRobot(robotName)
  const robotModel = useSelector((state: State) =>
    getRobotModelByName(state, robot?.name ?? '')
  )
  const isRobotViewable = useIsRobotViewable(robot?.name ?? '')
  const { lightsOn, toggleLights } = useLights(robotName)

  useInterval(
    () => {
      dispatchRequest(fetchLights(robotName))
    },
    EQUIPMENT_POLL_MS,
    true
  )

  return robot != null ? (
    <Flex
      alignItems={ALIGN_START}
      backgroundColor={COLORS.white}
      borderBottom={BORDERS.lineBorder}
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING.spacing4}
      padding={SPACING.spacing3}
      position={POSITION_RELATIVE}
      width="100%"
    >
      <img
        src={robotModel === 'OT-2' ? OT2_PNG : OT3_PNG}
        style={{ paddingTop: SPACING.spacing3, width: '6.25rem' }}
        id="RobotOverview_robotImage"
      />
      <Box padding={SPACING.spacing3} width="100%">
        <ReachableBanner robot={robot} />
        {robot != null ? (
          <UpdateRobotBanner robot={robot} marginBottom={SPACING.spacing3} />
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <RobotStatusHeader
            name={robot.name}
            local={robot.local}
            robotModel={robotModel}
          />
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingRight={SPACING.spacing4}
            >
              <StyledText
                as="h6"
                color={COLORS.darkGreyEnabled}
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                paddingBottom={SPACING.spacing2}
                textTransform={TYPOGRAPHY.textTransformUppercase}
              >
                {t('controls')}
              </StyledText>
              <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3}>
                <Flex paddingBottom={SPACING.spacing2}>
                  <ToggleButton
                    label={t('lights')}
                    toggledOn={lightsOn != null ? lightsOn : false}
                    disabled={lightsOn === null || robot.status !== CONNECTABLE}
                    onClick={toggleLights}
                    height="0.813rem"
                    id="RobotOverview_lightsToggle"
                  />
                </Flex>
                <StyledText
                  as="p"
                  color={
                    isRobotViewable
                      ? COLORS.darkBlackEnabled
                      : COLORS.errorDisabled
                  }
                >
                  {t('lights')}
                </StyledText>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <Box position={POSITION_ABSOLUTE} top={SPACING.spacing2} right="-.75rem">
        <RobotOverviewOverflowMenu robot={robot} />
      </Box>
    </Flex>
  ) : null
}
