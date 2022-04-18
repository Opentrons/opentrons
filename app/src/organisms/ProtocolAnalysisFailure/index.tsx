import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation, Trans } from 'react-i18next'

import {
  Flex,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  Btn,
  TEXT_DECORATION_UNDERLINE,
  JUSTIFY_FLEX_END,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { Portal } from '../../App/portal'
import { Modal } from '../../atoms/Modal'
import { PrimaryButton } from '../../atoms/Buttons'

import type { Dispatch } from '../../redux/types'
import { analyzeProtocol } from '../../redux/protocol-storage'
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

  return (
    <Banner type="error" marginBottom={SPACING.spacing4}>
      <Flex
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
                  textDecoration={TEXT_DECORATION_UNDERLINE}
                  onClick={e => {
                    e.preventDefault()
                    setShowErrorDetails(true)
                  }}
                />
              ),
              analysisLink: (
                <Btn
                  as="a"
                  textDecoration={TEXT_DECORATION_UNDERLINE}
                  onClick={e => {
                    e.preventDefault()
                    console.log('TODO: trigger analysis')
                    dispatch(analyzeProtocol(protocolKey))
                  }}
                />
              ),
            }}
          />
        </StyledText>
      </Flex>
      {showErrorDetails ? (
        <Portal level="top">
          <Modal
            type="error"
            title={t('protocol_analysis_failure')}
            onClose={e => {
              e.preventDefault()
              setShowErrorDetails(false)
            }}
          >
            {errors.map((error, index) => (
              <StyledText key={index} as="p">
                {error}
              </StyledText>
            ))}
            <Flex justifyContent={JUSTIFY_FLEX_END}>
              <PrimaryButton
                onClick={() => setShowErrorDetails(false)}
                textTransform={TEXT_TRANSFORM_CAPITALIZE}
                marginTop={SPACING.spacing4}
              >
                {t('shared:close')}
              </PrimaryButton>
            </Flex>
          </Modal>
        </Portal>
      ) : null}
    </Banner>
  )
}
