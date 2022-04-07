import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Portal } from '../../../App/portal'
import { Interstitial } from '../../../atoms/Interstitial/Interstitial'
import { HEATERSHAKER_MODULE_TYPE } from '../../../redux/modules'
import { PrimaryButton, SecondaryButton } from '../../../atoms/Buttons'
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

import type { NextGenRouteParams } from '../../../App/NextGenApp'
import type { HeaterShakerModule } from '../../../redux/modules/types'
import { useAttachedModules } from '../hooks'

interface HeaterShakerWizardProps {
  onCloseClick: () => unknown
  hasProtocol?: boolean
}

export const HeaterShakerWizard = (
  props: HeaterShakerWizardProps
): JSX.Element | null => {
  const { onCloseClick, hasProtocol } = props
  const { t } = useTranslation(['heater_shaker', 'shared'])
  const [currentPage, setCurrentPage] = React.useState(0)
  const { robotName } = useParams<NextGenRouteParams>()
  const attachedModules = useAttachedModules(robotName)
  const [targetProps, tooltipProps] = useHoverTooltip()

  const heaterShaker =
    attachedModules.find(
      (module): module is HeaterShakerModule =>
        module.type === HEATERSHAKER_MODULE_TYPE
    ) ?? null
  let isPrimaryCTAEnabled: boolean = true

  if (currentPage === 4) {
    isPrimaryCTAEnabled = Boolean(heaterShaker)
  }

  let buttonContent = null
  const getWizardDisplayPage = (): JSX.Element | null => {
    switch (currentPage) {
      case 0:
        buttonContent = t('btn_continue_attachment_guide')
        return (
          <Introduction
          //  TODO(jr, 2022-02-16): get labwareDefinition2 of labware on top of heater shaker (nestedLabwareDef from moduleRenderInfoById)
          //  TODO(jr, 2022-02-16): get adapter name and image - would this be connected to nestedLabwareDefinition?
          />
        )
      case 1:
        buttonContent = t('btn_begin_attachment')
        return <KeyParts />
      case 2:
        buttonContent = t('btn_thermal_adapter')
        return <AttachModule slotName={'1'} />
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
              hasProtocol={hasProtocol}
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
