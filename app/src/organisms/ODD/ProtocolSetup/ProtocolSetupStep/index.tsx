import clsx from 'clsx'

import { Icon, StyledText, truncateString } from '@opentrons/components'

import { useToaster } from '../../../ToasterOven'
import styles from './protocolsetupstep.module.css'

const CSV_FILE_MAX_LENGTH = 18 // truncated text + three dots

export type ProtocolSetupStepStatus =
  'ready' | 'not ready' | 'general' | 'inform'
export interface ProtocolSetupStepProps {
  onClickSetupStep: () => void
  status: ProtocolSetupStepStatus
  title: string
  // first line of detail text
  detail?: string | null
  // clip detail text overflow with ellipsis
  clipDetail?: boolean
  // second line of detail text
  subDetail?: string | null
  // disallow click handler, disabled styling
  disabled?: boolean
  // disallow click handler, don't show CTA icons, allow styling
  interactionDisabled?: boolean
  // display the reason the setup step is disabled
  disabledReason?: string | null
  //  optional description
  description?: string | null
  //  optional removal of the left icon
  hasLeftIcon?: boolean
  //  optional removal of the right icon
  hasRightIcon?: boolean
  //  optional enlarge the font size
  fontSize?: string
}

const ROW_STATUS_CLASS: Record<ProtocolSetupStepStatus, string> = {
  ready: styles.row_ready,
  'not ready': styles.row_not_ready,
  general: styles.row_general,
  inform: styles.row_inform,
}

export function ProtocolSetupStep({
  onClickSetupStep,
  status,
  title,
  detail,
  subDetail,
  disabled = false,
  clipDetail = false,
  interactionDisabled = false,
  disabledReason,
  description,
  hasRightIcon = true,
  hasLeftIcon = true,
}: ProtocolSetupStepProps): JSX.Element {
  const isInteractionDisabled = interactionDisabled || disabled
  const { makeSnackbar } = useToaster()

  const makeDisabledReasonSnackbar = (): void => {
    if (disabledReason != null) {
      makeSnackbar(disabledReason)
    }
  }

  const isToggle = detail === 'On' || detail === 'Off'
  const showStatusIcon =
    status !== 'general' && !disabled && status !== 'inform' && hasLeftIcon

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => {
        !isInteractionDisabled
          ? onClickSetupStep()
          : makeDisabledReasonSnackbar()
      }}
      data-testid={`SetupButton_${title}`}
    >
      <div
        className={clsx(
          styles.row,
          disabled ? styles.row_disabled : ROW_STATUS_CLASS[status]
        )}
      >
        {showStatusIcon ? (
          <Icon
            name={status === 'ready' ? 'ot-check' : 'ot-alert'}
            className={clsx(
              styles.status_icon,
              status === 'ready'
                ? styles.status_icon_ready
                : styles.status_icon_not_ready
            )}
          />
        ) : null}
        <div className={styles.title_column}>
          <StyledText
            oddStyle="level4HeaderSemiBold"
            className={disabled ? styles.title_disabled : styles.title_enabled}
          >
            {title}
          </StyledText>
          {description != null ? (
            <StyledText
              oddStyle="bodyTextRegular"
              className={clsx(
                styles.description,
                disabled
                  ? styles.description_disabled
                  : styles.description_enabled
              )}
            >
              {description}
            </StyledText>
          ) : null}
        </div>
        <div
          className={clsx(styles.detail_column, {
            [styles.detail_column_toggle]: isToggle,
          })}
        >
          <StyledText
            oddStyle="bodyTextRegular"
            className={clsx(
              styles.detail,
              interactionDisabled
                ? styles.detail_disabled
                : styles.detail_enabled,
              { [styles.detail_clipped]: clipDetail }
            )}
          >
            {title === 'CSV File' && detail != null
              ? truncateString(detail, CSV_FILE_MAX_LENGTH)
              : detail}
            {subDetail != null && detail != null ? <br /> : null}
            {subDetail}
          </StyledText>
        </div>
        {interactionDisabled || !hasRightIcon ? null : (
          <Icon name="more" className={styles.more_icon} />
        )}
      </div>
    </button>
  )
}
