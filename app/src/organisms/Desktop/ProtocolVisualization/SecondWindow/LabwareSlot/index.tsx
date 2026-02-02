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
import type { Liquid, RunTimeCommand } from '@opentrons/shared-data'
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
  const labwareLoadCommand = Object.values(commands).find(
    command =>
      'labwareId' in command.result &&
      command.result.labwareId === topLabwareOnSlotId
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

  const { params: labwareLoadCommandParams } = labwareLoadCommand ?? {}
  const labwareNickname: string | null =
    labwareLoadCommandParams != null &&
      'displayName' in labwareLoadCommandParams
      ? labwareLoadCommandParams.displayName
      : null
  const isTopLabwareLid =
    labwareEntities[topLabwareOnSlotId].def.allowedRoles?.includes('lid')
  const adjustedTopLabwareId = isTopLabwareLid
    ? labware[topLabwareOnSlotId].stack[1]
    : topLabwareOnSlotId
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
    activeWellName != null
      ? {
        [activeWellName]: null,
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
  const quantity =
    hopperGroups != null
      ? hopperGroups.length
      : labware[topLabwareOnSlotId].stack.filter(
        id =>
          labware[id] != null &&
          labwareEntities[id].labwareDefURI === topLabwareURI
      )?.length
  const adapterId = labware[topLabwareOnSlotId].stack.find(
    id =>
      labwareEntities[id]?.def.allowedRoles?.includes('adapter') &&
      !labwareEntities[topLabwareOnSlotId].def.allowedRoles?.includes('adapter')
  )
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {/* header icon part */}
        <div className={styles.header_icons}>
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
                  <RobotInfoLabel key={`${item}-${index}`} iconName="stacked" />
                )
              } else {
                if (item !== HOPPER_STACKER_LOCATION) {
                  const stack = labware[topLabwareOnSlotId]?.stack
                  const hasHopper = stack.includes(HOPPER_STACKER_LOCATION)
                  return (
                    <RobotInfoLabel
                      key={`${item}-${index}`}
                      deckLabel={
                        hasHopper ? t('stacker_slot', { slot: slot }) : slot
                      }
                    />
                  )
                }
              }
            })}
          {hopperGroups != null && hopperGroups.length > 1 ? (
            <RobotInfoLabel key="hopperGroupStackedIcon" iconName="stacked" />
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
            {adapterId != null ? (
              <div>
                <Divider />
                <StyledText desktopStyle="captionSemiBold">
                  {labwareEntities[adapterId].def.metadata.displayName}
                </StyledText>
              </div>
            ) : null}
          </div>
          {quantity > 1 ? (
            <Tag text={t('quantity', { quantity })} type="default" />
          ) : null}
        </div>
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
                        highlightedWells={wellGroup}
                        onMouseLeaveWell={mouseEventArgs => {
                          handleMouseLeaveWell(mouseEventArgs)
                          handleMouseLeaveWell(mouseEventArgs.event)
                        }}
                        onMouseEnterWell={({ wellName, event }) => {
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
