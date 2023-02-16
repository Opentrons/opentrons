import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

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
  TEXT_ALIGN_RIGHT,
  TYPOGRAPHY,
} from '@opentrons/components'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import OT3_PNG from '../../assets/images/OT3.png'
import { Banner, BannerType } from '../../atoms/Banner'
import { ToggleButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { useDispatchApiRequest } from '../../redux/robot-api'
import { fetchLights } from '../../redux/robot-controls'
import { CONNECTABLE, getRobotModelByName } from '../../redux/discovery'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import { RobotStatusHeader } from './RobotStatusHeader'
import { ReachableBanner } from './ReachableBanner'
import { RobotOverviewOverflowMenu } from './RobotOverviewOverflowMenu'
import {
  useCalibrationTaskList,
  useIsRobotBusy,
  useIsRobotViewable,
  useLights,
  useRobot,
} from './hooks'

import type { State } from '../../redux/types'

const EQUIPMENT_POLL_MS = 5000

interface RobotOverviewProps {
  robotName: string
}

export function RobotOverview({
  robotName,
}: RobotOverviewProps): JSX.Element | null {
  const { t } = useTranslation([
    'device_details',
    'shared',
    'robot_calibration',
  ])

  const { taskListStatus } = useCalibrationTaskList(robotName)
  const isRobotBusy = useIsRobotBusy({ poll: true })

  // start off assuming we are missing calibrations
  let showCalibrationStatusBanner = true
  let calibrationStatusBannerType = 'error'
  let calibrationStatusBannerText = t(
    'robot_calibration:missing_calibration_data_long'
  )

  // if the tasklist is empty, though, all calibrations are good
  if (taskListStatus === 'complete') {
    showCalibrationStatusBanner = false
    // if we have tasks and they are all marked bad, then we should
    // strongly suggest they re-do those calibrations
  } else if (taskListStatus === 'bad') {
    calibrationStatusBannerType = 'warning'
    calibrationStatusBannerText = t(
      'robot_calibration:recalibration_recommended'
    )
  }

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
    <>
      <Flex
        alignItems={ALIGN_START}
        backgroundColor={COLORS.white}
        flexDirection={DIRECTION_COLUMN}
        paddingTop={SPACING.spacing3}
        position={POSITION_RELATIVE}
        width="100%"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          marginBottom={SPACING.spacing4}
          width="100%"
        >
          <Flex>
            <img
              src={robotModel === 'OT-2' ? OT2_PNG : OT3_PNG}
              style={{
                width: '6rem',
                height: '5.4375rem',
              }}
              id="RobotOverview_robotImage"
            />
          </Flex>
          <Box padding={SPACING.spacing3} width="100%">
            <Box marginBottom={SPACING.spacing3}>
              <ReachableBanner robot={robot} />
            </Box>
            {robot != null ? (
              <UpdateRobotBanner
                robot={robot}
                marginBottom={SPACING.spacing3}
              />
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
                        disabled={
                          lightsOn === null || robot.status !== CONNECTABLE
                        }
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
          <Box
            position={POSITION_ABSOLUTE}
            top={SPACING.spacing2}
            right="-.75rem"
          >
            <RobotOverviewOverflowMenu robot={robot} />
          </Box>
        </Flex>
      </Flex>
      {!isRobotBusy && showCalibrationStatusBanner && (
        <Flex
          paddingBottom={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
          width="100%"
        >
          <Banner type={calibrationStatusBannerType as BannerType}>
            <Flex
              alignItems={ALIGN_CENTER}
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              width="100%"
            >
              {calibrationStatusBannerText}
              <RouterLink
                to={`/devices/${robotName}/robot-settings/calibration`}
              >
                <StyledText
                  as="p"
                  color={COLORS.darkBlackEnabled}
                  paddingRight={SPACING.spacing4}
                  textAlign={TEXT_ALIGN_RIGHT}
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                >
                  {t('robot_calibration:launch_calibration_link_text')}
                </StyledText>
              </RouterLink>
            </Flex>
          </Banner>
        </Flex>
      )}
      <Flex
        borderBottom={BORDERS.lineBorder}
        marginBottom={SPACING.spacing4}
        position={POSITION_RELATIVE}
        width="100%"
      />
    </>
  ) : null
}
