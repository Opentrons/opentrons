// setup labware component
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { InfoSection } from './InfoSection'
import { ProtocolLabwareList } from './ProtocolLabwareList'
import {
  fetchLabwareCalibrations,
  getUniqueProtocolLabwareSummaries,
} from '../../../redux/calibration'

import type { State, Dispatch } from '../../../redux/types'

export interface ProtocolLabwareProps {
  robotName: string
}

// TODO(mc, 2020-07-27): i18n
const REQUIRED_LABWARE = 'Required Labware'

export function ProtocolLabwareCard(
  props: ProtocolLabwareProps
): JSX.Element | null {
  const { robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const labwareList = useSelector((state: State) => {
    return getUniqueProtocolLabwareSummaries(state, robotName)
  })

  React.useEffect(() => {
    dispatch(fetchLabwareCalibrations(robotName))
  }, [dispatch, robotName])

  if (labwareList.length === 0) return null

  return (
    <InfoSection title={REQUIRED_LABWARE}>
      <ProtocolLabwareList labware={labwareList} />
    </InfoSection>
  )
}
