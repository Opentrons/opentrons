import { saveAs } from 'file-saver'

import {
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
  useTrackEvent,
} from '/app/redux/analytics'

interface UseDownloadCalibrationDataResult {
  downloadCalibration: () => void
}

export function useDownloadCalibrationData(
  robotName: string
): UseDownloadCalibrationDataResult {
  const doTrackEvent = useTrackEvent()
  const { data: attachedInstruments } = useInstrumentsQuery()
  const { data: attachedModules } = useModulesQuery()

  const downloadCalibration = (): void => {
    doTrackEvent({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
      properties: { robotType: FLEX_ROBOT_TYPE },
    })
    saveAs(
      new Blob([
        JSON.stringify({
          instrumentData: attachedInstruments,
          moduleData: attachedModules,
        }),
      ]),
      `opentrons-${robotName}-calibration.json`
    )
  }

  return { downloadCalibration }
}
