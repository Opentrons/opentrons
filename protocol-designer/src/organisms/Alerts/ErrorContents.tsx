import { useTranslation } from 'react-i18next'
import { START_TERMINAL_ITEM_ID } from '../../steplist'
import { KnowledgeBaseLink } from '../../components/KnowledgeBaseLink'
import { TerminalItemLink } from './TerminalItemLink'

import type { AlertLevel } from './types'

interface ErrorContentsProps {
  errorType: string
  level: AlertLevel
}
export const ErrorContents = (
  props: ErrorContentsProps
): JSX.Element | null => {
  const { errorType, level } = props
  const { t } = useTranslation(['alert', 'shared'])

  if (level === 'timeline') {
    const bodyText = t(`timeline.error.${errorType}.body`, {
      defaultValue: '',
    })
    switch (errorType) {
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
              {t('shared:here')}
            </KnowledgeBaseLink>
          </>
        )
      case 'NO_TIP_ON_PIPETTE':
        return (
          <>
            {t(`timeline.error.${errorType}.body1`)}
            <KnowledgeBaseLink to="airGap">
              {t(`timeline.error.${errorType}.link`)}
            </KnowledgeBaseLink>
            {t(`timeline.error.${errorType}.body2`)}
          </>
        )
      default:
        return bodyText
    }
  } else if (level === 'form') {
    return t(`form.error.${errorType}.body`, {
      defaultValue: '',
    })
  } else {
    return null
  }
}
