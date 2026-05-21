import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  LabwareRender,
  MODULE_ICON_NAME_BY_TYPE,
  RobotInfoLabel,
  RobotWorkSpace,
  StyledText,
  Tag,
} from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  wellFillFromWellContents,
} from '@opentrons/step-generation'

import { getAllWellContentsAtFrame } from '../utils/getAllWellContentsAtFrame'
import { WellContainer } from '../WellContainer'
import { WellTooltip } from '../WellTooltip'
import styles from './labwareslotcontainer.module.css'

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

// TODO: this is a temp fix in an interest of time
// but we should investigate why the dropTip and pickUpTip
// commands are showing the well container
const HIDE_WELL_CONTAINER_COMMAND_TYPES = [
  'comment',
  'waitForDuration',
  'waitForResume',
  'waitForTasks',
  'dropTip',
  'pickUpTip',
]

export function LabwareSlotContainer(
  props: LabwareSlotContainerProps
): JSX.Element {
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
  const { t } = useTranslation('protocol_visualization')
  const [hoveredWellName, setHoveredWellName] = useState<string | null>(null)
  const { labware, pipettes, liquidState } = robotState
  const labwareLoadCommand = commands.find(
    command =>
      command.result != null &&
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
  const { params, commandType } = currentCommand
  const commandWellName =
    'wellName' in params && typeof params.wellName === 'string'
      ? params.wellName
      : null
  const commandLabwareId =
    'labwareId' in params && typeof params.labwareId === 'string'
      ? params.labwareId
      : null
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
  const rawSelectedWellName =
    commandLabwareId === topLabwareOnSlotId && commandWellName != null
      ? commandWellName
      : activeWellName

  const selectedWellName =
    rawSelectedWellName != null && labwareDef.wells[rawSelectedWellName] != null
      ? rawSelectedWellName
      : null

  const shouldShowWellContainer =
    selectedWellName != null &&
    !HIDE_WELL_CONTAINER_COMMAND_TYPES.includes(commandType)
  const wellGroup: WellGroup | null =
    selectedWellName != null
      ? {
          [selectedWellName]: null,
        }
      : null
  const hoveredWellGroup: WellGroup | null =
    hoveredWellName != null
      ? {
          [hoveredWellName]: null,
        }
      : null
  const { wells } = labwareDef

  const pipetteLocationLiquidState =
    pipetteTemporalProperties != null
      ? liquidState.pipettes[pipetteTemporalProperties[0]]?.[0]
      : null
  const labwareLocationLiquidState =
    selectedWellName != null
      ? liquidState.labware[topLabwareOnSlotId]?.[selectedWellName]
      : null

  const tipMaxVolume =
    pipetteTemporalProperties != null
      ? pipetteEntities[pipetteTemporalProperties[0]].spec.liquids.default
          .maxVolume
      : 0

  const labwareViewBox = getLabwareViewBox(labwareDef)
  const ingredNames = liquids.reduce(
    (acc: Record<string, string>, { id, displayName }) => {
      const checkedDisplayName =
        typeof displayName === 'number'
          ? t('labware', { totalLiquids: displayName })
          : displayName
      acc[id] = checkedDisplayName
      return acc
    },
    {}
  )

  return (
    <>
      {shouldShowWellContainer ? (
        <WellContainer
          wells={wells}
          params={params}
          selectedWellName={selectedWellName}
          wellColor={wellFill[selectedWellName]}
          labwareLocationLiquidState={labwareLocationLiquidState}
          pipetteLocationLiquidState={pipetteLocationLiquidState}
          liquids={liquids}
          tipMaxVolume={tipMaxVolume}
        />
      ) : null}
      <div className={styles.container}>
        <div className={styles.header}>
          <Tag text={t('labware')} type="default" shrinkToContent />
          <div className={styles.info_label_container}>
            {labware[topLabwareOnSlotId]?.stack
              .filter(item => item !== topLabwareOnSlotId)
              .reverse()
              .map((item, index) => {
                if (moduleEntities[item] != null) {
                  return (
                    <RobotInfoLabel
                      key={`${item}-${index}`}
                      iconName={
                        MODULE_ICON_NAME_BY_TYPE[moduleEntities[item].type]
                      }
                    />
                  )
                } else if (labware[item] != null) {
                  return (
                    <RobotInfoLabel
                      key={`${item}-${index}`}
                      iconName="stacked"
                    />
                  )
                } else {
                  return (
                    <RobotInfoLabel key={`${item}-${index}`} deckLabel={slot} />
                  )
                }
              })}
          </div>
        </div>
        <div className={styles.subheader}>
          <StyledText desktopStyle="captionSemiBold">
            {labwareNickname ?? labwareDisplayName}
          </StyledText>
        </div>
        <div className={styles.main_content}>
          <WellTooltip
            ingredNames={ingredNames}
            liquidDisplayColors={liquidDisplayColors}
          >
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
                        highlightedWells={hoveredWellGroup}
                        selectedWells={wellGroup}
                        onMouseLeaveWell={mouseEventArgs => {
                          setHoveredWellName(null)
                          handleMouseLeaveWell(mouseEventArgs)
                          handleMouseLeaveWell(mouseEventArgs.event)
                        }}
                        onMouseEnterWell={({ wellName, event }) => {
                          setHoveredWellName(wellName)
                          if (wellContents != null) {
                            makeHandleMouseEnterWell(
                              wellName,
                              wellContents[wellName]?.ingreds ?? {}
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
