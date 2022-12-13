import { useDeckCalibrationData } from './'

import type { TaskProps } from '../../TaskList/types'

/*
Create a function that synthesizes the information collected from an OT2’s various equipment and calibration data endpoints
and generates a taskList value that can be passed to the new TaskList component as a prop.
The necessary information can be found in the following locations:

- useDeckCalibrationData : retrieves the deck calibration value for the first task in the list.
  If isDeckCalibrated pass the calibration data’s timestamp in the last completed xxx  body

- useAttachedPipettes : retrieves the pipettes that are currently attached to the robot.
  If a mount is empty, the task should be disabled and its body should read “Empty“.
  If a mount is not empty it should provide two subtasks:
    - Tip Length Calibration, this should read its value from useTipLengthCalibrations.
      Search for a calibration value that matches the mounted pipette’s serial number (id), and any tip rack.
      If no value CTA should be tertiary button “Calibrate“ otherwise linkPSemibold “Recalibrate“
    - Pipette Offset Calibration, this should read its value from usePipetteOffsetCalibrations.
      Search for a calibration value that matches the pipette’s serial number (id).
      If no value CTA should be tertiary button “Calibrate“ otherwise linkPSemibold “Recalibrate“
*/

export function useGenerateTaskList(robotName: string): TaskProps[] {
  const taskList: TaskProps[] = []
  const { isDeckCalibrated } = useDeckCalibrationData(robotName)

  return taskList
}
