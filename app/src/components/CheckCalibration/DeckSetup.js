// @flow
import * as React from 'react'
import map from 'lodash/map'
import {
  OutlineButton,
  RobotWorkSpace,
  LabwareRender,
  LabwareNameOverlay,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import { getLatestLabwareDef } from '../../getLabware'
import styles from './styles.css'

import type { LabwareDefinition2, DeckSlot } from '@opentrons/shared-data'
import type { RobotCalibrationCheckLabware } from '../../sessions/types'

const DECK_SETUP_PROMPT =
  'Place full tip rack(s) on the deck, in their designated slots, as illustrated below.'
const DECK_SETUP_BUTTON_TEXT = 'Confirm tip rack placement and continue'

type DeckSetupProps = {|
  labware: Array<RobotCalibrationCheckLabware>,
  proceed: () => mixed,
|}
export function DeckSetup(props: DeckSetupProps): React.Node {
  const { labware, proceed } = props
  const deckDef = React.useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  return (
    <>
      <div className={styles.prompt}>
        <p className={styles.prompt_text}>{DECK_SETUP_PROMPT}</p>
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
