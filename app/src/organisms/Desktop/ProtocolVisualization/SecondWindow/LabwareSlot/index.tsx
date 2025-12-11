import {
  COLORS,
  LabwareRender,
  MODULE_ICON_NAME_BY_TYPE,
  RobotInfoLabel,
  RobotWorkSpace,
  StyledText,
} from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  wellFillFromWellContents,
} from '@opentrons/step-generation'

import { getAllWellContentsAtFrame } from '../../utils/getAllWellContentsAtFrame'
import { WellContainer } from '../../WellContainer'
import { WellTooltip } from '../../WellTooltip'
import styles from './labwareslot.module.css'

import type { WellGroup } from '@opentrons/components'
import type { Liquid, RunTimeCommand } from '@opentrons/shared-data'
import type {
  LabwareEntities,
  ModuleEntities,
  PipetteEntities,
  RobotState,
} from '@opentrons/step-generation'

interface LabwareSlotContainerProps {
  topLabwareOnSlotId: string
  labwareEntities: LabwareEntities
  commands: RunTimeCommand[]
  liquids: Liquid[]
  currentCommand: RunTimeCommand
  robotState: RobotState
  pipetteEntities: PipetteEntities
  moduleEntities: ModuleEntities
}
export function LabwareSlot(props: LabwareSlotContainerProps): JSX.Element {
  const {
    commands,
    liquids,
    topLabwareOnSlotId,
    labwareEntities,
    currentCommand,
    robotState,
    pipetteEntities,
    moduleEntities,
  } = props
  const { labware, pipettes, liquidState } = robotState
  const labwareLoadCommand = Object.values(commands).find(
    command =>
      'labwareId' in command.result &&
      command.result.labwareId === topLabwareOnSlotId
  )
  const pipetteTemporalProperties = Object.entries(pipettes).find(
    ([_, pipette]) => pipette.entityId === topLabwareOnSlotId
  )
  const slot = getSlotInLocationStack(labware[topLabwareOnSlotId].stack)

  const { params: labwareLoadCommandParams } = labwareLoadCommand ?? {}
  const labwareNickname: string | null =
    labwareLoadCommandParams != null &&
    'displayName' in labwareLoadCommandParams
      ? labwareLoadCommandParams.displayName
      : null
  const { params } = currentCommand
  const labwareDef = labwareEntities[topLabwareOnSlotId].def
  const labwareDisplayName = labwareDef.metadata.displayName

  const liquidDisplayColors = Object.fromEntries(
    liquids.map(({ id, displayColor }) => [id, displayColor ?? COLORS.grey40])
  )
  const allWellContentsForActiveItem = getAllWellContentsAtFrame(
    liquidState,
    labwareDef
  )
  const wellContents =
    allWellContentsForActiveItem != null
      ? allWellContentsForActiveItem[topLabwareOnSlotId]
      : null

  const wellFill = wellFillFromWellContents(wellContents, liquidDisplayColors)
  const activeWellName =
    pipetteTemporalProperties != null
      ? pipetteTemporalProperties[1].wellName
      : null
  const wellGroup: WellGroup | null =
    activeWellName != null
      ? {
          [activeWellName]: null,
        }
      : null
  const { wells } = labwareDef

  const pipetteLocationLiquidState =
    pipetteTemporalProperties != null
      ? liquidState.pipettes[pipetteTemporalProperties[0]]?.[0]
      : null
  const labwareLocationLiquidState =
    activeWellName != null
      ? liquidState.labware[topLabwareOnSlotId]?.[activeWellName]
      : null

  const tipMaxVolume =
    pipetteTemporalProperties != null
      ? pipetteEntities[pipetteTemporalProperties[0]].spec.liquids.default
          .maxVolume
      : 0

  const labwareViewBox = getLabwareViewBox(labwareDef)
  const ingredNames = liquids.reduce(
    (acc: Record<string, string>, { id, displayName }) => {
      acc[id] = displayName
      return acc
    },
    {}
  )

  return (
    <>
      {activeWellName != null ? (
        <WellContainer
          wells={wells}
          params={params}
          activeWellName={activeWellName}
          wellColor={wellFill[activeWellName]}
          labwareLocationLiquidState={labwareLocationLiquidState}
          pipetteLocationLiquidState={pipetteLocationLiquidState}
          liquids={liquids}
          tipMaxVolume={tipMaxVolume}
        />
      ) : null}
      <div className={styles.container}>
        <div className={styles.header}>
          {/* header icon part */}
          <div>
            {labware[topLabwareOnSlotId]?.stack
              .filter(item => item !== topLabwareOnSlotId)
              .reverse()
              .map(item => {
                if (moduleEntities[item] != null) {
                  return (
                    <RobotInfoLabel
                      key={item}
                      iconName={
                        MODULE_ICON_NAME_BY_TYPE[moduleEntities[item].type]
                      }
                    />
                  )
                } else if (labware[item] != null) {
                  return <RobotInfoLabel key={item} iconName="stacked" />
                } else {
                  return <RobotInfoLabel key={item} deckLabel={slot} />
                }
              })}
          </div>
          {/* header icon part */}

          {/* header text part */}
          <div className={styles.header_text}>
            {labwareNickname != null ? (
              <StyledText desktopStyle="captionSemiBold">
                {labwareNickname}
              </StyledText>
            ) : null}
            <StyledText desktopStyle="bodyDefaultRegular">
              {labwareDisplayName}
            </StyledText>
          </div>
          {/* header text part */}
        </div>
        <div className={styles.body_container}>
          <WellTooltip ingredNames={ingredNames}>
            {({ makeHandleMouseEnterWell, handleMouseLeaveWell }) => (
              <div className={styles.labware_render_container}>
                <RobotWorkSpace
                  key={topLabwareOnSlotId}
                  viewBox={`${labwareViewBox.minX} ${labwareViewBox.minY} ${labwareViewBox.xDimension} ${labwareViewBox.yDimension}`}
                >
                  {() => (
                    <g>
                      <LabwareRender
                        definition={labwareDef}
                        positioningMode="passThrough"
                        wellFill={wellFill}
                        highlightedWells={wellGroup}
                        onMouseLeaveWell={mouseEventArgs => {
                          handleMouseLeaveWell(mouseEventArgs)
                          handleMouseLeaveWell(mouseEventArgs.event)
                        }}
                        onMouseEnterWell={({ wellName, event }) => {
                          if (wellContents != null) {
                            makeHandleMouseEnterWell(
                              wellName,
                              wellContents[wellName]?.ingreds
                            )(event)
                          }
                        }}
                      />
                    </g>
                  )}
                </RobotWorkSpace>
              </div>
            )}
          </WellTooltip>
        </div>
      </div>
    </>
  )
}
