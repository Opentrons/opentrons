import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  LegacyStyledText,
  Link,
  Modal,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import absorbanceReaderManualQRCode from '/app/assets/images/absorbance_reader_instruction_manual_code.png'
import helpCenterQRCode from '/app/assets/images/module_instruction_code.png'

const MODULE_SETUP_URL = 'https://support.opentrons.com/s/modules'
const ABSORBANCE_READER_MANUAL_URL =
  'https://insights.opentrons.com/hubfs/Absorbance%20Plate%20Reader%20Instruction%20Manual.pdf'

interface ModuleSetupModalProps {
  close: () => void
  moduleDisplayName: string
  isAbsorbanceReader?: boolean
}

export const ModuleSetupModal = (props: ModuleSetupModalProps): JSX.Element => {
  const { moduleDisplayName, isAbsorbanceReader } = props
  const { t, i18n } = useTranslation(['protocol_setup', 'shared', 'branded'])

  return createPortal(
    <Modal
      title={t('modal_instructions_title', { moduleName: moduleDisplayName })}
      onClose={props.close}
      width="668px"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_ROW} marginBottom={SPACING.spacing16}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            marginRight="3.625rem"
            width="50%"
          >
            <LegacyStyledText as="p" marginBottom={SPACING.spacing16}>
              {isAbsorbanceReader
                ? t('module_instructions_manual')
                : t('branded:modal_instructions')}
            </LegacyStyledText>
            <Link
              external
              css={TYPOGRAPHY.linkPSemiBold}
              href={
                isAbsorbanceReader
                  ? ABSORBANCE_READER_MANUAL_URL
                  : MODULE_SETUP_URL
              }
              target="_blank"
              rel="noopener noreferrer"
              marginBottom={SPACING.spacing16}
            >
              {t('module_instructions_link', {
                moduleName: moduleDisplayName,
              })}
              <Icon
                name="open-in-new"
                marginLeft={SPACING.spacing4}
                size="0.625rem"
              />
            </Link>
          </Flex>
          <img
            width="192px"
            height="194px"
            src={
              isAbsorbanceReader
                ? absorbanceReaderManualQRCode
                : helpCenterQRCode
            }
          />
        </Flex>
        <PrimaryButton onClick={props.close} alignSelf={ALIGN_FLEX_END}>
          {i18n.format(t('shared:close'), 'capitalize')}
        </PrimaryButton>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
