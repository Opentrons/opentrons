import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  COLORS,
  LabwareRender,
  NEW,
  NO,
  RobotInfoLabel,
  RobotWorkSpace,
  StyledText,
  Tag,
  USED,
} from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { stepDetailViewerOpenAction } from '/app/redux/shell'

import styles from './tippickupcontainer.module.css'
import { getMissingTips } from './utils'

import type { TipType } from '@opentrons/components'
import type {
  LabwareEntity,
  RobotState,
  TipState,
} from '@opentrons/step-generation'

interface TipPickupContainerProps {
  protocolKey: string // the interface  will be updated soon
  tiprackEntity: LabwareEntity
  robotState: RobotState
}

export function TipPickupContainer(
  props: TipPickupContainerProps
): JSX.Element {
  const { protocolKey, tiprackEntity, robotState } = props
  const dispatch = useDispatch()
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
    <div
      className={styles.container}
      onClick={() => dispatch(stepDetailViewerOpenAction(protocolKey))}
    >
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
const tipStateToTipType: Record<TipState, TipType> = {
  CLEAN: NEW,
  DIRTY: USED,
  EMPTY: NO,
}
