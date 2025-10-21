import { useTranslation } from 'react-i18next'

import {
  COLORS,
  LabwareRender,
  NO,
  RobotInfoLabel,
  RobotWorkSpace,
  StyledText,
  Tag,
  tipStateToTipType,
} from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import styles from './tippickupcontainer.module.css'
import { getMissingTips } from './utils'

import type { TipType } from '@opentrons/components'
import type { LabwareEntity, RobotState } from '@opentrons/step-generation'

interface TipPickupContainerProps {
  tiprackEntity: LabwareEntity
  robotState: RobotState
}

export function TipPickupContainer(
  props: TipPickupContainerProps
): JSX.Element {
  const { tiprackEntity, robotState } = props
  const { t } = useTranslation('protocol_visualization')
  const { id, def } = tiprackEntity
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
        <Tag text={t('tipPickup')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel={slot} />
      </div>
      <div className={styles.subheader}>
        <StyledText desktopStyle="captionSemiBold">
          {def.metadata.displayName}
        </StyledText>
      </div>
      <div className={styles.main_content}>
        <RobotWorkSpace
          key={id}
          width="14rem"
          viewBox={`${labwareViewBox.minX} ${labwareViewBox.minY} ${labwareViewBox.xDimension} ${labwareViewBox.yDimension}`}
        >
          {() => (
            <g>
              <LabwareRender
                definition={def}
                positioningMode="offsetInSlot"
                missingTips={missingTips}
                tipStatusByWellName={tipStatusByWellName}
              />
            </g>
          )}
        </RobotWorkSpace>
      </div>
      <div className={styles.footer}>
        <StyledText desktopStyle="captionSemiBold" color={COLORS.grey60}>
          {t('tips_remaining')}
        </StyledText>
        <StyledText desktopStyle="captionSemiBold">
          {t('remaining_tips', { remaining: tipsRemaining })}
        </StyledText>
      </div>
    </div>
  )
}
