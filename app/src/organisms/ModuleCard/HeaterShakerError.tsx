import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  Btn,
  JUSTIFY_FLEX_END,
  TYPOGRAPHY,
  ALIGN_START,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { Portal } from '../../App/portal'
import { Modal } from '../../atoms/Modal'
import { PrimaryButton } from '../../atoms/buttons'

interface HeaterShakerErrorProps {
  errorDetails: string
}
export function HeaterShakerError(props: HeaterShakerErrorProps): JSX.Element {
  const { errorDetails } = props
  const { t } = useTranslation(['heater_shaker', 'shared'])
  const [showErrorDetails, setShowErrorDetails] = React.useState(false)

  const handleHideDetails: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowErrorDetails(false)
  }

  return (
    <Banner
      type="error"
      marginBottom={SPACING.spacing4}
      paddingRight={SPACING.spacing4}
      marginRight={SPACING.spacing5}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {t('heater_shaker:module_error')}
        <Btn
          textAlign={ALIGN_START}
          fontSize={TYPOGRAPHY.fontSizeP}
          textDecoration={TYPOGRAPHY.textDecorationUnderline}
          onClick={() => setShowErrorDetails(true)}
        >
          {t('heater_shaker:view_details')}
        </Btn>
      </Flex>
      {showErrorDetails ? (
        <Portal level="top">
          <Modal
            type="error"
            title={t('heater_shaker_error')}
            onClose={handleHideDetails}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="p" marginBottom={SPACING.spacing4}>
                {t('module_error_contact_support')}
              </StyledText>
              <StyledText as="p">{errorDetails}</StyledText>
            </Flex>
            <Flex justifyContent={JUSTIFY_FLEX_END}>
              <PrimaryButton
                onClick={handleHideDetails}
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
