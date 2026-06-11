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
  WRAP,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import absorbanceReaderManualQRCode from '/app/assets/images/absorbance_reader_instruction_manual_code.png'
import heaterShakerManualQRCode from '/app/assets/images/heatershaker_setup_instructions_qr.png'
import helpCenterQRCode from '/app/assets/images/module_instruction_code.png'
import stackerInstallationQRCode from '/app/assets/images/stacker_installation_qr.png'
import temperatureManualQRCode from '/app/assets/images/temperature_setup_instructions_qr.png'
import thermocyclerManualQRCode from '/app/assets/images/thermocycler_setup_instructions_qr.png'
import vacuumModuleManualQRCode from '/app/assets/images/vacuum_setup_instructions_qr.png'

import type { ModuleModel } from '@opentrons/shared-data'

const MODULE_SETUP_URL = 'https://docs.opentrons.com/modules'
const ABSORBANCE_READER_MANUAL_URL =
  'https://docs.opentrons.com/absorbance-plate-reader/'
const FLEX_STACKER_INSTALL_DOCS_URL = 'https://docs.opentrons.com/stacker/'
const VACUUM_MANUAL_URL = 'https://docs.opentrons.com/vacuum/'
const THERMOCYCLER_MANUAL_URL = 'https://docs.opentrons.com/thermocycler/'
const HEATERSHAKER_MANUAL_URL = 'https://docs.opentrons.com/heater-shaker/'
const TEMPERATURE_MANUAL_URL = 'https://docs.opentrons.com/temperature-module/'
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

  const instructionURL = (): string => {
    const moduleType = getModuleType(moduleModel)
    switch (moduleType) {
      case ABSORBANCE_READER_TYPE:
        return ABSORBANCE_READER_MANUAL_URL
      case FLEX_STACKER_MODULE_TYPE:
        return FLEX_STACKER_INSTALL_DOCS_URL
      case VACUUM_MODULE_TYPE:
        return VACUUM_MANUAL_URL
      case THERMOCYCLER_MODULE_TYPE:
        return THERMOCYCLER_MANUAL_URL
      case HEATERSHAKER_MODULE_TYPE:
        return HEATERSHAKER_MANUAL_URL
      case TEMPERATURE_MODULE_TYPE:
        return TEMPERATURE_MANUAL_URL
      default:
        return MODULE_SETUP_URL
    }
  }
  const instructionQRCode = (): string => {
    const moduleType = getModuleType(moduleModel)
    switch (moduleType) {
      case ABSORBANCE_READER_TYPE:
        return absorbanceReaderManualQRCode
      case FLEX_STACKER_MODULE_TYPE:
        return stackerInstallationQRCode
      case VACUUM_MODULE_TYPE:
        return vacuumModuleManualQRCode
      case THERMOCYCLER_MODULE_TYPE:
        return thermocyclerManualQRCode
      case HEATERSHAKER_MODULE_TYPE:
        return heaterShakerManualQRCode
      case TEMPERATURE_MODULE_TYPE:
        return temperatureManualQRCode
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
            <LegacyStyledText forwardedAs="p" marginBottom={SPACING.spacing16}>
              {t('module_instructions_manual')}
            </LegacyStyledText>
            <Link
              external
              css={TYPOGRAPHY.linkPSemiBold}
              style={{ whiteSpace: WRAP }}
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
          <img
            width="192px"
            height="194px"
            src={instructionQRCode()}
            alt="Module setup QR code"
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
