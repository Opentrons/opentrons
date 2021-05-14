// RobotSettings card for robot status
import * as React from 'react'
import cx from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  Card,
  Flex,
  Box,
  SecondaryBtn,
  Tooltip,
  useInterval,
  useHoverTooltip,
  ALIGN_FLEX_START,
  FLEX_NONE,
  SPACING_AUTO,
  SPACING_3,
} from '@opentrons/components'

import { getBuildrootUpdateDisplayInfo } from '../../../redux/buildroot'
import { checkShellUpdate } from '../../../redux/shell'
import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
} from '../../../redux/discovery'
import { LabeledValue } from '../../../atoms/structure'

import type { State, Dispatch } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'

export interface InformationCardProps {
  robot: ViewableRobot
  updateUrl: string
}

const UPDATE_RECHECK_DELAY_MS = 60000

export function InformationCard(props: InformationCardProps): JSX.Element {
  const { robot, updateUrl } = props
  const { t } = useTranslation(['robot_info', 'shared'])

  const [updateBtnProps, updateBtnTooltipProps] = useHoverTooltip()
  const { autoUpdateAction, autoUpdateDisabledReason } = useSelector(
    (state: State) => {
      return getBuildrootUpdateDisplayInfo(state, robot.name)
    }
  )

  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])

  const { displayName } = robot
  const unknown = t('shared:unknown')
  const version = getRobotApiVersion(robot)
  const firmwareVersion = getRobotFirmwareVersion(robot)
  const protocolApiVersions = getRobotProtocolApiVersion(robot)
  const minProtocolApiVersion = protocolApiVersions?.min ?? unknown
  const maxProtocolApiVersion = protocolApiVersions?.max ?? unknown
  const apiVersionMinMax = t('api_version_min_max', {
    min: minProtocolApiVersion,
    max: maxProtocolApiVersion,
  })

  const updateDisabled = autoUpdateDisabledReason !== null

  // check for available updates on an interval
  useInterval(checkAppUpdate, UPDATE_RECHECK_DELAY_MS)

  return (
    <Card title={t('title')}>
      <Flex alignItems={ALIGN_FLEX_START} padding={SPACING_3}>
        <Box marginRight={SPACING_3}>
          <Box marginBottom={SPACING_3}>
            <LabeledValue label={`${t('robot_name')}:`} value={displayName} />
          </Box>
          <LabeledValue
            label={`${t('firmware_version')}:`}
            value={firmwareVersion || unknown}
          />
        </Box>
        <Box marginRight={SPACING_AUTO}>
          <Box marginBottom={SPACING_3}>
            <LabeledValue
              label={`${t('server_version')}:`}
              value={version || unknown}
            />
          </Box>
          <LabeledValue
            label={`${t('supported_api_versions')}:`}
            value={apiVersionMinMax}
          />
        </Box>
        <SecondaryBtn
          {...updateBtnProps}
          as={Link}
          to={!updateDisabled ? updateUrl : '#'}
          flex={FLEX_NONE}
          minWidth="9rem"
          className={cx({ disabled: updateDisabled })}
        >
          {autoUpdateAction}
        </SecondaryBtn>
        {autoUpdateDisabledReason !== null && (
          <Tooltip {...updateBtnTooltipProps}>
            {autoUpdateDisabledReason}
          </Tooltip>
        )}
      </Flex>
    </Card>
  )
}
