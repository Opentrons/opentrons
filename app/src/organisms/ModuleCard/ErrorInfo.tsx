import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  getModuleDisplayName,
  HEATERSHAKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  Flex,
  SPACING,
  Btn,
  JUSTIFY_FLEX_END,
  TYPOGRAPHY,
  ALIGN_START,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { Portal } from '../../App/portal'
import { Modal } from '../../molecules/Modal'
import { PrimaryButton } from '../../atoms/buttons'

import type { AttachedModule } from '../../redux/modules/types'

interface ErrorInfoProps {
  attachedModule: AttachedModule
}
export function ErrorInfo(props: ErrorInfoProps): JSX.Element | null {
  const { attachedModule } = props
  const { t } = useTranslation(['device_details', 'shared'])
  const [showErrorDetails, setShowErrorDetails] = React.useState(false)

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
      marginBottom={SPACING.spacing4}
      paddingRight={SPACING.spacing4}
      marginRight={SPACING.spacing5}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {t('module_error')}

        <Flex flexDirection={DIRECTION_ROW}>
          <StyledText as="p" marginRight={SPACING.spacing2}>
            {t('view')}
          </StyledText>
          <Btn
            textAlign={ALIGN_START}
            fontSize={TYPOGRAPHY.fontSizeP}
            onClick={() => setShowErrorDetails(true)}
            aria-label="view_error_details"
          >
            <StyledText
              as="p"
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
            >
              {t('error_details')}
            </StyledText>
          </Btn>
        </Flex>
      </Flex>
      {showErrorDetails ? (
        <Portal level="top">
          <Modal
            type="error"
            title={t('module_name_error', {
              moduleName: getModuleDisplayName(attachedModule.moduleModel),
            })}
            onClose={() => setShowErrorDetails(false)}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              {errorDetails != null ? (
                <StyledText as="p">{errorDetails}</StyledText>
              ) : null}
              <StyledText as="p" marginBottom={SPACING.spacing4}>
                {t('module_error_contact_support')}
              </StyledText>
            </Flex>
            <Flex justifyContent={JUSTIFY_FLEX_END}>
              <PrimaryButton
                onClick={() => setShowErrorDetails(false)}
                textTransform={TYPOGRAPHY.textTransformCapitalize}
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
