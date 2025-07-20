import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getSchema2CornerOffsetFromSlot,
  getSchema2Dimensions,
  opentrons1Trash3200MlFixedV1 as trashLabwareDef,
} from '@opentrons/shared-data'

import { PlaceholderStyledText } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { DeckLabelSet } from '../../organisms'
import styles from './deck.module.css'
import { RobotCoordsForeignObject } from './RobotCoordsForeignObject'

import type { RobotType } from '@opentrons/shared-data'
import type { DeckLabelProps } from '../../molecules'

// only allow edge cutout locations (columns 1 and 3)
export type TrashCutoutId =
  | 'cutoutA1'
  | 'cutoutB1'
  | 'cutoutC1'
  | 'cutoutD1'
  | 'cutoutA3'
  | 'cutoutB3'
  | 'cutoutC3'
  | 'cutoutD3'

const HEIGHT_OF_TAG = 28
interface FlexTrashProps {
  robotType: RobotType
  trashIconColor: string
  backgroundColor: string
  trashCutoutId?: TrashCutoutId
  /** optional prop to highlight the border of the trashBin */
  showHighlight?: boolean
  /** optional tag info to display a tag below the trash */
  tagInfo?: DeckLabelProps[]
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

/**
 * Component to render Opentrons Flex trash
 * For use as a RobotWorkspace child component
 */

export const FlexTrash = ({
  robotType,
  trashIconColor,
  backgroundColor,
  trashCutoutId,
  showHighlight,
  tagInfo,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: FlexTrashProps): JSX.Element | null => {
  // be sure we don't try to render for an OT-2
  if (robotType !== FLEX_ROBOT_TYPE) return null

  const deckDefinition = getDeckDefFromRobotType(robotType)

  const trashCutout = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === trashCutoutId
  )

  // retrieve slot x,y positions and dimensions from deck definition for the given trash cutout location
  const [x = 0, y = 0] = trashCutout?.position ?? []

  // a standard addressable area slot bounding box dimension
  const {
    xDimension: slotXDimension = 0,
    yDimension: slotYDimension = 0,
  } = deckDefinition.locations.addressableAreas[0].boundingBox

  // adjust for dimensions from trash definition
  const { x: xAdjustment, y: yAdjustment } = getSchema2CornerOffsetFromSlot(
    trashLabwareDef
  )
  const { xDimension, yDimension } = getSchema2Dimensions(trashLabwareDef)

  // rotate trash 180 degrees in column 1
  const rotateDegrees =
    trashCutoutId === 'cutoutA1' ||
    trashCutoutId === 'cutoutB1' ||
    trashCutoutId === 'cutoutC1' ||
    trashCutoutId === 'cutoutD1'
      ? '180'
      : '0'

  // rotate trash around x,y midpoint of standard slot bounding box
  const rotateXCoord = x + slotXDimension / 2
  const rotateYCoord = y + slotYDimension / 2

  return x != null && y != null && xDimension != null && yDimension != null ? (
    <g transform={`rotate(${rotateDegrees}, ${rotateXCoord}, ${rotateYCoord})`}>
      <RobotCoordsForeignObject
        width={xDimension}
        height={yDimension}
        x={x + xAdjustment}
        y={y + yAdjustment}
        flexProps={{
          flex: '1',
        }}
        flexEvents={{
          onClick: onClick,
          onMouseEnter: onMouseEnter,
          onMouseLeave: onMouseLeave,
        }}
        foreignObjectProps={{
          flex: '1',
          cursor: onClick != null ? 'pointer' : 'default',
        }}
      >
        <div
          className={styles.trash_container}
          style={{
            backgroundColor,
            border: showHighlight ? `3px solid ${COLORS.blue50}` : 'none',
          }}
        >
          {rotateDegrees === '180' ? (
            <div
              className={styles.trash_container_rotate_copy}
              style={{ transform: `rotate(${rotateDegrees}deg)` }}
            >
              <PlaceholderStyledText
                color={COLORS.white}
                desktopStyle="bodyDefaultSemiBold"
              >
                Trash bin
              </PlaceholderStyledText>
            </div>
          ) : null}
          <Icon
            name="trash"
            color={trashIconColor}
            height="2rem"
            // rotate icon back 180 degrees
            transform={`rotate(${rotateDegrees}deg)`}
            transformOrigin="center"
          />
          {rotateDegrees === '0' ? (
            <PlaceholderStyledText
              color={COLORS.white}
              desktopStyle="bodyDefaultSemiBold"
            >
              Trash bin
            </PlaceholderStyledText>
          ) : null}
        </div>
      </RobotCoordsForeignObject>
      {tagInfo != null && tagInfo.length > 0 ? (
        <DeckLabelSet
          width={xDimension}
          height={yDimension}
          x={x + xAdjustment}
          y={y + yAdjustment - HEIGHT_OF_TAG}
          deckLabels={tagInfo}
        />
      ) : null}
    </g>
  ) : null
}
