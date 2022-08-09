import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  Flex,
  Icon,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  COLORS,
} from '@opentrons/components'

import { SecondaryTertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { useCurrentRunId } from '../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../organisms/RunTimeControl/hooks'
import { useProtocolDetailsForRun } from './hooks'
import { getRobotModelByName } from '../../redux/discovery'

import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { State } from '../../redux/types'

type RobotStatusBannerProps = Pick<DiscoveredRobot, 'name' | 'local'>

export function RobotStatusBanner(props: RobotStatusBannerProps): JSX.Element {
  const { name, local } = props
  const { t } = useTranslation(['devices_landing', 'run_details'])

  const currentRunId = useCurrentRunId()
  const currentRunStatus = useCurrentRunStatus()
  const { displayName } = useProtocolDetailsForRun(currentRunId)
  const robotModel = useSelector((state: State) =>
    getRobotModelByName(state, name)
  )?.split(' ')[0]

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
          paddingBottom={SPACING.spacing1}
          id={`RobotStatusBanner_${name}_robotModel`}
        >
          {robotModel}
        </StyledText>
        <Flex alignItems={ALIGN_CENTER} paddingBottom={SPACING.spacing4}>
          <Flex alignItems={ALIGN_CENTER}>
            <StyledText
              as="h3"
              marginRight={SPACING.spacing3}
              id={`RobotStatusBanner_${name}_robotName`}
              overflowWrap="anywhere"
            >
              {name}
            </StyledText>
            <Icon
              // local boolean corresponds to a wired usb connection
              name={local ? 'usb' : 'wifi'}
              size="1.25rem"
              marginRight={SPACING.spacing3}
            />
          </Flex>
        </Flex>
      </Flex>
      {runningProtocolBanner}
    </Flex>
  )
}
