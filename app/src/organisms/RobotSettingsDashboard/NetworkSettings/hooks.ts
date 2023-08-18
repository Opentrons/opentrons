import { useSelector } from 'react-redux'
import { getOnDeviceDisplaySettings } from '../../../redux/config'

export const useIsFinishedUnboxing = (): boolean => {
  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  return unfinishedUnboxingFlowRoute !== null
}
