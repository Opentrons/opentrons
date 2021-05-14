// app info card with version and updated
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  AlertModal,
  Card,
  Icon,
  Text,
  Flex,
  SecondaryBtn,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_3,
  SPACING_4,
  SIZE_2,
  SIZE_4,
} from '@opentrons/components'

import {
  fetchSettings,
  updateSetting,
  getRobotSettings,
} from '../../../redux/robot-settings'
import { CONNECTABLE } from '../../../redux/discovery'
import { downloadLogs } from '../../../redux/shell/robot-logs/actions'
import { getRobotLogsDownloading } from '../../../redux/shell/robot-logs/selectors'
import { Portal } from '../../../App/portal'
import { LabeledValue, Divider } from '../../../atoms/structure'
import { ToggleBtn } from '../../../atoms/ToggleBtn'

import { UpdateFromFileControl } from './UpdateFromFileControl'
import { OpenJupyterControl } from './OpenJupyterControl'

import type { State, Dispatch } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'
import type { RobotSettings } from '../../../redux/robot-settings/types'

export interface AdvancedSettingsCardProps {
  robot: ViewableRobot
  resetUrl: string
}

const ROBOT_LOGS_OPTOUT_ID = 'disableLogAggregation'
export function AdvancedSettingsCard(
  props: AdvancedSettingsCardProps
): JSX.Element {
  const { robot, resetUrl } = props
  const { name, ip, health, status } = robot
  const { t } = useTranslation('robot_advanced_settings')
  const settings = useSelector<State, RobotSettings>(state =>
    getRobotSettings(state, name)
  )
  const robotLogsDownloading = useSelector(getRobotLogsDownloading)
  const dispatch = useDispatch<Dispatch>()
  const controlsDisabled = status !== CONNECTABLE
  const logsAvailable = health && health.logs

  const showLogOptoutModal = settings.some(
    s => s.id === ROBOT_LOGS_OPTOUT_ID && s.value === null
  )
  const setLogOptout = (value: boolean): unknown =>
    dispatch(updateSetting(name, ROBOT_LOGS_OPTOUT_ID, value))

  React.useEffect(() => {
    dispatch(fetchSettings(name))
  }, [dispatch, name])

  return (
    <Card title={t('title')}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} padding={SPACING_3}>
        <LabeledValue
          label={t('download_logs_label')}
          value={t('download_logs_description')}
        />
        <SecondaryBtn
          disabled={controlsDisabled || !logsAvailable || robotLogsDownloading}
          onClick={() => dispatch(downloadLogs(robot))}
          minWidth={SIZE_4}
          marginLeft={SPACING_4}
        >
          {robotLogsDownloading ? (
            <Icon name="ot-spinner" height="1em" spin />
          ) : (
            t('download_logs_button')
          )}
        </SecondaryBtn>
      </Flex>
      <Divider />
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} padding={SPACING_3}>
        <LabeledValue label={t('reset_label')} value={t('reset_description')} />
        <SecondaryBtn
          disabled={controlsDisabled}
          as={Link}
          to={resetUrl}
          minWidth={SIZE_4}
          marginLeft={SPACING_4}
        >
          {t('reset_button')}
        </SecondaryBtn>
      </Flex>
      <Divider />
      <UpdateFromFileControl robotName={name} />
      <Divider />
      <OpenJupyterControl robotIp={ip} />
      {settings.map(({ id, title, description, value }) => (
        <React.Fragment key={id}>
          <Divider />
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} padding={SPACING_3}>
            <LabeledValue label={title} value={description} />
            <ToggleBtn
              label={title}
              onClick={() => dispatch(updateSetting(name, id, !value))}
              toggledOn={value === true}
              disabled={controlsDisabled}
              size={SIZE_2}
              marginLeft={SPACING_4}
              flex="0 0 auto"
            />
          </Flex>
        </React.Fragment>
      ))}
      {showLogOptoutModal && (
        <Portal>
          <AlertModal
            alertOverlay
            heading={t('log_opt_out_heading')}
            buttons={[
              {
                children: t('opt_out'),
                onClick: () => setLogOptout(true),
              },
              {
                children: t('opt_in'),
                onClick: () => setLogOptout(false),
              },
            ]}
          >
            <Text>{t('log_opt_out_explanation')}</Text>
            <Text>{t('log_opt_out_instruction')}</Text>
          </AlertModal>
        </Portal>
      )}
    </Card>
  )
}
