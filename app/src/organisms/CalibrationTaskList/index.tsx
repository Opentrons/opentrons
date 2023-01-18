import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import { COLORS } from '@opentrons/components'
import { Modal } from '../../molecules/Modal'
import { TaskList } from '../TaskList'

import { useCalibrationTaskList } from '../Devices/hooks'

import type { DashboardCalOffsetInvoker } from '../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibratePipOffset'
import type { DashboardCalTipLengthInvoker } from '../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateTipLength'
import type { DashboardCalDeckInvoker } from '../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateDeck'

interface CalibrationTaskListProps {
  robotName: string
  pipOffsetCalLauncher: DashboardCalOffsetInvoker
  tipLengthCalLauncher: DashboardCalTipLengthInvoker
  deckCalLauncher: DashboardCalDeckInvoker
}

export function CalibrationTaskList({
  robotName,
  pipOffsetCalLauncher,
  tipLengthCalLauncher,
  deckCalLauncher,
}: CalibrationTaskListProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const history = useHistory()
  const { activeIndex, taskList } = useCalibrationTaskList(
    robotName,
    pipOffsetCalLauncher,
    tipLengthCalLauncher,
    deckCalLauncher
  )

  return (
    <Modal
      title={`${robotName} ${t('calibration_dashboard')}`}
      onClose={() =>
        history.push(`/devices/${robotName}/robot-settings/calibration`)
      }
      fullPage
      backgroundColor={COLORS.fundamentalsBackground}
    >
      <TaskList activeIndex={activeIndex} taskList={taskList} />
    </Modal>
  )
}
