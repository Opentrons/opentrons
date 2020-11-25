// @flow
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

import { getBuildrootUpdateDisplayInfo } from '../../buildroot'
import { checkShellUpdate } from '../../shell'
import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
} from '../../discovery'
import { LabeledValue } from '../structure'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

export type InformationCardProps = {|
  robot: ViewableRobot,
  updateUrl: string,
|}

const UPDATE_RECHECK_DELAY_MS = 60000

export function InformationCard(props: InformationCardProps): React.Node {
  const { robot, updateUrl } = props
  const { t } = useTranslation()
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
  const unknown = t('robot_settings.unknown')
  const version = getRobotApiVersion(robot)
  const firmwareVersion = getRobotFirmwareVersion(robot)
  const protocolApiVersions = getRobotProtocolApiVersion(robot)
  const minProtocolApiVersion = protocolApiVersions?.min ?? unknown
  const maxProtocolApiVersion = protocolApiVersions?.max ?? unknown
  const API_VERSION_DISPLAY = `Min: ${minProtocolApiVersion},  Max: ${maxProtocolApiVersion}`

  const updateDisabled = autoUpdateDisabledReason !== null

  // check for available updates on an interval
  useInterval(checkAppUpdate, UPDATE_RECHECK_DELAY_MS)

  return (
    <Card title={t('robot_settings.info.title')}>
      <Flex alignItems={ALIGN_FLEX_START} padding={SPACING_3}>
        <Box marginRight={SPACING_3}>
          <Box marginBottom={SPACING_3}>
            <LabeledValue
              label={`${t('robot_settings.info.robot_name')}:`}
              value={displayName}
            />
          </Box>
          <LabeledValue
            label={`${t('robot_settings.info.firmware_version')}:`}
            value={firmwareVersion || unknown}
          />
        </Box>
        <Box marginRight={SPACING_AUTO}>
          <Box marginBottom={SPACING_3}>
            <LabeledValue
              label={`${t('robot_settings.info.server_version')}:`}
              value={version || unknown}
            />
          </Box>
          <LabeledValue
            label={`${t('robot_settings.info.supported_api_versions')}:`}
            value={API_VERSION_DISPLAY}
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
