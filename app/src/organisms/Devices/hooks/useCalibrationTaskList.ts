import { useTranslation } from 'react-i18next'
import {
  useAttachedPipettes,
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useTipLengthCalibrations,
} from '.'

import { formatTimestamp } from '../utils'

import type {
  SubTaskProps,
  TaskListProps,
  TaskProps,
} from '../../TaskList/types'
import type { AttachedPipette } from '../../../redux/pipettes/types'

export function useCalibrationTaskList(robotName: string): TaskListProps {
  const { t } = useTranslation(['robot_calibration', 'devices_landing'])
  const TASK_LIST_LENGTH = 3
  let taskIndex = 0
  let activeTaskIndices: [number, number] | null = null
  const taskList: TaskListProps = {
    activeIndex: null,
    taskList: [],
  }
  // 3 main tasks: Deck, Left Mount, and Right Mount Calibrations
  const { isDeckCalibrated, deckCalibrationData } = useDeckCalibrationData(
    robotName
  )
  const attachedPipettes = useAttachedPipettes()
  // get calibration data for mounted pipette subtasks
  const tipLengthCalibrations = useTipLengthCalibrations(robotName)
  const offsetCalibrations = usePipetteOffsetCalibrations(robotName)

  // first create the shape of the deck calibration task, then update values based on calibration status
  const deckTask: TaskProps = {
    activeIndex: activeTaskIndices,
    subTasks: [],
    title: t('deck_calibration'),
    description: '',
    taskIndex,
    cta: undefined,
    footer: '',
    taskListLength: TASK_LIST_LENGTH,
  }
  if (isDeckCalibrated) {
    deckTask.isComplete = true
    deckTask.footer =
      deckCalibrationData != null &&
      'lastModified' in deckCalibrationData &&
      deckCalibrationData.lastModified != null
        ? t('last_completed_on', {
            timestamp: formatTimestamp(deckCalibrationData.lastModified),
          })
        : ''
    // todo(jb, 2022-12-14): wire up ctas to actually launch wizards (RAUT-292)
    deckTask.cta = { label: t('recalibrate'), onClick: () => {} }
  } else {
    activeTaskIndices = [0, 0]
    deckTask.description = t('start_with_deck_calibration')
    deckTask.cta = { label: t('calibrate'), onClick: () => {} }
  }

  taskList.taskList.push(deckTask)
  taskIndex++

  // Next up are the attached pipettes
  for (const [mount, pipetteData] of Object.entries<AttachedPipette | null>(
    attachedPipettes
  )) {
    const pipetteTask: TaskProps = {
      activeIndex: activeTaskIndices,
      subTasks: [],
      title: t(
        mount === 'left'
          ? 'devices_landing:left_mount'
          : 'devices_landing:right_mount'
      ),
      description: '',
      taskIndex,
      taskListLength: TASK_LIST_LENGTH,
    }

    if (pipetteData == null) {
      pipetteTask.description = t('devices_landing:empty')
      pipetteTask.isComplete = true

      taskList.taskList.push(pipetteTask)
      taskIndex++
    } else {
      const displayName = pipetteData.modelSpecs.displayName ?? ''

      pipetteTask.description = t('robot_calibration:pipette_name_and_serial', {
        name: displayName,
        serial: pipetteData.id,
      })

      const tipLengthCalForPipette = tipLengthCalibrations?.find(
        cal => cal.pipette === pipetteData.id
      )
      const offsetCalForPipette = offsetCalibrations?.find(
        cal => cal.pipette === pipetteData.id && cal.mount === mount
      )

      const tipLengthSubTask: SubTaskProps = {
        activeIndex: activeTaskIndices,
        subTaskIndex: 0,
        taskIndex,
        title: t('robot_calibration:tip_length_calibration'),
        description: '',
      }
      const offsetSubTask: SubTaskProps = {
        activeIndex: activeTaskIndices,
        subTaskIndex: 1,
        taskIndex,
        title: t('robot_calibration:pipette_offset_calibration'),
        description: '',
      }

      if (
        tipLengthCalForPipette !== undefined &&
        !tipLengthCalForPipette.status.markedBad &&
        offsetCalForPipette !== undefined &&
        !offsetCalForPipette.status.markedBad
      ) {
        // all pipette calibrations are complete and valid, set the appropriate subTask values
        tipLengthSubTask.footer = t('robot_calibration:last_completed_on', {
          timestamp: formatTimestamp(tipLengthCalForPipette.lastModified),
        })
        tipLengthSubTask.cta = {
          label: t('robot_calibration:recalibrate'),
          onClick: () => {},
        }
        tipLengthSubTask.isComplete = true

        offsetSubTask.footer = t('robot_calibration:last_completed_on', {
          timestamp: formatTimestamp(offsetCalForPipette.lastModified),
        })
        offsetSubTask.cta = {
          label: t('robot_calibration:recalibrate'),
          onClick: () => {},
        }
        offsetSubTask.isComplete = true

        // also the parent pipette task can be marked as complete as well
        pipetteTask.isComplete = true

        // add the subTasks to the parent task, increment the taskIndex if we aren't at the end, then continue the loop
        pipetteTask.subTasks.push(tipLengthSubTask)
        pipetteTask.subTasks.push(offsetSubTask)

        taskList.taskList.push(pipetteTask)

        if (taskIndex < TASK_LIST_LENGTH - 1) {
          taskIndex++
        }
        continue
      } else {
        // at least one of the calibrations is not present or not valid
        // lets walk through each calibration and build out the appropriate subtask object for each
        if (
          tipLengthCalForPipette === undefined ||
          tipLengthCalForPipette.status.markedBad
        ) {
          // We've got a bad, or non-existent tip length calibration
          if (activeTaskIndices == null) {
            // only updating this if it is still null, otherwise we'd be forgetting about the previous task that already modified this
            activeTaskIndices = [taskIndex, 0]
          }
          tipLengthSubTask.description = t(
            'robot_calibration:calibrate_tip_length'
          )
          tipLengthSubTask.cta = {
            label: t('robot_calibration:calibrate'),
            onClick: () => {},
          }
        } else {
          // the tip length calibration is present and valid
          tipLengthSubTask.footer = t('robot_calibration:last_completed_on', {
            timestamp: formatTimestamp(tipLengthCalForPipette.lastModified),
          })
          tipLengthSubTask.cta = {
            label: t('robot_calibration:recalibrate'),
            onClick: () => {},
          }
          tipLengthSubTask.isComplete = true
        }

        if (
          offsetCalForPipette === undefined ||
          offsetCalForPipette.status.markedBad
        ) {
          // We've got a bad, or non-existent offset calibration
          if (activeTaskIndices == null) {
            activeTaskIndices = [taskIndex, 1]
          }
          offsetSubTask.description = t(
            'robot_calibration:pipette_offset_calibration_on_mount',
            {
              mount,
            }
          )
          offsetSubTask.cta = {
            label: t('robot_calibration:calibrate'),
            onClick: () => {},
          }
        } else {
          // the offset calibration is present and valid
          offsetSubTask.footer = t('robot_calibration:last_completed_on', {
            timestamp: formatTimestamp(offsetCalForPipette.lastModified),
          })
          offsetSubTask.cta = {
            label: t('robot_calibration:recalibrate'),
            onClick: () => {},
          }
          offsetSubTask.isComplete = true
        }

        // We've got the appropriately constructed subtasks, push them to the pipette task, then the task list
        pipetteTask.subTasks.push(tipLengthSubTask)
        pipetteTask.subTasks.push(offsetSubTask)
        taskList.taskList.push(pipetteTask)

        if (taskIndex < TASK_LIST_LENGTH - 1) {
          taskIndex++
        }
        continue
      }
    }
  }

  taskList.activeIndex = activeTaskIndices
  return taskList
}
