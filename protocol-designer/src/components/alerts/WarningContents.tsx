import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { START_TERMINAL_ITEM_ID } from '../../steplist'
import { TerminalItemLink } from '../steplist/TerminalItem'

import type { AlertLevel } from './types'
interface WarningContentsProps {
  warningType: string
  level: AlertLevel
}
export const WarningContents = (
  props: WarningContentsProps
): JSX.Element | null => {
  const { t } = useTranslation('alert')
  if (props.level === 'timeline') {
    switch (props.warningType) {
      case 'ASPIRATE_FROM_PRISTINE_WELL':
        return (
          <>
            {t(`timeline.warning.${props.warningType}.body`, {
              defaultValue: '',
            })}
            <TerminalItemLink terminalId={START_TERMINAL_ITEM_ID} />
          </>
        )
      default:
        return (
          <React.Fragment>
            {t(`timeline.warning.${props.warningType}.body`, {
              defaultValue: '',
            })}
          </React.Fragment>
        )
    }
  } else if (props.level === 'form') {
    return (
      <React.Fragment>
        {t(`form.warning.${props.warningType}.body`, {
          defaultValue: '',
        })}
      </React.Fragment>
    )
  } else {
    return null
  }
}
