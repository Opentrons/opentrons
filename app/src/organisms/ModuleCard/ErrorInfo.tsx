import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  getModuleDisplayName,
  HEATERSHAKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  ALIGN_START,
  Banner,
  Btn,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Modal,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '/app/App/portal'

import type { AttachedModule } from '/app/redux/modules/types'

interface ErrorInfoProps {
  attachedModule: AttachedModule
}
export function ErrorInfo(props: ErrorInfoProps): JSX.Element | null {
  const { attachedModule } = props
  const { t } = useTranslation(['device_details', 'shared', 'branded'])
  const [showErrorDetails, setShowErrorDetails] = useState(false)

  let isError: boolean = false
  //  extend this logic when we know how to tell when Mag/Temp modules are in error state
  if (
    (attachedModule.moduleType === HEATERSHAKER_MODULE_TYPE ||
      attachedModule.moduleType === THERMOCYCLER_MODULE_TYPE) &&
    attachedModule.data.status === 'error'
  ) {
    isError = true
  }
  const errorDetails =
    attachedModule.moduleType === HEATERSHAKER_MODULE_TYPE &&
    attachedModule.data.errorDetails != null
      ? attachedModule.data.errorDetails
      : null

  if (isError === false) return null

  return (
    <Banner
      type="error"
      marginBottom={SPACING.spacing16}
      paddingRight={SPACING.spacing16}
      marginRight={SPACING.spacing24}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {t('module_error')}

        <Flex flexDirection={DIRECTION_ROW}>
          <LegacyStyledText as="p" marginRight={SPACING.spacing4}>
            {t('view')}
          </LegacyStyledText>
          <Btn
            textAlign={ALIGN_START}
            fontSize={TYPOGRAPHY.fontSizeP}
            onClick={() => {
              setShowErrorDetails(true)
            }}
            aria-label="view_error_details"
          >
            <LegacyStyledText
              as="p"
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
            >
              {t('error_details')}
            </LegacyStyledText>
          </Btn>
        </Flex>
      </Flex>
      {showErrorDetails
        ? createPortal(
            <Modal
              type="error"
              title={t('module_name_error', {
                moduleName: getModuleDisplayName(attachedModule.moduleModel),
              })}
              onClose={() => {
                setShowErrorDetails(false)
              }}
            >
              <Flex flexDirection={DIRECTION_COLUMN}>
                {errorDetails != null ? (
                  <LegacyStyledText as="p">{errorDetails}</LegacyStyledText>
                ) : null}
                <LegacyStyledText as="p" marginBottom={SPACING.spacing16}>
                  {t('branded:module_error_contact_support')}
                </LegacyStyledText>
              </Flex>
              <Flex justifyContent={JUSTIFY_FLEX_END}>
                <PrimaryButton
                  onClick={() => {
                    setShowErrorDetails(false)
                  }}
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
