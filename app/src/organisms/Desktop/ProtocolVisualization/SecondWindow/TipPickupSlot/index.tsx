import { useTranslation } from 'react-i18next'

import {
  COLORS,
  LabwareRender,
  NO,
  RobotInfoLabel,
  RobotWorkSpace,
  StyledText,
  tipStateToTipType,
} from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { getMissingTips } from '../../utils/getMissingTips'
import styles from './tippickupslot.module.css'

import type { ReactNode } from 'react'
import type { TipType } from '@opentrons/components'
import type { RobotState } from '@opentrons/step-generation'
import type { LabwareEntityExtended } from '../../DeckView'

interface TipPickupSlotProps {
  tiprackEntity: LabwareEntityExtended
  robotState: RobotState
}

export function TipPickupSlot(props: TipPickupSlotProps): ReactNode {
  const { tiprackEntity, robotState } = props
  const { t } = useTranslation('protocol_visualization')
  const { id, def, nickName } = tiprackEntity
  const { tipState, labware } = robotState
  const tipStateInfo = tipState.tipracks[id]
  const tipStatusByWellName =
    tipStateInfo != null
      ? Object.entries(tipStateInfo).reduce<Record<string, TipType>>(
          (acc, [wellName, state]) => ({
            ...acc,
            [wellName]: tipStateToTipType[state],
          }),
          {}
        )
      : {}
  const labwareViewBox = getLabwareViewBox(def)
  const missingTips = getMissingTips(tipState, id)
  const slot = getSlotInLocationStack(labware[id].stack)
  const tipsRemaining = Object.values(tipStatusByWellName).filter(
    state => state !== NO
  ).length

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <RobotInfoLabel deckLabel={slot} />
        {nickName != null ? (
          <StyledText desktopStyle="bodyDefaultSemiBold">{nickName}</StyledText>
        ) : null}
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {def.metadata.displayName}
        </StyledText>
      </div>
      <div className={styles.main_content}>
        <RobotWorkSpace
          key={id}
          viewBox={`${labwareViewBox.minX} ${labwareViewBox.minY} ${labwareViewBox.xDimension} ${labwareViewBox.yDimension}`}
        >
          {() => (
            <g>
              <LabwareRender
                definition={def}
                positioningMode="offsetInSlot"
                missingTips={missingTips}
                statusByWellName={tipStatusByWellName}
              />
            </g>
          )}
        </RobotWorkSpace>
      </div>
      <div className={styles.footer}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('tips_remaining')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('remaining_tips', { remaining: tipsRemaining })}
        </StyledText>
      </div>
    </div>
  )
}
