import * as React from 'react'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'
import { useTranslation, Trans } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Btn,
  Banner,
  Flex,
  JUSTIFY_FLEX_END,
  Modal,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  WRAP_REVERSE,
} from '@opentrons/components'

import { analyzeProtocol } from '/app/redux/protocol-storage'
import { getTopPortalEl } from '/app/App/portal'

import type { Dispatch } from '/app/redux/types'
interface ProtocolAnalysisFailureProps {
  errors: string[]
  protocolKey: string
}

export function ProtocolAnalysisFailure(
  props: ProtocolAnalysisFailureProps
): JSX.Element {
  const { errors, protocolKey } = props
  const { t } = useTranslation(['protocol_list', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const [showErrorDetails, setShowErrorDetails] = React.useState(false)

  const handleClickShowDetails: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowErrorDetails(true)
  }
  const handleClickHideDetails: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowErrorDetails(false)
  }
  const handleClickReanalyze: React.MouseEventHandler = e => {
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
        <LegacyStyledText as="p">
          {t('protocol_analysis_failure')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          <Trans
            t={t}
            i18nKey="reanalyze_or_view_error"
            components={{
              errorLink: (
                <Btn
                  as="a"
                  role="button"
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  onClick={handleClickShowDetails}
                />
              ),
              analysisLink: (
                <Btn
                  as="a"
                  role="button"
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  onClick={handleClickReanalyze}
                />
              ),
            }}
          />
        </LegacyStyledText>
      </Flex>
      {showErrorDetails
        ? createPortal(
            <Modal
              type="error"
              title={t('protocol_analysis_failure')}
              onClose={handleClickHideDetails}
            >
              <Flex css={SCROLL_LONG}>
                {errors.map((error, index) => (
                  <LegacyStyledText key={index} as="p">
                    {error}
                  </LegacyStyledText>
                ))}
              </Flex>
              <Flex justifyContent={JUSTIFY_FLEX_END}>
                <PrimaryButton
                  onClick={handleClickHideDetails}
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                  marginTop={SPACING.spacing16}
                >
                  {t('shared:close')}
                </PrimaryButton>
              </Flex>
            </Modal>,
            getTopPortalEl()
          )
        : null}
    </Banner>
  )
}

const SCROLL_LONG = css`
  overflow: auto;
  width: inherit;
  max-height: 11.75rem;
`
