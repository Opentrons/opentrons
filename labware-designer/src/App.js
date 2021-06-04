import * as React from 'react'
import { RobotWorkSpace, LabwareRender } from '@opentrons/components'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import deck_def from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'

const LABWARE_SLOT = '1'

export function App() {
  const [labwareToRender, setLabwareToRender] = React.useState(fixture_96_plate)

  window.renderIrregularLabware = options => {
    const lw = window.sharedData.createIrregularLabware(options)
    setLabwareToRender(lw)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <RobotWorkSpace deckDef={deck_def} viewBox={`-46 -10 ${488} ${390}`}>
        {({ deckSlotsById }) => {
          const lwSlot = deckSlotsById[LABWARE_SLOT]
          return (
            <g
              transform={`translate(${lwSlot.position[0]}, ${lwSlot.position[1]})`}
            >
              <LabwareRender definition={labwareToRender} />
            </g>
          )
        }}
      </RobotWorkSpace>
    </div>
  )
}
