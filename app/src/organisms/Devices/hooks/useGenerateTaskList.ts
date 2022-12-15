import { getPipetteModelSpecs } from '@opentrons/shared-data'
import {
  useAttachedPipettes,
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useTipLengthCalibrations,
} from './'

import { formatTimestamp } from '../utils'

import type {
  SubTaskProps,
  TaskListProps,
  TaskProps,
} from '../../TaskList/types'
import type { AttachedPipette } from '../../../redux/pipettes/types'

export function useGenerateTaskList(robotName: string): TaskListProps {
  const TASK_LIST_LENGTH = 3
  let taskIndex = 0
  let activeTaskIndices: [number, number] | null = null
  const taskList: TaskListProps = {
    activeIndex: activeTaskIndices,
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
    title: 'Deck Calibration',
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
        ? `Last completed ${formatTimestamp(deckCalibrationData.lastModified)}`
        : ''
    // todo(jb, 2022-12-14): wire up ctas to actually launch wizards (RAUT-292)
    deckTask.cta = { label: 'Recalibrate', onClick: () => {} }
  } else {
    activeTaskIndices = [0, 0]
    deckTask.description =
      'Start with Deck Calibration, which is the basis for the rest of calibration.'
    deckTask.cta = { label: 'Calibrate', onClick: () => {} }
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
      title: `${mount[0].toUpperCase() + mount.slice(1)} Mount`,
      description: '',
      taskIndex,
      taskListLength: TASK_LIST_LENGTH,
    }

    if (pipetteData == null) {
      pipetteTask.description = 'Empty'
      pipetteTask.isComplete = true

      taskList.taskList.push(pipetteTask)
      taskIndex++
    } else {
      const displayName =
        (getPipetteModelSpecs(pipetteData.model)?.displayName as string) ?? ''

      pipetteTask.description = `${displayName}, ${pipetteData.id}`

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
        title: 'Tip Length Calibration',
        description: '',
      }
      const offsetSubTask: SubTaskProps = {
        activeIndex: activeTaskIndices,
        subTaskIndex: 1,
        taskIndex,
        title: 'Pipette Offset Calibration',
        description: '',
      }

      if (
        tipLengthCalForPipette !== undefined &&
        !tipLengthCalForPipette.status.markedBad &&
        offsetCalForPipette !== undefined &&
        !offsetCalForPipette.status.markedBad
      ) {
        // all pipette calibrations are complete and valid, set the appropriate subTask values
        tipLengthSubTask.footer = `Last completed ${formatTimestamp(
          tipLengthCalForPipette.lastModified
        )}`
        tipLengthSubTask.cta = { label: 'Recalibrate', onClick: () => {} }
        tipLengthSubTask.isComplete = true

        offsetSubTask.footer = `Last completed ${formatTimestamp(
          offsetCalForPipette.lastModified
        )}`
        offsetSubTask.cta = { label: 'Recalibrate', onClick: () => {} }
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
          if (activeTaskIndices === null) {
            // only updating this if it is still null, otherwise we'd be forgetting about the previous task that already modified this
            activeTaskIndices = [taskIndex, 0]
          }
          tipLengthSubTask.description =
            'Calibrate the length if a tip on this pipette.'
          tipLengthSubTask.cta = { label: 'Calibrate', onClick: () => {} }
        } else {
          // the tip length calibration is present and valid
          tipLengthSubTask.footer = `Last completed ${formatTimestamp(
            tipLengthCalForPipette.lastModified
          )}`
          tipLengthSubTask.cta = { label: 'Recalibrate', onClick: () => {} }
          tipLengthSubTask.isComplete = true
        }

        if (
          offsetCalForPipette === undefined ||
          offsetCalForPipette.status.markedBad
        ) {
          // We've got a bad, or non-existent offset calibration
          if (activeTaskIndices === null) {
            activeTaskIndices = [taskIndex, 0]
          }
          offsetSubTask.description = `Calibrate this pipette's offset while attached to the robot's ${mount} mount.`
          offsetSubTask.cta = { label: 'Calibrate', onClick: () => {} }
        } else {
          // the tip length calibration is present and valid
          offsetSubTask.footer = `Last completed ${formatTimestamp(
            offsetCalForPipette.lastModified
          )}`
          offsetSubTask.cta = { label: 'Recalibrate', onClick: () => {} }
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

  return taskList
}
