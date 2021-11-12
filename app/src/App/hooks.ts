import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  getNavbarLocations,
  getConnectedRobotPipettesMatch,
  getConnectedRobotPipettesCalibrated,
  getDeckCalibrationOk,
} from '../redux/nav'
import { useFeatureFlag } from '../redux/config'
import { getConnectedRobot } from '../redux/discovery'
import { useCurrentProtocolRun } from '../organisms/ProtocolUpload/hooks'
import { NavLocation } from '../redux/nav/types'

export function useRunLocation(): NavLocation {
  const { t } = useTranslation('top_navigation')
  const robot = useSelector(getConnectedRobot)
  const pipettesMatch = useSelector(getConnectedRobotPipettesMatch)
  const pipettesCalibrated = useSelector(getConnectedRobotPipettesCalibrated)
  const deckCalOk = useSelector(getDeckCalibrationOk)

  const { protocolRecord, runRecord } = useCurrentProtocolRun()

  let disabledReason = null
  if (!robot) disabledReason = t('please_connect_to_a_robot')
  else if (protocolRecord == null || runRecord == null)
    disabledReason = t('please_load_a_protocol')
  else if (!pipettesMatch) disabledReason = t('attached_pipettes_do_not_match')
  else if (!pipettesCalibrated) disabledReason = t('pipettes_not_calibrated')
  else if (!deckCalOk) disabledReason = t('calibrate_deck_to_proceed')

  return {
    id: 'run',
    path: '/run',
    title: t('run'),
    iconName: 'ot-run',
    disabledReason,
  }
}

export function useNavLocations(): NavLocation[] {
  const isPreProtocolFlowWithoutRPC = useFeatureFlag(
    'preProtocolFlowWithoutRPC'
  )
  const [robots, upload, calibrate, legacyRun, more] = useSelector(
    getNavbarLocations
  )

  const runLocation = useRunLocation()

  const legacyLocations = [robots, upload, calibrate, legacyRun, more]
  const navLocations = [robots, upload, runLocation, more]

  return isPreProtocolFlowWithoutRPC ? navLocations : legacyLocations
}
