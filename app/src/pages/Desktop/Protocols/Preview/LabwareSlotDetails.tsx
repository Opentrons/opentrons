import {
  Divider,
  LabwareRender,
  LiquidIcon,
  RobotWorkSpace,
  StyledText,
  Tag,
} from '@opentrons/components'
import { wellFillFromWellContents } from '@opentrons/step-generation'

import styles from './preview.module.css'
import {
  getAllWellContentsAtFrame,
  getLiquidDetailInfo,
  getMissingTips,
} from './utils'

import type { WellGroup } from '@opentrons/components'
import type { Liquid, RunTimeCommand } from '@opentrons/shared-data'
import type { LabwareEntities, RobotState } from '@opentrons/step-generation'

interface LabwareSlotDetailsProps {
  topLabwareOnSlotId: string
  labwareEntities: LabwareEntities
  commands: RunTimeCommand[]
  liquids: Liquid[]
  currentCommand: RunTimeCommand
  robotState: RobotState
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
  } = props
  const labwareLoadCommand = Object.values(commands).find(
    command =>
      'labwareId' in command.result &&
      command.result.labwareId === topLabwareOnSlotId
  )
  // TODO: this only works for single channel, need to update for multi-channels
  // by getting all the wells the multi-channel is using
  const activeWellName = Object.values(robotState.pipettes).find(
    pipette => pipette.entityId === topLabwareOnSlotId
  )?.wellName

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
  const labwareDisplayName =
    labwareEntities[topLabwareOnSlotId].def.metadata.displayName
  const wellGroup: WellGroup | null =
    activeWellName != null
      ? {
          [activeWellName]: null,
        }
      : null

  const missingTips = getMissingTips(robotState.tipState, topLabwareOnSlotId)
  const liquidInfo = getLiquidDetailInfo(wellContents, liquids)

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
        <>
          <div className={styles.slot_details_active_step}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {`Well ${activeWellName}`}
            </StyledText>
          </div>
          <div className={styles.labware_details_padding}>
            <div className={styles.labware_details_container}>
              <div> {currentCommand.commandType}</div>
              <div> {'speed' in params ? `speed: ${params.speed}` : null}</div>
              <div>
                {'flowRate' in params ? `flow rate: ${params.flowRate}` : null}
              </div>
              <div>
                {'wellLocation' in params
                  ? `well location: ${params.wellLocation.origin}, x: ${params.wellLocation.x}, y: ${params.wellLocation.x}, z: ${params.wellLocation.x}`
                  : null}
              </div>
              <div>
                {'volume' in params ? `volume: ${params.volume}` : null}
              </div>
            </div>
          </div>
          <Divider />
        </>
      ) : null}
    </>
  )
}
