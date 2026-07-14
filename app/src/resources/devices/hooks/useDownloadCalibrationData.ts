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
import { saveFileToUsb } from '/app/redux/shell/remote'

interface UseDownloadCalibrationDataResult {
  downloadCalibration: () => void
  isLoading: boolean
}

export function useDownloadCalibrationData(
  robotName: string,
  savePath?: string
): UseDownloadCalibrationDataResult {
  const doTrackEvent = useTrackEvent()
  const { data: attachedInstruments, isLoading: isLoadingInstruments } =
    useInstrumentsQuery()
  const { data: attachedModules, isLoading: isLoadingModules } =
    useModulesQuery()

  const downloadCalibration = (): void => {
    doTrackEvent({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
      properties: { robotType: FLEX_ROBOT_TYPE },
    })
    const filename = `${robotName}-calibration.json`
    const jsonString = JSON.stringify({
      instrumentData: attachedInstruments,
      moduleData: attachedModules,
    })
    if (savePath != null) {
      const buffer = new TextEncoder().encode(jsonString).buffer
      void saveFileToUsb(`${savePath}/${filename}`, buffer)
    } else {
      saveAs(new Blob([jsonString]), filename)
    }
  }

  return {
    downloadCalibration,
    isLoading: isLoadingInstruments || isLoadingModules,
  }
}
