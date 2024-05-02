import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { START_TERMINAL_ITEM_ID } from '../../steplist'
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import { TerminalItemLink } from '../steplist/TerminalItem'

import type { AlertLevel } from './types'

interface ErrorContentsProps {
  errorType: string
  level: AlertLevel
}
export const ErrorContents = (
  props: ErrorContentsProps
): JSX.Element | null => {
  const { t } = useTranslation('alert')
  if (props.level === 'timeline') {
    const bodyText = t(`timeline.error.${props.errorType}.body`, {
      defaultValue: '',
    })
    switch (props.errorType) {
      case 'INSUFFICIENT_TIPS':
        return (
          <>
            {bodyText}
            <TerminalItemLink terminalId={START_TERMINAL_ITEM_ID} />
          </>
        )
      case 'MODULE_PIPETTE_COLLISION_DANGER':
        return (
          <>
            {bodyText}
            <KnowledgeBaseLink to="pipetteGen1MultiModuleCollision">
              here
            </KnowledgeBaseLink>
          </>
        )
      case 'NO_TIP_ON_PIPETTE':
        return (
          <>
            {t(`timeline.error.${props.errorType}.body1`)}
            <KnowledgeBaseLink to="airGap">
              {t(`timeline.error.${props.errorType}.link`)}
            </KnowledgeBaseLink>
            {t(`timeline.error.${props.errorType}.body2`)}
          </>
        )
      default:
        return bodyText
    }
  } else if (props.level === 'form') {
    return (
      <React.Fragment>
        {t(`form.error.${props.errorType}.body`, {
          defaultValue: '',
        })}
      </React.Fragment>
    )
  } else {
    return null
  }
}
