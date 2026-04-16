import { useTranslation } from 'react-i18next'

import { COLORS, RobotInfoLabel, StyledText, Tag } from '@opentrons/components'
import { EMPTY } from '@opentrons/step-generation'

import styles from './tipdisposalcontainer.module.css'

import type { RobotState } from '@opentrons/step-generation'

interface TipDisposalContainerProps {
  robotState: RobotState
}

export function TipDisposalContainer({
  robotState,
}: TipDisposalContainerProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  const { tipState } = robotState
  const totalEmptyTips = Object.values(tipState.tipracks).reduce(
    (sum, rack) =>
      sum +
      Object.values(rack).reduce(
        (rackSum, tipVal) => rackSum + (tipVal === EMPTY ? 1 : 0),
        0
      ),
    0
  )
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('disposal')} type="default" shrinkToContent />
        <RobotInfoLabel deckLabel={t('trash')} />
      </div>
      <div className={styles.main_content}>
        <div className={styles.text_container}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {t('tips_in_trash')}
          </StyledText>
          <StyledText desktopStyle="captionRegular">
            {t('remaining_tips', { remaining: totalEmptyTips })}
          </StyledText>
        </div>
        {/* TODO: count number of lids in trash when we support lids in PV
        <div className={styles.text_container}>
          <StyledText desktopStyle="captionSemiBold" color={COLORS.grey60}>
            {t('lids_in_trash')}
          </StyledText>
          <StyledText desktopStyle="captionSemiBold">{'lids num'}</StyledText>
        </div> */}
      </div>
    </div>
  )
}
