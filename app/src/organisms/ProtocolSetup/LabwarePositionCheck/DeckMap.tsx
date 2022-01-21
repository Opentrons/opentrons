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
  DISPLAY_FLEX,
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

const flexProps = {
  display: DISPLAY_FLEX,
  alignItems: ALIGN_CENTER,
  justifyContent: JUSTIFY_CENTER,
  flex: '1 1 100%',
}
interface DeckMapProps {
  labwareIdsToHighlight?: string[]
  completedLabwareIdSections?: string[]
}

export const DeckMap = (props: DeckMapProps): JSX.Element | null => {
  const { labwareIdsToHighlight, completedLabwareIdSections } = props
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
      {() => {
        return (
          <React.Fragment>
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
                    <React.Fragment
                      key={`LabwarePositionCheck_Labware_${nestedLabwareDef.metadata.displayName}_${x}${y}`}
                    >
                      <g>
                        <LabwareRender definition={nestedLabwareDef} />
                        {nestedLabwareId != null &&
                          labwareIdsToHighlight?.includes(nestedLabwareId) ===
                            true && (
                            <rect
                              width={nestedLabwareDef.dimensions.xDimension - 2}
                              height={
                                nestedLabwareDef.dimensions.yDimension - 2
                              }
                              fill={'none'}
                              stroke={C_SELECTED_DARK}
                              strokeWidth={'3px'}
                              data-testid={`DeckMap_module_${nestedLabwareId}_highlight`}
                            />
                          )}{' '}
                      </g>
                      {nestedLabwareId != null &&
                        completedLabwareIdSections?.includes(
                          nestedLabwareId
                        ) === true && (
                          <>
                            <RobotCoordsForeignObject
                              x={x}
                              y={y}
                              height="100%"
                              width="100%"
                              flexProps={flexProps}
                              foreignObjectProps={{
                                width: nestedLabwareDef.dimensions.xDimension,
                                height: nestedLabwareDef.dimensions.yDimension,
                              }}
                            >
                              <svg height="36" width="36">
                                <circle
                                  cx="50%"
                                  cy="50%"
                                  r={16}
                                  fill={C_WHITE}
                                  data-testid={`DeckMap_${nestedLabwareId}_whiteBackground`}
                                />
                              </svg>
                            </RobotCoordsForeignObject>
                            <RobotCoordsForeignObject
                              x={x}
                              y={y}
                              height="100%"
                              width="100%"
                              flexProps={flexProps}
                              foreignObjectProps={{
                                width: nestedLabwareDef.dimensions.xDimension,
                                height: nestedLabwareDef.dimensions.yDimension,
                              }}
                            >
                              <Icon
                                name="check-circle"
                                color={COLOR_SUCCESS}
                                data-testid={`DeckMap_${nestedLabwareId}_checkmark`}
                                width="2rem"
                              />
                            </RobotCoordsForeignObject>
                          </>
                        )}
                    </React.Fragment>
                  ) : null}
                </Module>
              )
            )}

            {map(labwareRenderInfoById, ({ x, y, labwareDef }, labwareId) => {
              return (
                <React.Fragment
                  key={`LabwarePositionCheck_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
                >
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
                  </g>
                  {completedLabwareIdSections?.includes(labwareId) === true && (
                    <>
                      <RobotCoordsForeignObject
                        x={x}
                        y={y}
                        height="100%"
                        width="100%"
                        flexProps={flexProps}
                        foreignObjectProps={{
                          width: labwareDef.dimensions.xDimension,
                          height: labwareDef.dimensions.yDimension,
                        }}
                      >
                        <svg height="36" width="36">
                          <circle
                            cx="50%"
                            cy="50%"
                            r={16}
                            fill={C_WHITE}
                            data-testid={`DeckMap_${labwareId}_whiteBackground`}
                          />
                        </svg>
                      </RobotCoordsForeignObject>
                      <RobotCoordsForeignObject
                        x={x}
                        y={y}
                        height="100%"
                        width="100%"
                        flexProps={flexProps}
                        foreignObjectProps={{
                          width: labwareDef.dimensions.xDimension,
                          height: labwareDef.dimensions.yDimension,
                        }}
                      >
                        <Icon
                          name="check-circle"
                          color={COLOR_SUCCESS}
                          data-testid={`DeckMap_${labwareId}_checkmark`}
                          width="2rem"
                        />
                      </RobotCoordsForeignObject>
                    </>
                  )}
                </React.Fragment>
              )
            })}
          </React.Fragment>
        )
      }}
    </RobotWorkSpace>
  )
}
