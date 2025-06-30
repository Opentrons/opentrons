import {
  COLORS,
  Divider,
  LabwareRender,
  LiquidIcon,
  RobotWorkSpace,
  StyledText,
} from '@opentrons/components'

import { getWellFillFromLabwareId } from '/app/transformations/analysis'
import { getLabwareInfoByLiquidId } from '/app/transformations/commands'

import styles from './preview.module.css'
import { getLiquidDetailInfo, getMissingTips } from './utils'

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
  const labwareByLiquidId = getLabwareInfoByLiquidId(commands)
  const labwareDef = labwareEntities[topLabwareOnSlotId].def
  //  TODO: need to use wellFillFromWellContents in protocol-designer
  //  so that it update with liquid state and not based off of starting
  //  liquids
  const wellFill = getWellFillFromLabwareId(
    topLabwareOnSlotId,
    liquids,
    labwareByLiquidId
  )
  const labwareDisplayName =
    labwareEntities[topLabwareOnSlotId].def.metadata.displayName
  const wellGroup: WellGroup | null =
    activeWellName != null
      ? {
          [activeWellName]: null,
        }
      : null

  const missingTips = getMissingTips(robotState.tipState, topLabwareOnSlotId)
  const liquidInfo = getLiquidDetailInfo(
    robotState.liquidState,
    labwareDef,
    topLabwareOnSlotId,
    liquids
  )

  return (
    <>
      <div>
        <div className={styles.slotDetailsActiveStep}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {labwareNickname != null ? labwareNickname : labwareDisplayName}
          </StyledText>
          {labwareNickname !== labwareDisplayName ? (
            <StyledText desktopStyle="bodyDefaultRegular">
              {labwareDisplayName}
            </StyledText>
          ) : null}
        </div>
        <div style={{ padding: '0 16px 16px 16px' }}>
          {liquidInfo.map(liquid => {
            return (
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-betweem',
                }}
              >
                <LiquidIcon color={liquid.color} />
                <StyledText desktopStyle="captionRegular">{`${liquid.totalVolume}uL`}</StyledText>
                <StyledText desktopStyle="captionRegular">
                  {liquid.displayName}
                </StyledText>
              </div>
            )
          })}
          <div
            style={{
              justifyContent: 'center',
              display: 'flex',
              backgroundColor: COLORS.grey20,
              padding: '16px',
              borderRadius: '4px',
            }}
          >
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
          <div className={styles.slotDetailsActiveStep}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {`Well ${activeWellName}`}
            </StyledText>
          </div>
          <div style={{ padding: '0 16px 16px 16px' }}>
            <div
              style={{
                justifyContent: 'center',
                display: 'flex',
                backgroundColor: COLORS.grey20,
                padding: '16px',
                borderRadius: '4px',
                flexDirection: 'column',
              }}
            >
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
