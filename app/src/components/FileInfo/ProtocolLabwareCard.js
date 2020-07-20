// @flow
// setup labware component
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import round from 'lodash/round'

import { InfoSection } from './InfoSection'
import { ProtocolLabwareList } from './ProtocolLabwareList'
import * as labwareFunctions from '../../calibration'
import { associateLabwareWithCalibration } from '../../protocol'

import type { State, Dispatch } from '../../types'

export type ProtocolLabwareProps = {|
  robotName: string,
|}

const TITLE = 'Required Labware'

export function ProtocolLabwareCard({
  robotName,
}: ProtocolLabwareProps): React.Node {
  const dispatch = useDispatch<Dispatch>()
  React.useEffect(() => {
    dispatch(labwareFunctions.fetchAllLabwareCalibrations(robotName))
  }, [dispatch, robotName])
  const labwareWithCalibration = useSelector((state: State) =>
    associateLabwareWithCalibration(state, robotName)
  )
  if (labwareWithCalibration.length === 0) return null

  const labwareToParentMap = []
  labwareWithCalibration.map(labwareInfo => {
    const offset = labwareInfo.calibration
    let calibrationData = null
    if (offset) {
      const X = parseFloat(round(offset.x, 1)).toFixed(1)
      const Y = parseFloat(round(offset.y, 1)).toFixed(1)
      const Z = parseFloat(round(offset.z, 1)).toFixed(1)
      calibrationData = { x: X, y: Y, z: Z }
    }

    labwareToParentMap.push({
      parent: labwareInfo.parent,
      quantity: labwareInfo.quantity,
      display: labwareInfo.display,
      calibration: calibrationData,
    })
  })

  return (
    <InfoSection title={TITLE}>
      <ProtocolLabwareList loadNameMap={labwareToParentMap} />
    </InfoSection>
  )
}
