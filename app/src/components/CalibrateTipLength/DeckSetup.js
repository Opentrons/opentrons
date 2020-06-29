// @flow
import {
  LabwareNameOverlay,
  LabwareRender,
  OutlineButton,
  RobotCoordsForeignDiv,
  RobotWorkSpace,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import {
  type DeckSlot,
  type LabwareDefinition2,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import map from 'lodash/map'
import * as React from 'react'

import { getLatestLabwareDef } from '../../getLabware'
import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'

const DECK_SETUP_WITH_BLOCK_PROMPT =
  'Place full tip rack and Calibration Block on the deck within their designated slots as illustrated below.'
const DECK_SETUP_NO_BLOCK_PROMPT =
  'Place full tip rack on the deck within the designated slot as illustrated below.'
const DECK_SETUP_BUTTON_TEXT = 'Confirm placement and continue'

export function DeckSetup(props: CalibrateTipLengthChildProps): React.Node {
  const deckDef = React.useMemo(() => getDeckDefinitions()['ot2_standard'], [])

  // TODO: get real has_block value and labware from tip length calibration session
  const has_block = true
  const labware = {}

  const proceed = () => {
    console.log('TODO: wire up command')
    // props.sendSessionCommand('loadLabware')
  }

  return (
    <>
      <div className={styles.prompt}>
        {has_block ? (
          <p className={styles.prompt_text}>{DECK_SETUP_WITH_BLOCK_PROMPT}</p>
        ) : (
          <p className={styles.prompt_text}>{DECK_SETUP_NO_BLOCK_PROMPT}</p>
        )}
        <OutlineButton
          className={styles.prompt_button}
          onClick={proceed}
          inverted
        >
          {DECK_SETUP_BUTTON_TEXT}
        </OutlineButton>
      </div>
      <div className={styles.deck_map_wrapper}>
        <RobotWorkSpace
          deckLayerBlocklist={[
            'fixedBase',
            'doorStops',
            'metalFrame',
            'removalHandle',
            'removableDeckOutline',
            'screwHoles',
            'calibrationMarkings',
          ]}
          deckDef={deckDef}
          viewBox={`-46 -10 ${488} ${390}`} // TODO: put these in variables
          className={styles.deck_map}
        >
          {({ deckSlotsById }) =>
            map(
              deckSlotsById,
              (slot: $Values<typeof deckSlotsById>, slotId) => {
                if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it
                const labwareForSlot = labware.find(l => l.slot === slotId)
                const labwareDef = getLatestLabwareDef(labwareForSlot?.loadName)

                // TODO: also render calibration block if present

                return labwareDef ? (
                  <TiprackRender
                    key={slotId}
                    slotDef={slot}
                    labwareDef={labwareDef}
                  />
                ) : null
              }
            )
          }
        </RobotWorkSpace>
      </div>
    </>
  )
}

type TiprackRenderProps = {|
  labwareDef: LabwareDefinition2,
  slotDef: DeckSlot,
|}
export function TiprackRender(props: TiprackRenderProps): React.Node {
  const { labwareDef, slotDef } = props
  const title = getLabwareDisplayName(labwareDef)
  return (
    <g transform={`translate(${slotDef.position[0]}, ${slotDef.position[1]})`}>
      <LabwareRender definition={labwareDef} />
      <RobotCoordsForeignDiv
        width={labwareDef.dimensions.xDimension}
        height={labwareDef.dimensions.yDimension}
        x={0}
        y={0 - labwareDef.dimensions.yDimension}
        transformWithSVG
        innerDivProps={{ className: styles.labware_ui_wrapper }}
      >
        {/* title is capitalized by CSS, and "µL" capitalized is "ML" */}
        <LabwareNameOverlay title={title.replace('µL', 'uL')} />
      </RobotCoordsForeignDiv>
    </g>
  )
}
