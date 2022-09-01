import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Box,
  Flex,
  useInterval,
  ALIGN_CENTER,
  ALIGN_START,
  C_MED_LIGHT_GRAY,
  COLORS,
  C_WHITE,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  useHoverTooltip,
} from '@opentrons/components'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { ToggleButton, PrimaryButton } from '../../atoms/buttons'
import { Tooltip } from '../../atoms/Tooltip'
import { StyledText } from '../../atoms/text'
import { useDispatchApiRequest } from '../../redux/robot-api'
import { fetchLights } from '../../redux/robot-controls'
import { ChooseProtocolSlideout } from '../ChooseProtocolSlideout'
import { Portal } from '../../App/portal'
import { CONNECTABLE } from '../../redux/discovery'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import { RobotStatusBanner } from './RobotStatusBanner'
import { ReachableBanner } from './ReachableBanner'
import { RobotOverviewOverflowMenu } from './RobotOverviewOverflowMenu'
import { useLights, useRobot, useRunStatuses } from './hooks'
import { getBuildrootUpdateDisplayInfo } from '../../redux/buildroot'

import type { State } from '../../redux/types'

const EQUIPMENT_POLL_MS = 5000

interface RobotOverviewProps {
  robotName: string
}

export function RobotOverview({
  robotName,
}: RobotOverviewProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [dispatchRequest] = useDispatchApiRequest()
  const isRobotOnWrongVersionOfSoftware = ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => {
      return getBuildrootUpdateDisplayInfo(state, robotName)
    })?.autoUpdateAction
  )

  const robot = useRobot(robotName)
  const [
    showChooseProtocolSlideout,
    setShowChooseProtocolSlideout,
  ] = React.useState<boolean>(false)
  const { lightsOn, toggleLights } = useLights(robotName)
  const { isRunTerminal } = useRunStatuses()
  const currentRunId = useCurrentRunId()

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
      backgroundColor={C_WHITE}
      borderBottom={`1px solid ${C_MED_LIGHT_GRAY}`}
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING.spacing4}
      padding={SPACING.spacing3}
      position={POSITION_RELATIVE}
      width="100%"
    >
      <img
        src={OT2_PNG}
        style={{ paddingTop: SPACING.spacing3, width: '6rem' }}
        id="RobotOverview_robotImage"
      />
      <Box padding={SPACING.spacing3} width="100%">
        <ReachableBanner robot={robot} />
        {robot != null ? (
          <UpdateRobotBanner robot={robot} marginBottom={SPACING.spacing3} />
        ) : null}
        {robot?.status === CONNECTABLE ? (
          <RobotStatusBanner name={robot.name} local={robot.local} />
        ) : null}
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            paddingRight={SPACING.spacing4}
          >
            <StyledText
              as="h6"
              color={COLORS.darkGreyEnabled}
              paddingBottom={SPACING.spacing1}
              textTransform={TYPOGRAPHY.textTransformUppercase}
            >
              {t('controls')}
            </StyledText>
            <Flex alignItems={ALIGN_CENTER}>
              <ToggleButton
                label={t('lights')}
                toggledOn={lightsOn != null ? lightsOn : false}
                disabled={lightsOn === null || robot.status !== CONNECTABLE}
                onClick={toggleLights}
                height=".875rem"
                width="1.375rem"
                marginRight={SPACING.spacing3}
                id="RobotOverview_lightsToggle"
              />
              <StyledText as="p">{t('lights')}</StyledText>
            </Flex>
          </Flex>
          <PrimaryButton
            {...targetProps}
            marginBottom={SPACING.spacing4}
            textTransform={TYPOGRAPHY.textTransformNone}
            disabled={
              (currentRunId != null ? !isRunTerminal : false) ||
              robot.status !== CONNECTABLE ||
              isRobotOnWrongVersionOfSoftware
            }
            onClick={() => {
              setShowChooseProtocolSlideout(true)
            }}
          >
            {t('run_a_protocol')}
          </PrimaryButton>
          {isRobotOnWrongVersionOfSoftware && (
            <Tooltip tooltipProps={tooltipProps}>
              {t('shared:a_software_update_is_available')}
            </Tooltip>
          )}
          {robot.status === CONNECTABLE ? (
            <Portal level="top">
              <ChooseProtocolSlideout
                robot={robot}
                showSlideout={showChooseProtocolSlideout}
                onCloseClick={() => setShowChooseProtocolSlideout(false)}
              />
            </Portal>
          ) : null}
        </Flex>
      </Box>
      <Box position={POSITION_ABSOLUTE} top={SPACING.spacing2} right="-.75rem">
        <RobotOverviewOverflowMenu robot={robot} />
      </Box>
    </Flex>
  ) : null
}
