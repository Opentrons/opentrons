import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAdapterName } from '@opentrons/shared-data'
import { Portal } from '../../../App/portal'
import { Interstitial } from '../../../atoms/Interstitial/Interstitial'
import { PrimaryButton, SecondaryButton } from '../../../atoms/buttons'
import { Tooltip } from '../../../atoms/Tooltip'
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
  useHoverTooltip,
} from '@opentrons/components'

import type { ModuleModel } from '@opentrons/shared-data'
import type { NavRouteParams } from '../../../App/types'
import type { HeaterShakerModule } from '../../../redux/modules/types'
import type { ProtocolModuleInfo } from '../../Devices/ProtocolRun/utils/getProtocolModulesInfo'

interface HeaterShakerWizardProps {
  onCloseClick: () => unknown
  moduleFromProtocol?: ProtocolModuleInfo
  attachedModule: HeaterShakerModule
  currentRunId?: string
}

export const HeaterShakerWizard = (
  props: HeaterShakerWizardProps
): JSX.Element | null => {
  const {
    onCloseClick,
    moduleFromProtocol,
    attachedModule,
    currentRunId,
  } = props
  const { t } = useTranslation(['heater_shaker', 'shared'])
  const [currentPage, setCurrentPage] = React.useState(0)
  const { robotName } = useParams<NavRouteParams>()
  const [targetProps, tooltipProps] = useHoverTooltip()

  let isPrimaryCTAEnabled: boolean = true
  if (currentPage === 3) {
    isPrimaryCTAEnabled = Boolean(attachedModule)
  }
  const labwareDef =
    moduleFromProtocol != null ? moduleFromProtocol.nestedLabwareDef : null

  let heaterShakerModel: ModuleModel
  if (attachedModule != null) {
    heaterShakerModel = attachedModule.moduleModel
  } else if (moduleFromProtocol != null) {
    heaterShakerModel = moduleFromProtocol.moduleDef.model
  }

  let buttonContent = null
  const getWizardDisplayPage = (): JSX.Element | null => {
    switch (currentPage) {
      case 0:
        buttonContent = t('btn_continue_attachment_guide')
        return (
          <Introduction
            labwareDefinition={labwareDef}
            moduleModel={heaterShakerModel}
            thermalAdapterName={
              labwareDef != null
                ? getAdapterName(labwareDef.parameters.loadName)
                : null
            }
          />
        )
      case 1:
        buttonContent = t('btn_begin_attachment')
        return <KeyParts />
      case 2:
        buttonContent = t('btn_power_module')
        return <AttachModule moduleFromProtocol={moduleFromProtocol} />
      case 3:
        buttonContent = t('btn_thermal_adapter')
        return <PowerOn attachedModule={attachedModule} />
      case 4:
        buttonContent = t('btn_test_shake')
        return (
          // heaterShaker should never be null because isPrimaryCTAEnabled would be disabled otherwise
          attachedModule != null ? (
            <AttachAdapter
              module={attachedModule}
              currentRunId={currentRunId}
            />
          ) : null
        )
      case 5:
        buttonContent = t('complete')
        return attachedModule != null ? (
          <TestShake
            module={attachedModule}
            setCurrentPage={setCurrentPage}
            moduleFromProtocol={moduleFromProtocol}
            currentRunId={currentRunId}
          />
        ) : null
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
                <Tooltip tooltipProps={tooltipProps}>
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
