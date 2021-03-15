// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  RobotWorkSpace,
  RobotCoordsText,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_BOLD,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { i18n } from '../localization'
import {
  getBatchEditSelectedStepTypes,
  getHoveredItem,
} from '../ui/steps/selectors'
import { DeckSetup } from './DeckSetup'

// TODO IMMEDIATELY cleanup
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import styles from './DeckSetup/DeckSetup.css'

// TODO IMMEDIATELY: DRY this out, copied from DeckSetup.js
const NullDeckState = (): React.Node => {
  const deckDef = React.useMemo(() => getDeckDefinitions()['ot2_standard'], [])

  // TODO IMMEDIATELY reuse don't copy!!!
  const VIEWBOX_MIN_X = -64
  const VIEWBOX_MIN_Y = -10
  const VIEWBOX_WIDTH = 520
  const VIEWBOX_HEIGHT = 414
  const DECK_LAYER_BLOCKLIST = [
    'calibrationMarkings',
    'fixedBase',
    'doorStops',
    'metalFrame',
    'removalHandle',
    'removableDeckOutline',
    'screwHoles',
  ]

  return (
    <div className={styles.deck_row}>
      <div className={styles.deck_wrapper}>
        <RobotWorkSpace
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
          deckDef={deckDef}
          viewBox={`${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className={styles.robot_workspace}
        >
          {() => (
            <>
              {/* TODO(IL, 2021-03-15): use styled-components for RobotCoordsText instead of style prop */}
              <RobotCoordsText
                x={5}
                y={375}
                style={{ textTransform: TEXT_TRANSFORM_UPPERCASE }}
                fill="#cccccc"
                fontWeight={FONT_WEIGHT_BOLD}
                fontSize={FONT_SIZE_BODY_1}
              >
                {i18n.t('deck.inactive_deck')}
              </RobotCoordsText>
            </>
          )}
        </RobotWorkSpace>
      </div>
    </div>
  )
}

export const DeckSetupManager = (): React.Node => {
  const batchEditSelectedStepTypes = useSelector(getBatchEditSelectedStepTypes)
  const hoveredItem = useSelector(getHoveredItem)

  if (batchEditSelectedStepTypes.length === 0 || hoveredItem !== null) {
    // not batch edit mode, or batch edit while item is hovered: show the deck
    return <DeckSetup />
  } else {
    return <NullDeckState />
  }
}
