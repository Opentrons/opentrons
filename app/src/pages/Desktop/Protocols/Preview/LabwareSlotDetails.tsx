import {
  COLORS,
  Divider,
  LabwareRender,
  LiquidIcon,
  RobotWorkSpace,
  StyledText,
  Tag,
} from '@opentrons/components'
import { wellFillFromWellContents } from '@opentrons/step-generation'

import { ActiveWellSlotDetails } from './ActiveWellSlotDetails'
import styles from './preview.module.css'
import {
  getAllWellContentsAtFrame,
  getChannels,
  getLiquidDetailInfo,
  getMissingTips,
} from './utils'

import type { WellGroup } from '@opentrons/components'
import type { Liquid, RunTimeCommand } from '@opentrons/shared-data'
import type {
  LabwareEntities,
  PipetteEntities,
  RobotState,
} from '@opentrons/step-generation'

interface LabwareSlotDetailsProps {
  topLabwareOnSlotId: string
  labwareEntities: LabwareEntities
  commands: RunTimeCommand[]
  liquids: Liquid[]
  currentCommand: RunTimeCommand
  robotState: RobotState
  pipetteEntities: PipetteEntities
}
export function LabwareSlotDetails(
  props: LabwareSlotDetailsProps
): JSX.Element {
  const {
    commands,
    liquids,
    topLabwareOnSlotId,
    labwareEntities,
    currentCommand,
    robotState,
    pipetteEntities,
  } = props
  const labwareLoadCommand = Object.values(commands).find(
    command =>
      'labwareId' in command.result &&
      command.result.labwareId === topLabwareOnSlotId
  )
  // TODO: this only works for single channel, need to update for multi-channels
  // by getting all the wells the multi-channel is using
  const pipetteTemporalProperties = Object.entries(robotState.pipettes).find(
    ([id, pipette]) => pipette.entityId === topLabwareOnSlotId
  )

  const activeWellName =
    pipetteTemporalProperties != null
      ? pipetteTemporalProperties[1].wellName
      : null

  const channels =
    pipetteTemporalProperties != null
      ? getChannels(
          pipetteEntities[pipetteTemporalProperties[0]].spec.channels,
          pipetteTemporalProperties[1].nozzles
        )
      : 1
  const maxVolume =
    pipetteTemporalProperties != null
      ? pipetteEntities[pipetteTemporalProperties[0]].spec.liquids.default
          .maxVolume
      : 0

  const { params: labwareLoadCommandParams } = labwareLoadCommand ?? {}
  const labwareNickname =
    labwareLoadCommandParams != null &&
    'displayName' in labwareLoadCommandParams
      ? labwareLoadCommandParams.displayName
      : null
  const { params } = currentCommand
  const labwareDef = labwareEntities[topLabwareOnSlotId].def
  const liquidDisplayColors = liquids.map(
    liquid => liquid.displayColor ?? '0000000'
  )
  const allWellContentsForActiveItem = getAllWellContentsAtFrame(
    robotState.liquidState,
    labwareDef
  )
  const wellContents =
    allWellContentsForActiveItem != null
      ? allWellContentsForActiveItem[topLabwareOnSlotId]
      : null

  const wellFill = wellFillFromWellContents(wellContents, liquidDisplayColors)
  const labwareDisplayName = labwareDef.metadata.displayName
  const wellGroup: WellGroup | null =
    activeWellName != null
      ? {
          [activeWellName]: null,
        }
      : null
  const labwareDepth = labwareDef.wells.A1.depth ?? 0
  const labwareWellXWidth = labwareDef.wells.A1.x ?? 0
  const labwareWellMaxVolume = labwareDef.wells.A1.totalLiquidVolume
  const missingTips = getMissingTips(robotState.tipState, topLabwareOnSlotId)
  const liquidInfo = getLiquidDetailInfo(wellContents, liquids)
  const pipetteLocationLiquidState =
    pipetteTemporalProperties != null
      ? robotState.liquidState.pipettes[pipetteTemporalProperties[0]]?.[0]
      : null
  const labwareLocationLiquidState =
    activeWellName != null
      ? robotState.liquidState.labware[topLabwareOnSlotId]?.[activeWellName]
      : null
  const totalVolume =
    pipetteLocationLiquidState != null
      ? Object.values(pipetteLocationLiquidState).reduce(
          (sum, { volume }) => sum + volume,
          0
        )
      : 0

  const ingredIds =
    pipetteLocationLiquidState != null
      ? Object.keys(pipetteLocationLiquidState)
      : []
  const colorsInTip = liquids
    .filter(liquid => ingredIds.includes(liquid.id))
    ?.map(liquid => liquid.displayColor)

  //  TODO: remove air gap volume from here
  const totalVolumeInWell =
    labwareLocationLiquidState != null
      ? Object.values(labwareLocationLiquidState).reduce(
          (sum, { volume }) => sum + volume,
          0
        )
      : 0

  return (
    <>
      <div>
        <div className={styles.slot_details_active_step}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {labwareNickname != null ? labwareNickname : labwareDisplayName}
          </StyledText>
          {labwareNickname !== labwareDisplayName ? (
            <StyledText desktopStyle="bodyDefaultRegular">
              {labwareDisplayName}
            </StyledText>
          ) : null}
        </div>
        <div className={styles.labware_details_all_liquids_container}>
          <div className={styles.labware_details_all_liquids}>
            {liquidInfo.map((liquid, index) => {
              return (
                <div
                  key={`${liquid.displayName}_liquid_${index}`}
                  className={styles.labware_details_liquid_info_container}
                >
                  <div className={styles.labware_details_liquid_info}>
                    <LiquidIcon color={liquid.color} />
                    <StyledText desktopStyle="captionRegular">
                      {liquid.displayName}
                    </StyledText>
                  </div>
                  <Tag text={`${liquid.totalVolume} µL`} type="default" />
                </div>
              )
            })}
          </div>
          <div className={styles.labware_details_labware_display}>
            <RobotWorkSpace
              key={topLabwareOnSlotId}
              width="14rem"
              viewBox={`0 0 ${labwareDef.dimensions.xDimension} ${labwareDef.dimensions.yDimension}`}
            >
              {() => (
                <g>
                  <LabwareRender
                    definition={labwareDef}
                    wellFill={wellFill}
                    missingTips={missingTips}
                    highlightedWells={wellGroup}
                  />
                </g>
              )}
            </RobotWorkSpace>
          </div>
        </div>
      </div>
      <Divider />
      {activeWellName != null ? (
        channels === 1 ? (
          <ActiveWellSlotDetails
            labwareDepth={labwareDepth}
            params={params}
            activeWellName={activeWellName}
            xLabwareWellWidth={labwareWellXWidth}
            maxVolume={maxVolume}
            color={wellFill[activeWellName]}
            currentVolume={totalVolume ?? 0}
            totalVolumeInWell={totalVolumeInWell}
            labwareWellMaxVolume={labwareWellMaxVolume}
            tipColor={
              colorsInTip.length > 1
                ? COLORS.grey40
                : colorsInTip[0] ?? COLORS.grey40
            }
          />
        ) : (
          <div>TODO: support multi-channel</div>
        )
      ) : null}
    </>
  )
}
