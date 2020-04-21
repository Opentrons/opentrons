// @flow
import * as React from 'react'
import map from 'lodash/map'
import {
  OutlineButton,
  RobotWorkSpace,
  LabwareRender,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import {
  type LabwareDefinition2,
  type DeckSlot,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import { useDispatch } from 'react-redux'

import type { Dispatch } from '../../types'
import {
  preparePipetteRobotCalibrationCheckSession,
  shimCurrentStep,
  CHECK_STEP_PREPARING_PIPETTE,
} from '../../calibration'
import type { RobotCalibrationCheckLabware } from '../../calibration/api-types'
import { getLatestLabwareDef } from '../../getLabware'
import styles from './styles.css'

const DECK_SETUP_PROMPT =
  'Place full tiprack(s) on the deck, in their designated slots, as illustrated below.'
const DECK_SETUP_BUTTON_TEXT = 'Confirm tiprack placement and continue'

type DeckSetupProps = {|
  labware: Array<RobotCalibrationCheckLabware>,
|}
export function DeckSetup(props: DeckSetupProps) {
  const { labware, proceed } = props
  const deckDef = React.useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  const dispatch = useDispatch<Dispatch>()

  function proceed() {
    dispatch(preparePipetteRobotCalibrationCheckSession(robotName))
    dispatch(shimCurrentStep(CHECK_STEP_PREPARING_PIPETTE))
  }

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
          deckLayerBlacklist={[
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

type TiprackRenderProps = { labwareDef: LabwareDefinition2, slotDef: DeckSlot }
export function TiprackRender(props: TiprackRenderProps) {
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
        <div className={styles.labware_ui_content}>
          <div className={styles.name_overlay}>
            <p className={styles.display_name} title={title}>
              {/* title is capitalized by CSS, and "µL" capitalized is "ML" */}
              {title.replace('µL', 'uL')}
            </p>
          </div>
        </div>
      </RobotCoordsForeignDiv>
    </g>
  )
}
