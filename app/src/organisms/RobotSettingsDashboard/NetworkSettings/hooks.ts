import { useSelector } from 'react-redux'
import { getOnDeviceDisplaySettings } from '../../../redux/config'

export const useIsUnboxingFlowOngoing = (): boolean => {
  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )
  return unfinishedUnboxingFlowRoute !== null
}
