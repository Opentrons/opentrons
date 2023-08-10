import { useSelector } from 'react-redux'
import {
  getIsOnDevice,
  getOnDeviceDisplaySettings,
} from '../../../redux/config'

export const useIsUnboxingFlowOngoing = (): boolean => {
  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  const isOnDevice = useSelector(getIsOnDevice)
  return isOnDevice && unfinishedUnboxingFlowRoute !== null
}
