import { getIsOnDevice, getOnDeviceDisplaySettings } from '/app/redux/config'
import { useSelector } from 'react-redux'

export const useIsUnboxingFlowOngoing = (): boolean => {
  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  const isOnDevice = useSelector(getIsOnDevice)
  return isOnDevice && unfinishedUnboxingFlowRoute !== null
}
