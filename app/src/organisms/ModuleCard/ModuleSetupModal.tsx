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
import {
  ABSORBANCE_READER_V1,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import absorbanceReaderManualQRCode from '/app/assets/images/absorbance_reader_instruction_manual_code.png'
import helpCenterQRCode from '/app/assets/images/module_instruction_code.png'
import stackerQuickstartQRCode from '/app/assets/images/stacker_quickstart_code.png'

import type { ModuleModel } from '@opentrons/shared-data'

const MODULE_SETUP_URL = 'https://support.opentrons.com/s/modules'
const ABSORBANCE_READER_MANUAL_URL =
  'https://insights.opentrons.com/hubfs/Absorbance%20Plate%20Reader%20Instruction%20Manual.pdf'
const FLEX_STACKER_QUICKSTART_GUIDE_URL =
  'https://insights.opentrons.com/hubfs/Opentrons%20Flex%20Stacker%20Quickstart%20Guide.pdf'

interface ModuleSetupModalProps {
  close: () => void
  moduleDisplayName: string
  moduleModel: ModuleModel
}

export const ModuleSetupModal = (props: ModuleSetupModalProps): JSX.Element => {
  const { moduleDisplayName, moduleModel } = props
  const { t, i18n } = useTranslation([
    'protocol_setup',
    'shared',
    'branded',
    'device_details',
  ])

  const instructionText = (): string => {
    switch (moduleModel) {
      case ABSORBANCE_READER_V1:
        return t('module_instructions_manual')
      case FLEX_STACKER_MODULE_V1:
        return t('module_instructions_quickstart', {
          moduleName: t('device_details:stacker'),
        })
      default:
        // Legacy module instructions direct user to the help center instead of the quickstart guide
        return t('branded:modal_instructions')
    }
  }

  const instructionURL = (): string => {
    switch (moduleModel) {
      case ABSORBANCE_READER_V1:
        return ABSORBANCE_READER_MANUAL_URL
      case FLEX_STACKER_MODULE_V1:
        return FLEX_STACKER_QUICKSTART_GUIDE_URL
      default:
        return MODULE_SETUP_URL
    }
  }
  const instructionQRCode = (): string => {
    switch (moduleModel) {
      case ABSORBANCE_READER_V1:
        return absorbanceReaderManualQRCode
      case FLEX_STACKER_MODULE_V1:
        return stackerQuickstartQRCode
      default:
        return helpCenterQRCode
    }
  }

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
              {instructionText()}
            </LegacyStyledText>
            <Link
              external
              css={TYPOGRAPHY.linkPSemiBold}
              href={instructionURL()}
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
          <img width="192px" height="194px" src={instructionQRCode()} />
        </Flex>
        <PrimaryButton onClick={props.close} alignSelf={ALIGN_FLEX_END}>
          {i18n.format(t('shared:close'), 'capitalize')}
        </PrimaryButton>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
