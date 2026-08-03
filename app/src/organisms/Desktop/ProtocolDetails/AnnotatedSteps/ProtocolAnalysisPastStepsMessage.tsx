import { COLORS, StyledText } from '@opentrons/components'

import styles from './annotatedsteps.module.css'

export function ProtocolAnalysisPastStepsMessage(props: {
  t: (key: string) => string
}): JSX.Element {
  const { t } = props

  return (
    <div className={styles.annotated_steps_past_steps_row}>
      <div className={styles.annotated_steps_error_footer_message}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('unable_to_show_steps_past_errors')}
        </StyledText>
      </div>
    </div>
  )
}
