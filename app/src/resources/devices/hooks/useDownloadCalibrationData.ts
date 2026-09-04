import {
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { saveFileWithPicker } from '/app/local-resources/files/saveFileWithPicker'
import {
  ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
  useTrackEvent,
} from '/app/redux/analytics'
import { saveFileToUsb } from '/app/redux/shell/remote'

interface UseDownloadCalibrationDataResult {
  downloadCalibration: (usbPath?: string) => Promise<void>
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

  const downloadCalibration = (usbPath?: string): Promise<void> => {
    doTrackEvent({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
      properties: { robotType: FLEX_ROBOT_TYPE },
    })
    const filename = `${robotName}-calibration.json`
    const jsonString = JSON.stringify({
      instrumentData: attachedInstruments,
      moduleData: attachedModules,
    })
    if (usbPath != null) {
      const buffer = new TextEncoder().encode(jsonString).buffer
      return saveFileToUsb(`${usbPath}/${filename}`, buffer)
    }
    return saveFileWithPicker(filename, new Blob([jsonString]))
  }

  return {
    downloadCalibration,
    isLoading: isLoadingInstruments || isLoadingModules,
  }
}
