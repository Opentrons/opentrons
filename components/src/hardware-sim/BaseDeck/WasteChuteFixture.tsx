import clsx from 'clsx'

import { PlaceholderStyledText } from '../../atoms'
import {
  WASTE_CHUTE_HEIGHT,
  WASTE_CHUTE_WIDTH,
  WASTE_CHUTE_X,
  WASTE_CHUTE_Y,
} from '../../hardware-sim'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { DeckLabelSet } from '../../organisms'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import styles from './basedeck.module.css'

import type { ReactNode, SVGProps } from 'react'
import type {
  DeckDefinition,
  ModuleType,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import type { DeckLabelProps } from '../../molecules'

const TAG_HEIGHT = 28
interface WasteChuteFixtureProps extends SVGProps<SVGGElement> {
  cutoutId: typeof WASTE_CHUTE_CUTOUT
  deckDefinition: DeckDefinition
  moduleType?: ModuleType
  fixtureBaseColor?: SVGProps<SVGPathElement>['fill']
  wasteChuteColor?: string
  showExtensions?: boolean
  /** optional prop to highlight the border of the wasteChute */
  showHighlight?: boolean
  /** optional tag info to display a tag below the waste */
  tagInfo?: DeckLabelProps[]
}

export function WasteChuteFixture(
  props: WasteChuteFixtureProps
): JSX.Element | null {
  const {
    cutoutId,
    deckDefinition,
    fixtureBaseColor = COLORS.grey35,
    wasteChuteColor = COLORS.grey50,
    showHighlight,
    tagInfo,
    ...restProps
  } = props

  if (cutoutId !== 'cutoutD3') {
    console.warn(
      `cannot render WasteChuteFixture in given cutout location ${cutoutId}`
    )
    return null
  }

  const cutoutDef = deckDefinition?.locations.cutouts.find(
    s => s.id === cutoutId
  )
  if (cutoutDef == null) {
    console.warn(
      `cannot render WasteChuteFixture, no cutout named: ${cutoutDef} in deck def ${deckDefinition?.otId}`
    )
    return null
  }

  return (
    <g {...restProps}>
      <WasteChute
        backgroundColor={wasteChuteColor}
        wasteIconColor={fixtureBaseColor}
        showHighlight={showHighlight}
        tagInfo={tagInfo}
      />
    </g>
  )
}

interface WasteChuteProps {
  wasteIconColor: string
  backgroundColor: string
  showHighlight?: boolean
  tagInfo?: DeckLabelProps[]
  //  optional opacity and overlay to change the overlay container over the WasteChute container
  //  currently used in PD's BlockedSlot for drag/drop
  overlay?: JSX.Element
  opacity?: string
}

/**
 * a deck map foreign object representing the physical location of the waste chute connected to the deck
 */
export function WasteChute(props: WasteChuteProps): ReactNode {
  const {
    wasteIconColor,
    backgroundColor,
    showHighlight,
    tagInfo,
    overlay,
    opacity,
  } = props
  return (
    <>
      <RobotCoordsForeignObject
        width={WASTE_CHUTE_WIDTH}
        height={WASTE_CHUTE_HEIGHT}
        x={WASTE_CHUTE_X}
        y={-51}
        flexProps={{ flex: '1' }}
        foreignObjectProps={{ opacity: opacity ?? 1, flex: '1' }}
      >
        {overlay != null ? (
          overlay
        ) : (
          <div
            className={clsx(styles.waste_chute_fixture_container, {
              [styles.waste_chute_fixture_container_highlight]: showHighlight,
            })}
            style={{
              backgroundColor,
              color: wasteIconColor,
            }}
          >
            <Icon name="trash" color={wasteIconColor} height="2rem" />
            <div className={styles.waste_chute_copy_container}>
              <PlaceholderStyledText
                desktopStyle="bodyRegularSemiBold"
                color={COLORS.white}
              >
                Waste chute
              </PlaceholderStyledText>
            </div>
          </div>
        )}
      </RobotCoordsForeignObject>
      {tagInfo != null && tagInfo.length > 0 ? (
        <DeckLabelSet
          width={WASTE_CHUTE_WIDTH}
          height={WASTE_CHUTE_HEIGHT}
          x={WASTE_CHUTE_X}
          y={WASTE_CHUTE_Y - TAG_HEIGHT}
          deckLabels={tagInfo}
        />
      ) : null}
    </>
  )
}
