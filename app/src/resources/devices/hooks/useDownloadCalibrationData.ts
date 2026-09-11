import {
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
  useTrackEvent,
} from '/app/redux/analytics'
import { saveFileFromBuffer } from '/app/redux/shell/remote'

interface UseDownloadCalibrationDataResult {
  downloadCalibration: (destination?: string) => Promise<string>
  isLoading: boolean
}

export function useDownloadCalibrationData(
  robotName: string
): UseDownloadCalibrationDataResult {
  const doTrackEvent = useTrackEvent()
  const { data: attachedInstruments, isLoading: isLoadingInstruments } =
    useInstrumentsQuery()
  const { data: attachedModules, isLoading: isLoadingModules } =
    useModulesQuery()

  const downloadCalibration = async (destination?: string): Promise<string> => {
    doTrackEvent({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
      properties: { robotType: FLEX_ROBOT_TYPE },
    })
    const filename = `${robotName}-calibration.json`
    const jsonString = JSON.stringify({
      instrumentData: attachedInstruments,
      moduleData: attachedModules,
    })
    const buffer = new TextEncoder().encode(jsonString).buffer

    return await saveFileFromBuffer({
      name: filename,
      buffer,
      destination,
    })
  }

  return {
    downloadCalibration,
    isLoading: isLoadingInstruments || isLoadingModules,
  }
}
