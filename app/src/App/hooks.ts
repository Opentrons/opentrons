import { useSelector } from 'react-redux'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  getNavbarLocations,
  getConnectedRobotPipettesMatch,
  getConnectedRobotPipettesCalibrated,
  getDeckCalibrationOk,
} from '../redux/nav'
import { getConnectedRobot } from '../redux/discovery'
import { useIsProtocolRunLoaded } from '../organisms/ProtocolUpload/hooks'
import { NavLocation } from '../redux/nav/types'
import { displayNameByPathSegment } from './NextGenApp'

export function useRunLocation(): NavLocation {
  const { t } = useTranslation('top_navigation')
  const robot = useSelector(getConnectedRobot)
  const pipettesMatch = useSelector(getConnectedRobotPipettesMatch)
  const pipettesCalibrated = useSelector(getConnectedRobotPipettesCalibrated)
  const deckCalOk = useSelector(getDeckCalibrationOk)

  const isProtocolRunLoaded = useIsProtocolRunLoaded()

  let disabledReason = null
  if (!robot) disabledReason = t('please_connect_to_a_robot')
  else if (!isProtocolRunLoaded) disabledReason = t('please_load_a_protocol')
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
  const [robots, upload, more] = useSelector(getNavbarLocations)

  const runLocation = useRunLocation()

  const navLocations = [robots, upload, runLocation, more]

  return navLocations
}

export function usePathCrumbs(): string[] {
  const location = useLocation()

  // trim initial /
  const subPathname = location.pathname.substring(1)

  const crumbs = subPathname
    .split('/')
    // filter out path segments explicitly defined as null
    .filter(crumb => displayNameByPathSegment[crumb] !== null)
    // map to the display name if defined, or leave alone
    .map(crumb => displayNameByPathSegment[crumb] ?? crumb)

  return crumbs
}
