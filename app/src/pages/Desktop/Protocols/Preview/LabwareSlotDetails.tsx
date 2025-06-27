import {
  COLORS,
  Divider,
  LabwareRender,
  RobotWorkSpace,
  StyledText,
} from '@opentrons/components'
import { Liquid, RunTimeCommand } from '@opentrons/shared-data'
import { LabwareEntities } from '@opentrons/step-generation'

import { getWellFillFromLabwareId } from '/app/transformations/analysis'
import { getLabwareInfoByLiquidId } from '/app/transformations/commands'

import styles from './preview.module.css'

interface LabwareSlotDetailsProps {
  topLabwareOnSlotId: string
  labwareEntities: LabwareEntities
  commands: RunTimeCommand[]
  liquids: Liquid[]
  currentCommand: RunTimeCommand
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
  } = props
  const labwareNickname = Object.values(commands).find(
    command =>
      command.commandType === 'loadLabware' &&
      'labwareId' in command.params &&
      command.params.labwareId === topLabwareOnSlotId
  )?.params.displayName

  const labwareByLiquidId = getLabwareInfoByLiquidId(commands)

  const wellFill = getWellFillFromLabwareId(
    topLabwareOnSlotId,
    liquids,
    labwareByLiquidId
  )

  const labwareDisplayName =
    labwareEntities[topLabwareOnSlotId].def.metadata.displayName

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
              viewBox={`0 0 ${labwareEntities[topLabwareOnSlotId].def.dimensions.xDimension} ${labwareEntities[topMostLabwareOnSlot].def.dimensions.yDimension}`}
            >
              {() => (
                <g>
                  <LabwareRender
                    definition={labwareEntities[topLabwareOnSlotId].def}
                    wellFill={wellFill}
                    // highlightedWells={}
                  />
                </g>
              )}
            </RobotWorkSpace>
          </div>
        </div>
      </div>
      <Divider />
    </>
  )
}
