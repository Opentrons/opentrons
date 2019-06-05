// @flow
import React, { useMemo } from 'react'

import { RobotWorkSpace, LabwareOnDeck } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
// import ConnectedSlotItem from './ConnectedSlotItem'
import LabwareItem from './LabwareItem'

// import styles from './styles.css'

const deckSetupLayerBlacklist = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'screwHoles',
]

export default function DeckMap() {
  const deckDef = useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  //  <Deck LabwareComponent={ConnectedSlotItem} className={styles.deck} />
  return (
    <RobotWorkSpace
      deckLayerBlacklist={deckSetupLayerBlacklist}
      deckDef={deckDef}
      viewBox={`-46 -70 ${488} ${514}`} // TODO: put these in variables
    >
      {({ slots, getRobotCoordsFromDOMCoords }) => (
        <>
          {map(containedLabware, labwareOnDeck => (
            <LabwareOnDeck
              key={labwareOnDeck.id}
              x={slots[labwareOnDeck.slot].position[0]}
              y={slots[labwareOnDeck.slot].position[1]}
              labwareOnDeck={labwareOnDeck}
            />
          ))}
        </>
      )}
    </RobotWorkSpace>
  )
}

export { LabwareItem }
export type { LabwareItemProps } from './LabwareItem'
