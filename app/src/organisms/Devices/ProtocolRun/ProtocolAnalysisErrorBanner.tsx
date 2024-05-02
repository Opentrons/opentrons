import * as React from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'

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
} from '@opentrons/components'

import { getTopPortalEl } from '../../../App/portal'
import { Banner } from '../../../atoms/Banner'
import { LegacyModal } from '../../../molecules/LegacyModal'

import type { AnalysisError } from '@opentrons/shared-data'

interface ProtocolAnalysisErrorBannerProps {
  errors: AnalysisError[]
}

export function ProtocolAnalysisErrorBanner(
  props: ProtocolAnalysisErrorBannerProps
): JSX.Element {
  const { errors } = props
  const { t } = useTranslation(['run_details'])
  const [showErrorDetails, setShowErrorDetails] = React.useState(false)

  const handleToggleDetails: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowErrorDetails(!showErrorDetails)
  }

  return (
    <Banner type="error" marginBottom={SPACING.spacing16}>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        width="100%"
      >
        <StyledText as="p">{t('protocol_analysis_failed')}</StyledText>
        <StyledText as="p">
          <Trans
            t={t}
            i18nKey="view_analysis_error_details"
            components={{
              errorLink: (
                <Btn
                  as="a"
                  role="button"
                  aria-label="error_link"
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  onClick={handleToggleDetails}
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
              onClose={handleToggleDetails}
            >
              {errors.map((error, index) => (
                <StyledText as="p" key={index}>
                  {error?.detail}
                </StyledText>
              ))}
              <Flex justifyContent={JUSTIFY_FLEX_END}>
                <PrimaryButton
                  role="button"
                  aria-label="close_modal_button"
                  onClick={handleToggleDetails}
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
