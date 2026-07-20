import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  LabwareRender,
  NO,
  RobotWorkSpace,
  StyledText,
  tipStateToTipType,
} from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'

import { getMissingTips } from '../../utils/getMissingTips'
import styles from './tippickupslot.module.css'

import type { TipType } from '@opentrons/components'
import type { RobotState } from '@opentrons/step-generation'
import type { LabwareEntityExtended } from '../../DeckView'

interface TipPickupSlotProps {
  tiprackEntity: LabwareEntityExtended
  robotState: RobotState
  // when set, the header block is rendered into this element via portal
  headerPortalEl?: HTMLElement | null
}

export function TipPickupSlot(props: TipPickupSlotProps): JSX.Element {
  const { tiprackEntity, robotState, headerPortalEl } = props
  const { t } = useTranslation('protocol_visualization')
  const { id, def, nickName } = tiprackEntity
  const { tipState } = robotState
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
  const tipsRemaining = Object.values(tipStatusByWellName).filter(
    state => state !== NO
  ).length

  const header = (
    <div className={styles.header}>
      {nickName != null ? (
        <StyledText desktopStyle="bodyDefaultSemiBold">{nickName}</StyledText>
      ) : null}
      <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
        {def.metadata.displayName}
      </StyledText>
    </div>
  )

  return (
    <div className={styles.container}>
      {headerPortalEl != null ? createPortal(header, headerPortalEl) : header}
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
