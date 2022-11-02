import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  Btn,
  Flex,
  Icon,
  useHoverTooltip,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SecondaryTertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Tooltip } from '../../atoms/Tooltip'
import { useCurrentRunId } from '../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../organisms/RunTimeControl/hooks'
import { useProtocolDetailsForRun } from './hooks'

import type { DiscoveredRobot } from '../../redux/discovery/types'

type RobotStatusBannerProps = Pick<DiscoveredRobot, 'name' | 'local'> & {
  robotModel: string | null
}

export function RobotStatusBanner(props: RobotStatusBannerProps): JSX.Element {
  const { name, local, robotModel } = props
  const { t } = useTranslation([
    'devices_landing',
    'device_settings',
    'run_details',
  ])
  const history = useHistory()
  const [targetProps, tooltipProps] = useHoverTooltip()

  const currentRunId = useCurrentRunId()
  const currentRunStatus = useCurrentRunStatus()
  const { displayName } = useProtocolDetailsForRun(currentRunId)

  const runningProtocolBanner: JSX.Element | null =
    currentRunId != null ? (
      <Flex alignItems={ALIGN_CENTER}>
        <StyledText
          as="label"
          paddingRight={SPACING.spacing3}
          overflowWrap="anywhere"
        >
          {`${displayName}; ${t(`run_details:status_${currentRunStatus}`)}`}
        </StyledText>
        <Link
          to={`/devices/${name}/protocol-runs/${currentRunId}/${
            currentRunStatus === RUN_STATUS_IDLE ? 'setup' : 'run-log'
          }`}
          id={`RobotStatusBanner_${name}_goToRun`}
        >
          <SecondaryTertiaryButton>{t('go_to_run')}</SecondaryTertiaryButton>
        </Link>
      </Flex>
    ) : null

  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText
          as="h6"
          color={COLORS.darkGreyEnabled}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          paddingBottom={SPACING.spacing1}
          id={`RobotStatusBanner_${name}_robotModel`}
        >
          {robotModel}
        </StyledText>
        <Flex alignItems={ALIGN_CENTER} paddingBottom={SPACING.spacing4}>
          <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3}>
            <StyledText
              as="h3"
              id={`RobotStatusBanner_${name}_robotName`}
              overflowWrap="anywhere"
            >
              {name}
            </StyledText>
            <Btn
              {...targetProps}
              marginRight={SPACING.spacing3}
              onClick={() =>
                history.push(`/devices/${name}/robot-settings/networking`)
              }
            >
              <Icon
                // local boolean corresponds to a wired usb connection for OT-2
                // TODO(bh, 2022-10-19): for OT-3, determine what robot data looks like for wired usb and ethernet connections
                name={local != null && local ? 'usb' : 'wifi'}
                color={COLORS.darkGreyEnabled}
                size="1.25rem"
              />
            </Btn>
            <Tooltip tooltipProps={tooltipProps} width="auto">
              {local != null && local
                ? t('device_settings:wired_usb')
                : t('device_settings:wifi')}
            </Tooltip>
          </Flex>
        </Flex>
      </Flex>
      {runningProtocolBanner}
    </Flex>
  )
}
