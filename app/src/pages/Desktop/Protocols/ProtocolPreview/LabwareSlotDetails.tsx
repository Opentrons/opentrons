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
  const pipetteTemporalProperties = Object.entries(robotState.pipettes).find(
    ([_, pipette]) => pipette.entityId === topLabwareOnSlotId
  )

  const { params: labwareLoadCommandParams } = labwareLoadCommand ?? {}
  const labwareNickname =
    labwareLoadCommandParams != null &&
    'displayName' in labwareLoadCommandParams
      ? labwareLoadCommandParams.displayName
      : null
  const { params } = currentCommand
  const labwareDef = labwareEntities[topLabwareOnSlotId].def
  const labwareDisplayName = labwareDef.metadata.displayName

  const liquidDisplayColors = liquids.map(
    liquid => liquid.displayColor ?? COLORS.grey40
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

  const tipMaxVolume =
    pipetteTemporalProperties != null
      ? pipetteEntities[pipetteTemporalProperties[0]].spec.liquids.default
          .maxVolume
      : 0

  const channels =
    pipetteTemporalProperties != null
      ? getChannels(
          pipetteEntities[pipetteTemporalProperties[0]].spec.channels,
          pipetteTemporalProperties[1].nozzles
        )
      : 1
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
                    positioningMode="offsetInSlot"
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
            wells={wells}
            params={params}
            activeWellName={activeWellName}
            wellColor={wellFill[activeWellName]}
            labwareLocationLiquidState={labwareLocationLiquidState}
            pipetteLocationLiquidState={pipetteLocationLiquidState}
            liquids={liquids}
            tipMaxVolume={tipMaxVolume}
          />
        ) : (
          <div>TODO: support multi-channel</div>
        )
      ) : null}
    </>
  )
}
