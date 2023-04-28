import { useTranslation } from 'react-i18next'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useAllTipLengthCalibrationsQuery,
  useCalibrationStatusQuery,
  useDeleteCalibrationMutation,
} from '@opentrons/react-api-client'

import { useAttachedPipettes } from '.'
import { getDefaultTiprackDefForPipetteName } from '../constants'
import { DECK_CAL_STATUS_OK } from '../../../redux/calibration/constants'
import { formatTimestamp } from '../utils'

import type {
  SubTaskProps,
  TaskListProps,
  TaskProps,
} from '../../TaskList/types'
import type { AttachedPipette } from '../../../redux/pipettes/types'
import type { DashboardCalOffsetInvoker } from '../../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibratePipOffset'
import type { DashboardCalTipLengthInvoker } from '../../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateTipLength'
import type { DashboardCalDeckInvoker } from '../../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateDeck'
import { getLabwareDefURI, PipetteName } from '@opentrons/shared-data'

const CALIBRATION_DATA_POLL_MS = 5000

export function useCalibrationTaskList(
  pipOffsetCalLauncher: DashboardCalOffsetInvoker = () => {},
  tipLengthCalLauncher: DashboardCalTipLengthInvoker = () => {},
  deckCalLauncher: DashboardCalDeckInvoker = () => {}
): TaskListProps {
  const { t } = useTranslation(['robot_calibration', 'devices_landing'])
  const { deleteCalibration } = useDeleteCalibrationMutation()
  const TASK_LIST_LENGTH = 3
  let taskIndex = 0
  let activeTaskIndices: [number, number] | null = null
  const taskList: TaskListProps = {
    activeIndex: null,
    taskListStatus: 'incomplete',
    taskList: [],
    isLoading: false,
  }
  const attachedPipettes = useAttachedPipettes()

  const {
    data: calStatusData,
    isLoading: calStatusIsLoading,
  } = useCalibrationStatusQuery({ refetchInterval: CALIBRATION_DATA_POLL_MS })
  const {
    data: pipOffsetData,
    isLoading: pipOffsetIsLoading,
  } = useAllPipetteOffsetCalibrationsQuery({
    refetchInterval: CALIBRATION_DATA_POLL_MS,
  })
  const {
    data: tipLengthData,
    isLoading: tipLengthIsLoading,
  } = useAllTipLengthCalibrationsQuery({
    refetchInterval: CALIBRATION_DATA_POLL_MS,
  })

  taskList.isLoading =
    calStatusIsLoading || pipOffsetIsLoading || tipLengthIsLoading
  // 3 main tasks: Deck, Left Mount, and Right Mount Calibrations
  const deckCalibrations = calStatusData?.deckCalibration ?? null

  const isDeckCalibrated =
    deckCalibrations?.status != null &&
    deckCalibrations?.status === DECK_CAL_STATUS_OK

  const deckCalibrationData = deckCalibrations?.data

  // get calibration data for mounted pipette subtasks
  const offsetCalibrations = pipOffsetData?.data ?? []
  const tipLengthCalibrations = tipLengthData?.data ?? []

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
    deckTask.cta = { label: t('recalibrate'), onClick: deckCalLauncher }
  } else {
    activeTaskIndices = [0, 0]
    deckTask.description = t('start_with_deck_calibration')
    deckTask.cta = { label: t('calibrate'), onClick: deckCalLauncher }
    if (deckCalibrationData?.status?.markedBad === true) {
      deckTask.markedBad = true
    }
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
          onClick: () =>
            tipLengthCalLauncher({
              params: { mount },
              hasBlockModalResponse: null,
            }),
        }
        tipLengthSubTask.isComplete = true

        offsetSubTask.footer = t('robot_calibration:last_completed_on', {
          timestamp: formatTimestamp(offsetCalForPipette.lastModified),
        })
        offsetSubTask.cta = {
          label: t('robot_calibration:recalibrate'),
          onClick: () => pipOffsetCalLauncher({ params: { mount } }),
        }
        offsetSubTask.isComplete = true

        // also the parent pipette task can be marked as complete as well
        pipetteTask.isComplete = true

        // add the subTasks to the parent task, increment the taskIndex if we aren't at the end, then continue the loop
        pipetteTask.subTasks.push(tipLengthSubTask)
        pipetteTask.subTasks.push(offsetSubTask)

        pipetteTask.markedBad = pipetteTask.subTasks.some(st => st.markedBad)

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
            onClick: () =>
              tipLengthCalLauncher({
                params: { mount },
                hasBlockModalResponse: null,
              }),
          }

          if (tipLengthCalForPipette?.status.markedBad === true) {
            tipLengthSubTask.markedBad = true
            tipLengthSubTask.footer = t('calibration_recommended')
          }
        } else {
          // the tip length calibration is present and valid
          tipLengthSubTask.footer = t('robot_calibration:last_completed_on', {
            timestamp: formatTimestamp(tipLengthCalForPipette.lastModified),
          })
          tipLengthSubTask.cta = {
            label: t('robot_calibration:recalibrate'),
            onClick: () =>
              tipLengthCalLauncher({
                params: { mount },
                hasBlockModalResponse: null,
              }),
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
            onClick: () => pipOffsetCalLauncher({ params: { mount } }),
          }

          if (offsetCalForPipette?.status.markedBad === true) {
            offsetSubTask.markedBad = true
            offsetSubTask.footer = t('calibration_recommended')
          }
        } else {
          // the offset calibration is present and valid
          offsetSubTask.footer = t('robot_calibration:last_completed_on', {
            timestamp: formatTimestamp(offsetCalForPipette.lastModified),
          })
          offsetSubTask.cta = {
            label: t('robot_calibration:recalibrate'),
            onClick: () => pipOffsetCalLauncher({ params: { mount } }),
          }
          offsetSubTask.isComplete = true
        }

        // We've got the appropriately constructed subtasks, push them to the pipette task, then the task list
        pipetteTask.subTasks.push(tipLengthSubTask)
        pipetteTask.subTasks.push(offsetSubTask)

        pipetteTask.markedBad = pipetteTask.subTasks.some(st => st.markedBad)

        taskList.taskList.push(pipetteTask)

        if (taskIndex < TASK_LIST_LENGTH - 1) {
          taskIndex++
        }
        continue
      }
    }
  }

  taskList.activeIndex = activeTaskIndices

  // Set top-level state of calibration status
  // if the tasklist is empty, though, all calibrations are good

  let calibrationStatus = 'incomplete'

  if (activeTaskIndices == null) {
    calibrationStatus = 'complete'
    // if we have tasks and they are all marked bad, then we should
    // strongly suggest they re-do those calibrations
  } else if (
    taskList.taskList.every(tp => tp.isComplete === true || tp.markedBad)
  ) {
    calibrationStatus = 'bad'
  }
  taskList.taskListStatus = calibrationStatus

  // now that the task list is constructed we can check and see if tasks
  // in 'recalibration' state need to invalidate calibration data of later tasks if performed

  // Recalibrating the Deck will clear all pipette offset calibrations
  if (
    (taskList.taskList[0].isComplete === true ||
      taskList.taskList[0].markedBad === true) &&
    offsetCalibrations != null
  ) {
    const invalidateHandler = (): void => {
      for (const cal of offsetCalibrations) {
        deleteCalibration({
          calType: 'pipetteOffset',
          mount: cal.mount,
          pipette_id: cal.pipette,
        })
      }
    }
    if (taskList.taskList[0].cta != null) {
      taskList.taskList[0].cta.onClick = () =>
        deckCalLauncher({ invalidateHandler })
    }
  }

  // Recalibrating Tip Length for a mount clears the pipette offset calibrations for that tip
  if (
    (taskList.taskList[1]?.subTasks[0]?.isComplete === true ||
      taskList.taskList[1]?.subTasks[0]?.markedBad === true) &&
    (taskList.taskList[1]?.subTasks[1]?.isComplete === true ||
      taskList.taskList[1]?.subTasks[1]?.markedBad === true)
  ) {
    const invalidateHandler = (): void => {
      if (attachedPipettes.left != null) {
        const tiprackDef = getDefaultTiprackDefForPipetteName(
          attachedPipettes.left.name as PipetteName
        )
        if (tiprackDef != null) {
          const tiprackUri = getLabwareDefURI(tiprackDef)
          const offsetCals = offsetCalibrations?.filter(
            cal =>
              cal.pipette === attachedPipettes?.left?.id &&
              cal.tiprackUri === tiprackUri
          )
          if (offsetCals != null) {
            for (const cal of offsetCals) {
              deleteCalibration({
                calType: 'pipetteOffset',
                mount: cal.mount,
                pipette_id: cal.pipette,
              })
            }
          }
        }
      }
    }
    if (taskList.taskList[1].subTasks[0].cta != null) {
      taskList.taskList[1].subTasks[0].cta.onClick = () =>
        tipLengthCalLauncher({
          params: { mount: 'left' },
          hasBlockModalResponse: null,
          invalidateHandler,
        })
    }
  }

  if (
    (taskList.taskList[2]?.subTasks[0]?.isComplete === true ||
      taskList.taskList[2]?.subTasks[0]?.markedBad === true) &&
    (taskList.taskList[2]?.subTasks[1]?.isComplete === true ||
      taskList.taskList[2]?.subTasks[1]?.markedBad === true)
  ) {
    const invalidateHandler = (): void => {
      if (attachedPipettes.right != null) {
        const tiprackDef = getDefaultTiprackDefForPipetteName(
          attachedPipettes.right.name as PipetteName
        )
        if (tiprackDef != null) {
          const tiprackUri = getLabwareDefURI(tiprackDef)
          const offsetCals = offsetCalibrations?.filter(
            cal =>
              cal.pipette === attachedPipettes?.right?.id &&
              cal.tiprackUri === tiprackUri
          )
          if (offsetCals != null) {
            for (const cal of offsetCals) {
              deleteCalibration({
                calType: 'pipetteOffset',
                mount: cal.mount,
                pipette_id: cal.pipette,
              })
            }
          }
        }
      }
    }
    if (taskList.taskList[2].subTasks[0].cta != null) {
      taskList.taskList[2].subTasks[0].cta.onClick = () =>
        tipLengthCalLauncher({
          params: { mount: 'right' },
          hasBlockModalResponse: null,
          invalidateHandler,
        })
    }
  }

  return taskList
}
