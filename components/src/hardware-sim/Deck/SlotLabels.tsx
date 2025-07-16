import clsx from 'clsx'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { DeckInfoLabel } from '../../molecules'
import styles from './deck.module.css'
import { RobotCoordsForeignObject } from './RobotCoordsForeignObject'

import type { RobotType } from '@opentrons/shared-data'

interface SlotLabelsProps {
  robotType: RobotType
  color?: string
  show4thColumn?: boolean
}

/**
 * Component to render Opentrons Flex slot labels
 * For use as a RobotWorkspace child component
 */
export const SlotLabels = ({
  robotType,
  color,
  show4thColumn = false,
}: SlotLabelsProps): JSX.Element | null => {
  const widthSmallRem = 10.5
  const widthLargeRem = 15.25

  const rowDynamicWidth = show4thColumn
    ? `${widthSmallRem * 2 + widthLargeRem * 2}rem`
    : `${widthSmallRem + widthLargeRem * 2}rem`

  const itemDynamicWidth = show4thColumn
    ? `${widthSmallRem}rem`
    : `${widthLargeRem}rem`

  const rowStyle: Record<string, string> = {
    '--dynamic-width': rowDynamicWidth,
  }
  const simpleItemWidthStyle: Record<string, string> = {
    '--dynamic-width': `${widthLargeRem}rem`,
  }
  const nextTo4thWidthStyle: Record<string, string> = {
    '--dynamic-width': itemDynamicWidth,
  }
  const fourthWidthStyle: Record<string, string> = {
    '--dynamic-width': `${widthSmallRem}rem`,
  }
  return robotType === FLEX_ROBOT_TYPE ? (
    <>
      <RobotCoordsForeignObject
        width="2.5rem"
        height="26.75rem"
        x="-147"
        y="-10"
      >
        <div className={styles.deck_labels_column}>
          <div className={styles.deck_label_column_container}>
            <DeckInfoLabel deckLabel="A" height="max-content" width="100%" />
          </div>
          <div className={styles.deck_label_column_container}>
            <DeckInfoLabel deckLabel="B" height="max-content" width="100%" />
          </div>
          <div className={styles.deck_label_column_container}>
            <DeckInfoLabel deckLabel="C" height="max-content" width="100%" />
          </div>
          <div className={styles.deck_label_column_container}>
            <DeckInfoLabel deckLabel="D" height="max-content" width="100%" />
          </div>
        </div>
      </RobotCoordsForeignObject>
      <RobotCoordsForeignObject
        height="2.5rem"
        width={`${
          show4thColumn
            ? widthSmallRem * 2 + widthLargeRem * 2
            : widthSmallRem + widthLargeRem * 2
        }rem`}
        x="-100"
        y="-55"
      >
        <div className={clsx(styles.deck_labels_row)} style={rowStyle}>
          <div
            className={styles.deck_label_row_container}
            style={simpleItemWidthStyle}
          >
            <DeckInfoLabel deckLabel="1" height="100%" />
          </div>
          <div
            className={styles.deck_label_row_container}
            style={simpleItemWidthStyle}
          >
            <DeckInfoLabel deckLabel="2" height="100%" />
          </div>
          <div
            className={styles.deck_label_row_container}
            style={nextTo4thWidthStyle}
          >
            <DeckInfoLabel deckLabel="3" height="100%" />
          </div>
          {show4thColumn ? (
            <div
              className={styles.deck_label_row_container}
              style={fourthWidthStyle}
            >
              <DeckInfoLabel deckLabel="4" height="100%" />
            </div>
          ) : null}
        </div>
      </RobotCoordsForeignObject>
    </>
  ) : null
}
