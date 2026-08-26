import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Banner,
  Btn,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
  WRAP_REVERSE,
} from '@opentrons/components'

import { analyzeProtocol } from '/app/redux/protocol-storage'

import type { MouseEventHandler, ReactNode } from 'react'
import type { Dispatch } from '/app/redux/types'

interface ProtocolAnalysisStaleProps {
  protocolKey: string
}

export function ProtocolAnalysisStale(
  props: ProtocolAnalysisStaleProps
): ReactNode {
  const { protocolKey } = props
  const { t } = useTranslation(['protocol_list', 'shared'])
  const dispatch = useDispatch<Dispatch>()

  const handleClickReanalyze: MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(analyzeProtocol(protocolKey))
  }
  return (
    <Banner type="warning" marginRight={SPACING.spacing24}>
      <Flex
        columnGap={SPACING.spacing8}
        flex="1"
        flexWrap={WRAP_REVERSE}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        width="100%"
      >
        <LegacyStyledText forwardedAs="p">
          {t('protocol_analysis_outdated')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          <Trans
            t={t}
            i18nKey="reanalyze_to_view"
            components={{
              analysisLink: (
                <Btn
                  // forwardedAs="a"
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  onClick={handleClickReanalyze}
                />
              ),
            }}
          />
        </LegacyStyledText>
      </Flex>
    </Banner>
  )
}
