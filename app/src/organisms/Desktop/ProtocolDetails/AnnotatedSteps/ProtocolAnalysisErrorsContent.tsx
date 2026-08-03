import { COLORS, Icon, StyledText } from '@opentrons/components'

import styles from './annotatedsteps.module.css'

import type { AnalysisError } from '@opentrons/shared-data'

interface ProtocolAnalysisErrorsContentProps {
  errors: AnalysisError[]
  onShowErrorDetails: () => void
  t: (key: string) => string
  // align padding with grouped step rows inside an expanded annotation.
  inGroup?: boolean
  // when false, only error cards render (past-steps line is shown as its own list row)
  showPastStepsMessage?: boolean
}

export function ProtocolAnalysisErrorsContent(
  props: ProtocolAnalysisErrorsContentProps
): JSX.Element {
  const {
    errors,
    onShowErrorDetails,
    t,
    inGroup = false,
    showPastStepsMessage = true,
  } = props

  return (
    <div
      className={
        inGroup
          ? styles.annotated_steps_error_wrapper_in_group
          : styles.annotated_steps_error_wrapper
      }
    >
      {errors.map(error => (
        <div
          className={styles.annotated_steps_error_container}
          key={error.id}
          onClick={onShowErrorDetails}
        >
          <div className={styles.annotated_steps_header}>
            <Icon name="ot-alert" size="1rem" color={COLORS.red60} />
            <StyledText desktopStyle="captionSemiBold" color={COLORS.red60}>
              {t('step_error')}
            </StyledText>
          </div>
          <StyledText desktopStyle="bodyDefaultRegular">
            {error.detail}
          </StyledText>
        </div>
      ))}
      {showPastStepsMessage ? (
        <div className={styles.annotated_steps_error_footer_message}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('unable_to_show_steps_past_errors')}
          </StyledText>
        </div>
      ) : null}
    </div>
  )
}
