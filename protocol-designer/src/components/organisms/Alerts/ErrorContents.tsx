import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Btn,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { LINK_BUTTON_STYLE } from '/protocol-designer/components/atoms'
import { START_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import { selectTerminalItem } from '/protocol-designer/ui/steps/actions/actions'

import type { ErrorType } from '@opentrons/step-generation'
import type { AlertLevel } from './types'

interface ErrorContentsProps {
  errorType: ErrorType
  level: AlertLevel
  translationParams?: Record<string, string>
}
export const ErrorContents = (
  props: ErrorContentsProps
): JSX.Element | null => {
  const { errorType, level, translationParams } = props
  const { t } = useTranslation(['alert', 'shared'])
  const dispatch = useDispatch()

  if (level === 'timeline') {
    const bodyText = t(`timeline.error.${errorType}.body`, {
      defaultValue: '',
      ...translationParams,
    })
    switch (errorType) {
      case 'INSUFFICIENT_TIPS':
        return (
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            gridGap={SPACING.spacing8}
          >
            {bodyText}
            <Btn
              width="7.25rem"
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              css={LINK_BUTTON_STYLE}
              onClick={() => {
                dispatch(selectTerminalItem(START_TERMINAL_ITEM_ID))
              }}
            >
              {t(`timeline.error.${errorType}.link`)}
            </Btn>
          </Flex>
        )
      case 'REMOVE_96_CHANNEL_TIPRACK_ADAPTER':
      case 'MISSING_96_CHANNEL_TIPRACK_ADAPTER':
        return (
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            gridGap={SPACING.spacing8}
          >
            {t(`timeline.error.${errorType}.body`)}
            <Btn
              width="7.25rem"
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              css={LINK_BUTTON_STYLE}
              onClick={() => {
                dispatch(selectTerminalItem(START_TERMINAL_ITEM_ID))
              }}
            >
              {t(`timeline.error.${errorType}.link`)}
            </Btn>
          </Flex>
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
