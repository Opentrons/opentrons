import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useAuthorization } from '@opentrons/react-api-client'

import OT2_PNG from '/app/assets/images/OT2-R_HERO.png'
import FLEX_PNG from '/app/assets/images/FLEX.png'
import { ToggleButton } from '/app/atoms/buttons'
import { getConfig } from '/app/redux/config'
import {
  useRobot,
  useIsRobotBusy,
  useIsRobotViewable,
} from '/app/redux-resources/robots'
import {
  CONNECTABLE,
  getRobotAddressesByName,
  getRobotModelByName,
  OPENTRONS_USB,
} from '/app/redux/discovery'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import { RobotStatusHeader } from './RobotStatusHeader'
import { ReachableBanner } from './ReachableBanner'
import { RobotOverviewOverflowMenu } from './RobotOverviewOverflowMenu'
import { useLights } from '/app/resources/devices'
import { CalibrationStatusBanner } from './CalibrationStatusBanner'
import {
  ErrorRecoveryBanner,
  useErrorRecoveryBanner,
} from './ErrorRecoveryBanner'

import type { State } from '/app/redux/types'

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

  const { showRecoveryBanner, recoveryIntent } = useErrorRecoveryBanner()

  const isRobotBusy = useIsRobotBusy({ poll: true })

  const robot = useRobot(robotName)
  const robotModel = useSelector((state: State) =>
    getRobotModelByName(state, robot?.name ?? '')
  )
  const isRobotViewable = useIsRobotViewable(robot?.name ?? '')
  const { lightsOn, toggleLights } = useLights()

  const userId = useSelector(getConfig)?.userInfo?.userId ?? 'Opentrons-user'

  const addresses = useSelector((state: State) =>
    getRobotAddressesByName(state, robot?.name ?? '')
  )
  const isUsbConnected = addresses.some(address => address.ip === OPENTRONS_USB)

  // TODO(bh, 2023-05-31): remove registration/authorization here when AppApiHostProvider exists
  useAuthorization({
    subject: 'Opentrons',
    agent:
      // define the registration agent as usb if any usb hostname address exists
      // may change when ODD no longer needs to rely on this
      isUsbConnected ? 'com.opentrons.app.usb' : 'com.opentrons.app',
    agentId: userId,
  })

  return robot != null ? (
    <>
      <Flex
        alignItems={ALIGN_START}
        backgroundColor={COLORS.white}
        flexDirection={DIRECTION_COLUMN}
        paddingTop={SPACING.spacing8}
        position={POSITION_RELATIVE}
        width="100%"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          marginBottom={SPACING.spacing16}
          width="100%"
        >
          <Flex>
            <img
              src={robotModel === 'OT-2' ? OT2_PNG : FLEX_PNG}
              style={{
                width: '6rem',
                height: '5.4375rem',
              }}
              id="RobotOverview_robotImage"
            />
          </Flex>
          <Box padding={SPACING.spacing8} width="100%">
            <Box marginBottom={SPACING.spacing8}>
              <ReachableBanner robot={robot} />
            </Box>
            <UpdateRobotBanner robot={robot} marginBottom={SPACING.spacing8} />
            {showRecoveryBanner ? (
              <ErrorRecoveryBanner
                recoveryIntent={recoveryIntent}
                marginBottom={SPACING.spacing8}
              />
            ) : null}
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
              <RobotStatusHeader
                name={robot.name}
                local={robot.local}
                robotModel={robotModel}
              />
              <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  paddingRight={SPACING.spacing16}
                >
                  <LegacyStyledText
                    as="h6"
                    color={COLORS.grey60}
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    paddingBottom={SPACING.spacing4}
                    textTransform={TYPOGRAPHY.textTransformUppercase}
                  >
                    {t('controls')}
                  </LegacyStyledText>
                  <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                    <Flex paddingBottom={SPACING.spacing4}>
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
                    <LegacyStyledText
                      as="p"
                      color={isRobotViewable ? COLORS.black90 : COLORS.grey40}
                    >
                      {t('lights')}
                    </LegacyStyledText>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Box>
          <Box
            position={POSITION_ABSOLUTE}
            top={SPACING.spacing4}
            right="-.75rem"
          >
            <RobotOverviewOverflowMenu robot={robot} />
          </Box>
        </Flex>
      </Flex>
      {robotModel === 'OT-2' && !isRobotBusy && isRobotViewable ? (
        <CalibrationStatusBanner robotName={robotName} />
      ) : null}
      <Flex
        borderBottom={BORDERS.lineBorder}
        marginBottom={SPACING.spacing16}
        position={POSITION_RELATIVE}
        width="100%"
      />
    </>
  ) : null
}
