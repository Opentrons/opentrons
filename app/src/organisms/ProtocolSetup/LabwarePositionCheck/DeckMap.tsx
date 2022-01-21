import * as React from 'react'
import map from 'lodash/map'
import {
  LabwareRender,
  Module,
  RobotWorkSpace,
  RobotCoordsForeignObject,
  C_SELECTED_DARK,
  Icon,
  COLOR_SUCCESS,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  C_WHITE,
} from '@opentrons/components'
import {
  THERMOCYCLER_MODULE_V1,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { useModuleRenderInfoById, useLabwareRenderInfoById } from '../hooks'
import styles from '../styles.css'

const DECK_MAP_VIEWBOX = '-80 -20 550 460'
const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

interface DeckMapProps {
  labwareIdsToHighlight?: string[]
  completedLabwareIds?: string[]
}

export const DeckMap = (props: DeckMapProps): JSX.Element | null => {
  const { labwareIdsToHighlight, completedLabwareIds } = props
  const moduleRenderInfoById = useModuleRenderInfoById()
  const labwareRenderInfoById = useLabwareRenderInfoById()

  return (
    <RobotWorkSpace
      deckDef={standardDeckDef as any}
      viewBox={DECK_MAP_VIEWBOX}
      className={styles.deck_map}
      deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
      id={'LabwarePositionCheck_deckMap'}
    >
      {() => (
        <>
          {map(
            moduleRenderInfoById,
            ({ x, y, moduleDef, nestedLabwareDef, nestedLabwareId }) => (
              <Module
                key={`LabwarePositionCheck_Module_${moduleDef.model}_${x}${y}`}
                x={x}
                y={y}
                orientation={inferModuleOrientationFromXCoordinate(x)}
                def={moduleDef}
                innerProps={
                  moduleDef.model === THERMOCYCLER_MODULE_V1
                    ? { lidMotorState: 'open' }
                    : {}
                }
              >
                {nestedLabwareDef != null ? (
                  <>
                    <LabwareRender definition={nestedLabwareDef} />
                    {nestedLabwareId != null &&
                    labwareIdsToHighlight?.includes(nestedLabwareId) ? (
                      <rect
                        width={nestedLabwareDef.dimensions.xDimension - 2}
                        height={nestedLabwareDef.dimensions.yDimension - 2}
                        fill={'none'}
                        stroke={C_SELECTED_DARK}
                        strokeWidth={'3px'}
                        data-testid={`DeckMap_module_${nestedLabwareId}_highlight`}
                      />
                    ) : null}
                    {nestedLabwareId != null &&
                    completedLabwareIds?.includes(nestedLabwareId) ? (
                      <RobotCoordsCenteredCheck
                        x={x}
                        y={y}
                        boundingXDimension={
                          nestedLabwareDef.dimensions.xDimension
                        }
                        boundingYDimension={
                          nestedLabwareDef.dimensions.yDimension
                        }
                        data-testid={`DeckMap_${nestedLabwareId}_checkmark`}
                      />
                    ) : null}
                  </>
                ) : null}
              </Module>
            )
          )}
          {map(labwareRenderInfoById, ({ x, y, labwareDef }, labwareId) => (
            <g transform={`translate(${x},${y})`}>
              <LabwareRender definition={labwareDef} />
              {labwareIdsToHighlight?.includes(labwareId) === true && (
                <rect
                  width={labwareDef.dimensions.xDimension - 2}
                  height={labwareDef.dimensions.yDimension - 2}
                  fill={'none'}
                  stroke={C_SELECTED_DARK}
                  strokeWidth={'3px'}
                  data-testid={`DeckMap_${labwareId}_highlight`}
                />
              )}
              {completedLabwareIds?.includes(labwareId) ? (
                <RobotCoordsCenteredCheck
                  x={0}
                  y={0}
                  boundingXDimension={labwareDef.dimensions.xDimension}
                  boundingYDimension={labwareDef.dimensions.yDimension}
                  data-testid={`DeckMap_${labwareId}_checkmark`}
                />
              ) : null}
            </g>
          ))}
        </>
      )}
    </RobotWorkSpace>
  )
}

interface RobotCoordsCenteredCheckProps
  extends Omit<
    React.ComponentProps<typeof RobotCoordsForeignObject>,
    'width' | 'height'
  > {
  x: number
  y: number
  boundingXDimension: number
  boundingYDimension: number
}
function RobotCoordsCenteredCheck(props: RobotCoordsCenteredCheckProps): JSX.Element {
  const {
    x,
    y,
    boundingXDimension,
    boundingYDimension,
    ...wrapperProps
  } = props
  return (
    <RobotCoordsForeignObject
      {...wrapperProps}
      x={x}
      y={y}
      width={boundingXDimension}
      height={boundingYDimension}
      foreignObjectProps={{
        alignItems: ALIGN_CENTER,
        justifyContent: JUSTIFY_CENTER,
      }}
    >
      <Icon name="check-circle" color={COLOR_SUCCESS} width="2rem">
        <path
          fill={C_WHITE}
          d="M9.6,18 L3.6,12 L5.292,10.296 L9.6,14.604 L18.708,5.496 L20.4,7.2 L9.6,18 Z"
        />
      </Icon>
    </RobotCoordsForeignObject>
  )
}
