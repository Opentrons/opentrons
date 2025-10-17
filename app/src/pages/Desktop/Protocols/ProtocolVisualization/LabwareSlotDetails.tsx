import { useTranslation } from 'react-i18next'

import {
  COLORS,
  LabwareRender,
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

import { ActiveWellSlotDetails } from './ActiveWellSlotDetails'
import styles from './preview.module.css'
import { getAllWellContentsAtFrame, getChannels } from './utils'

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
  const { t } = useTranslation('protocol_visualization')
  const { labware } = robotState
  const labwareLoadCommand = Object.values(commands).find(
    command =>
      'labwareId' in command.result &&
      command.result.labwareId === topLabwareOnSlotId
  )
  const pipetteTemporalProperties = Object.entries(robotState.pipettes).find(
    ([_, pipette]) => pipette.entityId === topLabwareOnSlotId
  )
  const slot = getSlotInLocationStack(labware[topLabwareOnSlotId].stack)

  const { params: labwareLoadCommandParams } = labwareLoadCommand ?? {}
  const labwareNickname =
    labwareLoadCommandParams != null &&
    'displayName' in labwareLoadCommandParams
      ? labwareLoadCommandParams.displayName
      : null
  const { params } = currentCommand
  const labwareDef = labwareEntities[topLabwareOnSlotId].def
  const labwareDisplayName = labwareDef.metadata.displayName

  const liquidDisplayColors = Object.fromEntries(
    liquids.map(liquid => [liquid.id, liquid.displayColor ?? COLORS.grey40])
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

  const labwareViewBox = getLabwareViewBox(labwareDef)

  return (
    <>
      {activeWellName != null ? (
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
      ) : null}
      <div className={styles.container}>
        <div className={styles.header}>
          <Tag text={t('labware')} type="default" shrinkToContent />
          <RobotInfoLabel deckLabel={slot} />
        </div>
        <div className={styles.subheader}>
          <StyledText desktopStyle="captionSemiBold">
            {labwareNickname != null ? labwareNickname : labwareDisplayName}
          </StyledText>
        </div>
        <div className={styles.main_content}>
          <RobotWorkSpace
            key={topLabwareOnSlotId}
            width="14rem"
            viewBox={`${labwareViewBox.minX} ${labwareViewBox.minY} ${labwareViewBox.xDimension} ${labwareViewBox.yDimension}`}
          >
            {() => (
              <g>
                <LabwareRender
                  definition={labwareDef}
                  positioningMode="passThrough"
                  wellFill={wellFill}
                  highlightedWells={wellGroup}
                />
              </g>
            )}
          </RobotWorkSpace>
        </div>
      </div>
    </>
  )
}
