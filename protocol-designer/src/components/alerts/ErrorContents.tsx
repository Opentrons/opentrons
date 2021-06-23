import * as React from 'react'
import { i18n } from '../../localization'
import { START_TERMINAL_ITEM_ID } from '../../steplist'
import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import { AlertLevel } from './types'
import { TerminalItemLink } from '../steplist/TerminalItem'

interface ErrorContentsProps {
  errorType: string
  level: AlertLevel
}
export const ErrorContents = (
  props: ErrorContentsProps
): JSX.Element | null => {
  if (props.level === 'timeline') {
    const bodyText = i18n.t(`alert.timeline.error.${props.errorType}.body`, {
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
            {i18n.t(`alert.timeline.error.${props.errorType}.body1`)}
            <KnowledgeBaseLink to="airGap">
              {i18n.t(`alert.timeline.error.${props.errorType}.link`)}
            </KnowledgeBaseLink>
            {i18n.t(`alert.timeline.error.${props.errorType}.body2`)}
          </>
        )
      default:
        // @ts-expect-error(sa, 2021-6-23): wrap in a fragment
        return bodyText
    }
  } else if (props.level === 'form') {
    return (
      <React.Fragment>
        {i18n.t(`alert.form.error.${props.errorType}.body`, {
          defaultValue: '',
        })}
      </React.Fragment>
    )
  } else {
    return null
  }
}
