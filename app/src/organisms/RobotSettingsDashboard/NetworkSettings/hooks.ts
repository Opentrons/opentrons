import { useSelector } from 'react-redux'
import { getOnDeviceDisplaySettings } from '../../../redux/config'

export const useUnboxingFlowUncompleted = (): boolean => {
  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  return unfinishedUnboxingFlowRoute !== null
}
