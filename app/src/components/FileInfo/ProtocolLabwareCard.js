// @flow
// setup labware component
import * as React from 'react'
import round from 'lodash/round'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
} from '@opentrons/components'

import { InfoSection } from './InfoSection'
import { ProtocolLabwareList } from './ProtocolLabwareList'

type ProtocolLabwareProps = {|
  labware: { string: number },
  labwareCalibrations: Object, // Note this should be { string: LabwareCalibrationObjects }, but flow was not passing
|}

const TITLE = 'Required Labware'

export function ProtocolLabwareCard({
  labware,
  labwareCalibrations,
}: ProtocolLabwareProps): React.Node {
  if (Object.keys(labware).length === 0) return null

  const labwareCalibration = Object.keys(labware).map(function(type, index) {
    const currentLabware = labwareCalibrations[type]?.attributes
    if (currentLabware) {
      const offset = currentLabware?.calibrationData?.offset.value
      const X = round(offset[0], 2)
      const Y = round(offset[1], 2)
      const Z = round(offset[2], 2)
      return (
        <tr key={`${index}`}>
          <td style={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>X</td>
          <td>{X}</td>
          <td style={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>Y</td>
          <td>{Y}</td>
          <td style={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>Z</td>
          <td>{Z}</td>
        </tr>
      )
    } else {
      return (
        <tr align={ALIGN_CENTER} key={`${index}`}>
          <td colSpan="6">Not yet calibrated</td>
        </tr>
      )
    }
  })

  const labwareCalibrationTable = (
    <table
      css={css`
        border-spacing: ${SPACING_1};
      `}
    >
      <tbody>{labwareCalibration}</tbody>
    </table>
  )
  const labwareQuantity = Object.keys(labware).map(type => `x${labware[type]}`)

  const labwareToParentMap = {}
  Object.keys(labware).forEach(type => {
    const parent = labwareCalibrations[type]?.attributes.parent ?? ''
    const spacedParent = parent
      .split(/(?=[A-Z])/)
      .map(s => s.toUpperCase())
      .join(' ')
    return (labwareToParentMap[type] = spacedParent)
  })

  return (
    <InfoSection title={TITLE}>
      <ProtocolLabwareList
        labware={Object.keys(labware)}
        quantity={labwareQuantity}
        calibration={labwareCalibrationTable}
        labwareToParent={labwareToParentMap}
      />
    </InfoSection>
  )
}
