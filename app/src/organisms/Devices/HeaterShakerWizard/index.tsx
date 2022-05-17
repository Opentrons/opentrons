import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Portal } from '../../../App/portal'
import { Interstitial } from '../../../atoms/Interstitial/Interstitial'
import { HEATERSHAKER_MODULE_TYPE } from '../../../redux/modules'
import { PrimaryButton, SecondaryButton } from '../../../atoms/buttons'
import { useAttachedModules } from '../hooks'
import { Introduction } from './Introduction'
import { KeyParts } from './KeyParts'
import { AttachModule } from './AttachModule'
import { AttachAdapter } from './AttachAdapter'
import { PowerOn } from './PowerOn'
import { TestShake } from './TestShake'
import {
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_END,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import type { NavRouteParams } from '../../../App/types'
import type { HeaterShakerModule } from '../../../redux/modules/types'
import type { ProtocolModuleInfo } from '../../Devices/ProtocolRun/utils/getProtocolModulesInfo'
import type { ThermalAdapterName } from '@opentrons/shared-data'

interface HeaterShakerWizardProps {
  onCloseClick: () => unknown
  moduleFromProtocol?: ProtocolModuleInfo
}

export const HeaterShakerWizard = (
  props: HeaterShakerWizardProps
): JSX.Element | null => {
  const { onCloseClick, moduleFromProtocol } = props
  const { t } = useTranslation(['heater_shaker', 'shared'])
  const [currentPage, setCurrentPage] = React.useState(0)
  const { robotName } = useParams<NavRouteParams>()
  const attachedModules = useAttachedModules(robotName)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const heaterShaker =
    attachedModules.find(
      (module): module is HeaterShakerModule =>
        module.moduleType === HEATERSHAKER_MODULE_TYPE
    ) ?? null

  let isPrimaryCTAEnabled: boolean = true

  if (currentPage === 4) {
    isPrimaryCTAEnabled = Boolean(heaterShaker)
  }
  const labwareDef =
    moduleFromProtocol != null ? moduleFromProtocol.nestedLabwareDef : null

  let adapterName: ThermalAdapterName | null = null
  if (
    labwareDef != null &&
    labwareDef.parameters.loadName.includes('adapter')
  ) {
    if (labwareDef.parameters.loadName.includes('pcr')) {
      adapterName = 'PCR Adapter'
    } else if (labwareDef.parameters.loadName.includes('deepwell')) {
      adapterName = 'Deep Well Adapter'
    } else if (labwareDef.parameters.loadName.includes('96flatbottom')) {
      adapterName = '96 Flat Bottom Adapter'
    }
  } else if (labwareDef != null) {
    adapterName = 'Universal Flat Adapter'
  }

  let buttonContent = null
  const getWizardDisplayPage = (): JSX.Element | null => {
    switch (currentPage) {
      case 0:
        buttonContent = t('btn_continue_attachment_guide')
        return (
          <Introduction
            labwareDefinition={labwareDef}
            thermalAdapterName={adapterName}
          />
        )
      case 1:
        buttonContent = t('btn_begin_attachment')
        return <KeyParts />
      case 2:
        buttonContent = t('btn_thermal_adapter')
        return <AttachModule moduleFromProtocol={moduleFromProtocol} />
      case 3:
        buttonContent = t('btn_power_module')
        return <AttachAdapter />
      case 4:
        buttonContent = t('btn_test_shake')
        return <PowerOn attachedModule={heaterShaker} />
      case 5:
        buttonContent = t('complete')
        return (
          // heaterShaker should never be null because isPrimaryCTAEnabled would be disabled otherwise
          heaterShaker != null ? (
            <TestShake
              module={heaterShaker}
              setCurrentPage={setCurrentPage}
              moduleFromProtocol={moduleFromProtocol}
            />
          ) : null
        )
      default:
        return null
    }
  }

  return (
    <Portal level="top">
      <Interstitial
        titleBar={{
          title: t('heater_shaker_setup_description', { name: robotName }),
          exit: {
            onClick: () => onCloseClick(),
            title: t('shared:exit'),
            children: t('shared:exit'),
          },
        }}
      >
        {getWizardDisplayPage()}
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={
            currentPage === 0 ? JUSTIFY_FLEX_END : JUSTIFY_SPACE_BETWEEN
          }
        >
          {currentPage > 0 ? (
            <SecondaryButton
              data-testid={`wizard_back_btn`}
              onClick={() => setCurrentPage(currentPage => currentPage - 1)}
            >
              {t('back')}
            </SecondaryButton>
          ) : null}
          {currentPage <= 5 ? (
            <PrimaryButton
              disabled={!isPrimaryCTAEnabled}
              {...targetProps}
              data-testid={`wizard_next_btn`}
              onClick={
                currentPage === 5
                  ? () => onCloseClick()
                  : () => setCurrentPage(currentPage => currentPage + 1)
              }
            >
              {buttonContent}
              {!isPrimaryCTAEnabled ? (
                <Tooltip {...tooltipProps}>
                  {t('module_is_not_connected')}
                </Tooltip>
              ) : null}
            </PrimaryButton>
          ) : null}
        </Flex>
      </Interstitial>
    </Portal>
  )
}
