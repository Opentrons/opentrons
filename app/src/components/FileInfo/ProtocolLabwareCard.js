// @flow
// setup labware component
import * as React from 'react'
import round from 'lodash/round'

import {
  ALIGN_CENTER,
  FONT_WEIGHT_SEMIBOLD,
  Flex,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

import { InfoSection } from './InfoSection'
import { ProtocolLabwareList } from './ProtocolLabwareList'
import type { LabwareCalibrationObjects } from '../../calibration'

export type ProtocolLabwareProps = {|
  labware: {
    [key: string]: { count: number, display: string, parent: string },
  },
  labwareCalibrations: { [key: string]: LabwareCalibrationObjects },
|}

const TITLE = 'Required Labware'

export function ProtocolLabwareCard({
  labware,
  labwareCalibrations,
}: ProtocolLabwareProps): React.Node {
  if (Object.keys(labware).length === 0) return null

  const labwareToParentMap = {}
  Object.keys(labware).forEach((type, index) => {
    const currentLabware = labwareCalibrations[type]?.attributes
    let calibrationData
    if (currentLabware) {
      const offset = currentLabware?.calibrationData?.offset.value
      const X = parseFloat(round(offset[0], 1)).toFixed(1)
      const Y = parseFloat(round(offset[1], 1)).toFixed(1)
      const Z = parseFloat(round(offset[2], 1)).toFixed(1)
      calibrationData = (
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          key={`${index}`}
        >
          <div style={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>X</div>
          <div>{X}</div>
          <div style={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>Y</div>
          <div>{Y}</div>
          <div style={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>Z</div>
          <div>{Z}</div>
        </Flex>
      )
    } else {
      calibrationData = (
        <Flex align={ALIGN_CENTER} key={`${index}`}>
          Not yet calibrated
        </Flex>
      )
    }

    return (labwareToParentMap[type] = {
      parent: labware[type].parent,
      quantity: `x${labware[type].count}`,
      display: labware[type].display,
      calibration: calibrationData,
    })
  })
  console.log(labwareToParentMap)

  return (
    <InfoSection title={TITLE}>
      <ProtocolLabwareList loadNameMap={labwareToParentMap} />
    </InfoSection>
  )
}
