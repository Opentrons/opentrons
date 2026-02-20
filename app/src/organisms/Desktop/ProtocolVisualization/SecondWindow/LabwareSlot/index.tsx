import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  Divider,
  LabwareRender,
  MODULE_ICON_NAME_BY_TYPE,
  RobotCoordsForeignObject,
  RobotInfoLabel,
  RobotWorkSpace,
  StyledText,
  Tag,
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

import type { WellGroup } from '@opentrons/components'
import type {
  Liquid,
  LoadLidStackRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  LabwareEntities,
  ModuleEntities,
  RobotState,
} from '@opentrons/step-generation'

interface LabwareSlotContainerProps {
  topLabwareOnSlotId: string
  labwareEntities: LabwareEntities
  commands: RunTimeCommand[]
  liquids: Liquid[]
  robotState: RobotState
  moduleEntities: ModuleEntities
}
export function LabwareSlot(props: LabwareSlotContainerProps): JSX.Element {
  const {
    topLabwareOnSlotId,
    labwareEntities,
    commands,
    liquids,
    robotState,
    moduleEntities,
  } = props
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
  const quantity =
    hopperGroups != null
      ? hopperGroups.length
      : stackQuantity > 0
        ? stackQuantity
        : (lidStackCommand?.params?.quantity ?? 1)
  const adapterId = labware[topLabwareOnSlotId].stack.find(
    id =>
      labwareEntities[id]?.def.allowedRoles?.includes('adapter') &&
      !labwareEntities[topLabwareOnSlotId].def.allowedRoles?.includes('adapter')
  )
  const stackItems =
    labware[topLabwareOnSlotId]?.stack.filter(
      item => item !== topLabwareOnSlotId
    ) ?? []
  const moduleStackItems = stackItems.filter(
    item => moduleEntities[item] != null
  )
  const hasStackedLabware = stackItems.some(item => labware[item] != null)
  const hasHopper = stackItems.includes(HOPPER_STACKER_LOCATION)
  const showStackedIcon =
    hasStackedLabware || (hopperGroups != null && hopperGroups.length > 1)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* header icon part */}
        <div className={styles.header_icons}>
          <RobotInfoLabel
            key="slotLabel"
            deckLabel={hasHopper ? t('stacker_slot', { slot: slot }) : slot}
          />
          {moduleStackItems.map((item, index) => (
            <RobotInfoLabel
              key={`${item}-${index}`}
              iconName={MODULE_ICON_NAME_BY_TYPE[moduleEntities[item].type]}
            />
          ))}
          {showStackedIcon ? (
            <RobotInfoLabel key="stackedIcon" iconName="stacked" />
          ) : null}
        </div>
        {/* header icon part */}

        {/* header text part */}
        <div className={styles.header_container}>
          <div className={styles.header_text}>
            {labwareNickname != null ? (
              <StyledText desktopStyle="captionSemiBold">
                {labwareNickname}
              </StyledText>
            ) : null}
            <StyledText desktopStyle="bodyDefaultRegular">
              {labwareDisplayName}
            </StyledText>
            {isTopLabwareLid ? (
              <StyledText desktopStyle="captionSemiBold">
                {`With ${labwareEntities[topLabwareOnSlotId].def.metadata.displayName}`}
              </StyledText>
            ) : null}
          </div>
          {quantity > 1 ? (
            <div className={styles.tag_container}>
              <Tag text={t('quantity', { quantity })} type="default" />
            </div>
          ) : null}
        </div>
        {adapterId != null ? (
          <>
            <Divider className={styles.full_width_divider} />
            <StyledText desktopStyle="captionSemiBold">
              {labwareEntities[adapterId].def.metadata.displayName}
            </StyledText>
          </>
        ) : null}
        {/* header text part */}
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
                viewBox={`${labwareViewBox.minX} ${labwareViewBox.minY} ${labwareViewBox.xDimension + (quantity > 1 ? 10 : 0)} ${labwareViewBox.yDimension + (quantity > 1 ? 5 : 0)}`}
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
                    {quantity > 1 ? (
                      <>
                        <g transform="scale(0.5)">
                          <RobotCoordsForeignObject
                            width="1.5rem"
                            height="1.25rem"
                            x={235}
                            y={155}
                          >
                            <RobotInfoLabel
                              height="1rem"
                              svgSize="0.875rem"
                              highlight
                              iconName="stacked"
                            />
                          </RobotCoordsForeignObject>
                        </g>
                      </>
                    ) : null}
                  </>
                )}
              </RobotWorkSpace>
              {quantity > 1 ? (
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
