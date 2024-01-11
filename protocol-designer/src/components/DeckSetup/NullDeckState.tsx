import * as React from 'react'
import { getDeckDefinitions } from '@opentrons/shared-data'
import {
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_BOLD,
  RobotCoordsText,
  RobotWorkSpace,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { i18n } from '../../localization'
import {
  VIEWBOX_HEIGHT,
  VIEWBOX_MIN_X,
  VIEWBOX_MIN_Y,
  VIEWBOX_WIDTH,
} from './constants'
import { DECK_LAYER_BLOCKLIST } from './index'

import styles from './DeckSetup.module.css'

export const NullDeckState = (): JSX.Element => {
  const deckDef = React.useMemo(() => getDeckDefinitions().ot2_standard, [])

  return (
    <div className={styles.deck_row}>
      <div className={styles.deck_wrapper}>
        <RobotWorkSpace
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
          deckDef={deckDef}
          viewBox={`${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          width="100%"
          height="100%"
        >
          {() => (
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
          )}
        </RobotWorkSpace>
      </div>
    </div>
  )
}
