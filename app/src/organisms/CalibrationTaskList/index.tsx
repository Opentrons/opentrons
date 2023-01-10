import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import { COLORS } from '@opentrons/components'
import { Modal } from '../../molecules/Modal'
import { TaskList } from '../TaskList'

import { useCalibrationTaskList } from '../Devices/hooks'

interface CalibrationTaskListProps {
  robotName: string
}

export function CalibrationTaskList({
  robotName,
}: CalibrationTaskListProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const history = useHistory()
  const { activeIndex, taskList } = useCalibrationTaskList(robotName)

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
