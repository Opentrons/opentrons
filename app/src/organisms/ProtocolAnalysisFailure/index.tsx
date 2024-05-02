import * as React from 'react'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'
import { useTranslation, Trans } from 'react-i18next'

import {
  ALIGN_CENTER,
  Btn,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP_REVERSE,
} from '@opentrons/components'

import { analyzeProtocol } from '../../redux/protocol-storage'
import { Banner } from '../../atoms/Banner'
import { getTopPortalEl } from '../../App/portal'
import { LegacyModal } from '../../molecules/LegacyModal'

import type { Dispatch } from '../../redux/types'
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
        <StyledText as="p">{t('protocol_analysis_failure')}</StyledText>
        <StyledText as="p">
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
        </StyledText>
      </Flex>
      {showErrorDetails
        ? createPortal(
            <LegacyModal
              type="error"
              title={t('protocol_analysis_failure')}
              onClose={handleClickHideDetails}
            >
              {errors.map((error, index) => (
                <StyledText key={index} as="p">
                  {error}
                </StyledText>
              ))}
              <Flex justifyContent={JUSTIFY_FLEX_END}>
                <PrimaryButton
                  onClick={handleClickHideDetails}
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                  marginTop={SPACING.spacing16}
                >
                  {t('shared:close')}
                </PrimaryButton>
              </Flex>
            </LegacyModal>,
            getTopPortalEl()
          )
        : null}
    </Banner>
  )
}
