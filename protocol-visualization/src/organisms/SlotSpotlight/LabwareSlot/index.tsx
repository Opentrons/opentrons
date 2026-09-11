import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  LabwareRender,
  RobotCoordsForeignObject,
  RobotInfoLabel,
  RobotWorkSpace,
  StyledText,
} from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  HOPPER_STACKER_LOCATION,
  wellFillFromWellContents,
} from '@opentrons/step-generation'

import { getAllWellContentsAtFrame } from '../../utils/getAllWellContentsAtFrame'
import { WellTooltip } from '../../WellTooltip'
import styles from './labwareslot.module.css'

import type { ReactNode } from 'react'
import type { WellGroup } from '@opentrons/components'
import type {
  Liquid,
  LoadLidStackRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  LabwareEntities,
  RobotState,
} from '@opentrons/step-generation'

interface LabwareSlotContainerProps {
  topLabwareOnSlotId: string
  labwareEntities: LabwareEntities
  commands: RunTimeCommand[]
  liquids: Liquid[]
  robotState: RobotState
}
export function LabwareSlot(props: LabwareSlotContainerProps): ReactNode {
  const { topLabwareOnSlotId, labwareEntities, commands, liquids, robotState } =
    props
  const { labware, pipettes, liquidState, modules } = robotState
  const { t } = useTranslation('protocol_visualization')
  const [hoveredWellName, setHoveredWellName] = useState<string | null>(null)
  const lidStackCommand = commands.find(
    (command): command is LoadLidStackRunTimeCommand =>
      command.commandType === 'loadLidStack' &&
      command.result?.labwareIds?.includes(topLabwareOnSlotId) === true
  )
  const pipetteTemporalProperties = Object.entries(pipettes).find(
    ([_, pipette]) => pipette.entityId === topLabwareOnSlotId
  )
  const isOnHopper = labware[topLabwareOnSlotId].stack.includes(
    HOPPER_STACKER_LOCATION
  )
  const slot = getSlotInLocationStack(labware[topLabwareOnSlotId].stack)
  const matchingStacker = isOnHopper
    ? Object.values(modules).find(module => module.slot === slot)
    : null
  const stackerModuleState =
    matchingStacker != null
      ? (matchingStacker.moduleState as FlexStackerModuleState)
      : null
  const hopperGroups =
    stackerModuleState != null ? stackerModuleState.labwareInHopper : null
  const isTopLabwareLid =
    labwareEntities[topLabwareOnSlotId].def.allowedRoles?.includes('lid')
  const topLabwareStack = labware[topLabwareOnSlotId].stack
  const labwareIdUnderLid = topLabwareStack.find(
    id =>
      id !== topLabwareOnSlotId &&
      labware[id] != null &&
      labwareEntities[id]?.def.allowedRoles?.includes('lid') !== true
  )
  const hasRenderableWellsUnderLid =
    labwareIdUnderLid != null
      ? Object.keys(labwareEntities[labwareIdUnderLid].def.wells).length > 0
      : false
  const adjustedTopLabwareId =
    isTopLabwareLid && hasRenderableWellsUnderLid
      ? (labwareIdUnderLid ?? topLabwareOnSlotId)
      : topLabwareOnSlotId
  const labwareLoadCommand = Object.values(commands).find(
    command =>
      command.result != null &&
      'labwareId' in command.result &&
      (command.result.labwareId === topLabwareOnSlotId ||
        command.result.labwareId === adjustedTopLabwareId)
  )
  const { params: labwareLoadCommandParams } = labwareLoadCommand ?? {}
  const labwareNickname: string | null =
    labwareLoadCommandParams != null &&
    'displayName' in labwareLoadCommandParams
      ? labwareLoadCommandParams.displayName
      : null
  const labwareDef = labwareEntities[adjustedTopLabwareId].def
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
      ? allWellContentsForActiveItem[adjustedTopLabwareId]
      : null

  const wellFill = wellFillFromWellContents(wellContents, liquidDisplayColors)
  const activeWellName =
    pipetteTemporalProperties != null
      ? pipetteTemporalProperties[1].wellName
      : null
  const wellGroup: WellGroup | null =
    activeWellName != null && labwareDef.wells[activeWellName] != null
      ? {
          [activeWellName]: null,
        }
      : null
  const hoveredWellGroup: WellGroup | null =
    hoveredWellName != null && labwareDef.wells[hoveredWellName] != null
      ? {
          [hoveredWellName]: null,
        }
      : null

  const labwareViewBox = getLabwareViewBox(labwareDef)
  const ingredNames = liquids.reduce(
    (acc: Record<string, string | null>, { id, displayName }) => {
      acc[id] = displayName
      return acc
    },
    {}
  )
  const topLabwareURI = labwareEntities[topLabwareOnSlotId].labwareDefURI
  const stackQuantity = labware[topLabwareOnSlotId].stack.filter(
    id =>
      labware[id] != null && labwareEntities[id].labwareDefURI === topLabwareURI
  ).length
  let quantity = lidStackCommand?.params?.quantity ?? 1
  if (hopperGroups != null) {
    quantity = hopperGroups.length
  } else if (stackQuantity > 0) {
    quantity = stackQuantity
  }

  const showStackedBadge = quantity > 1
  // Match the pre-change visual size and the ANSI-plate corner inset from
  // x=235/y=155 (scale 0.5 → ~10mm from right, ~8mm from back). Anchor to
  // each labware's viewBox so shorter lids keep that same relative corner.
  const stackedBadgeScale = 0.5
  const stackedBadgeInsetXMm = 10
  const stackedBadgeInsetYMm = 8
  const stackedBadgeViewBoxPadMm = 12
  const stackedBadgeX =
    (labwareViewBox.maxX - stackedBadgeInsetXMm) / stackedBadgeScale
  const stackedBadgeY =
    (labwareViewBox.maxY - stackedBadgeInsetYMm) / stackedBadgeScale
  const viewBoxWidth =
    labwareViewBox.xDimension +
    (showStackedBadge ? stackedBadgeViewBoxPadMm : 0)
  const viewBoxHeight =
    labwareViewBox.yDimension +
    (showStackedBadge ? stackedBadgeViewBoxPadMm : 0)

  return (
    <div className={styles.container}>
      <div className={styles.labware_summary}>
        {labwareNickname != null && (
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {labwareNickname}
          </StyledText>
        )}
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {labwareDisplayName}
        </StyledText>
      </div>
      <div className={styles.body_container}>
        <WellTooltip
          ingredNames={ingredNames}
          liquidDisplayColors={liquidDisplayColors}
        >
          {({ makeHandleMouseEnterWell, handleMouseLeaveWell }) => (
            <div className={styles.labware_render_container}>
              <RobotWorkSpace
                key={topLabwareOnSlotId}
                viewBox={`${labwareViewBox.minX} ${labwareViewBox.minY} ${viewBoxWidth} ${viewBoxHeight}`}
              >
                {() => (
                  <>
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
                    {showStackedBadge ? (
                      <g transform={`scale(${stackedBadgeScale})`}>
                        <RobotCoordsForeignObject
                          width="1.5rem"
                          height="1.25rem"
                          x={stackedBadgeX}
                          y={stackedBadgeY}
                        >
                          <RobotInfoLabel
                            height="1rem"
                            svgSize="0.875rem"
                            highlight
                            iconName="stacked"
                          />
                        </RobotCoordsForeignObject>
                      </g>
                    ) : null}
                  </>
                )}
              </RobotWorkSpace>
              {showStackedBadge ? (
                <div className={styles.labware_text_align}>
                  <StyledText
                    desktopStyle="captionRegular"
                    color={COLORS.grey60}
                  >
                    {t('top_labware_in_stack')}
                  </StyledText>
                </div>
              ) : null}
            </div>
          )}
        </WellTooltip>
      </div>
    </div>
  )
}
