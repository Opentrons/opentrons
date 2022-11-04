import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  ModuleType,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import { COLORS } from '@opentrons/components'
import { Divider } from '../../../atoms/structure/Divider'
import { TertiaryButton } from '../../../atoms/buttons'
import { SecureLabwareModal } from '../../ProtocolSetup/RunSetupCard/LabwareSetup/SecureLabwareModal'
import { ModuleRenderInfoForProtocol } from '../hooks'
import { Banner, BannerItem } from './Banner/Banner'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { ModuleTypesThatRequireExtraAttention } from '../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'

interface ModuleExtraAttentionProps {
  moduleTypes: ModuleType[]
  modulesInfo: { [moduleId: string]: ModuleRenderInfoForProtocol }
}
/**
 * @deprecated When enable liquid setup FF is removed, this component will no longer be used
 */
export const ModuleExtraAttention = (
  props: ModuleExtraAttentionProps
): JSX.Element => {
  const { moduleTypes, modulesInfo } = props
  const { t } = useTranslation('protocol_setup')
  const [
    secureLabwareModalType,
    setSecureLabwareModalType,
  ] = React.useState<ModuleType | null>(null)

  const modulesThatRequireExtraAttention = Object.values(
    modulesInfo
  ).filter(module => moduleTypes.includes(module.moduleDef.moduleType))

  return (
    <Banner title={t('extra_attention_warning_title')}>
      {secureLabwareModalType != null && (
        <SecureLabwareModal
          type={secureLabwareModalType as ModuleTypesThatRequireExtraAttention}
          onCloseClick={() => setSecureLabwareModalType(null)}
        />
      )}
      {modulesThatRequireExtraAttention.map((module, index) => {
        return (
          <React.Fragment key={index}>
            {index > 0 && <Divider color={COLORS.medGreyEnabled} />}
            {
              <ModuleExtraAttentionItem
                moduleInfo={module}
                onClick={() =>
                  setSecureLabwareModalType(module.moduleDef.moduleType)
                }
              />
            }
          </React.Fragment>
        )
      })}
    </Banner>
  )
}

interface ModuleExtraAttentionItemProps {
  moduleInfo: ModuleRenderInfoForProtocol
  onClick: () => unknown
}

const ModuleExtraAttentionItem = (
  props: ModuleExtraAttentionItemProps
): JSX.Element | null => {
  const { moduleInfo, onClick } = props
  const { t } = useTranslation(['heater_shaker', 'protocol_setup'])
  const { createLiveCommand } = useCreateLiveCommandMutation()

  switch (moduleInfo.moduleDef.moduleType) {
    case MAGNETIC_MODULE_TYPE:
      return (
        <BannerItem
          title={t('module_in_slot', {
            moduleName: moduleInfo.moduleDef.displayName,
            slotName: moduleInfo.slotName,
          })}
          body={t('protocol_setup:magnetic_module_extra_attention')}
          button={
            <TertiaryButton
              data-testid="banner_open_wizard_btn"
              onClick={onClick}
            >
              {t('view_instructions')}
            </TertiaryButton>
          }
        />
      )
    case HEATERSHAKER_MODULE_TYPE:
      if (moduleInfo.attachedModuleMatch !== null) {
        const isLatchClosed =
          moduleInfo.attachedModuleMatch.moduleType ===
            'heaterShakerModuleType' &&
          (moduleInfo.attachedModuleMatch.data.labwareLatchStatus ===
            'idle_closed' ||
            moduleInfo.attachedModuleMatch.data.labwareLatchStatus ===
              'closing')

        const latchCommand:
          | HeaterShakerOpenLatchCreateCommand
          | HeaterShakerCloseLatchCreateCommand = {
          commandType: isLatchClosed
            ? 'heaterShaker/openLabwareLatch'
            : 'heaterShaker/closeLabwareLatch',
          params: { moduleId: moduleInfo.attachedModuleMatch.id },
        }

        const toggleLatch = (): void => {
          createLiveCommand({
            command: latchCommand,
          }).catch((e: Error) => {
            console.error(
              `error setting module status with command type ${latchCommand.commandType}: ${e.message}`
            )
          })
        }
        return (
          <BannerItem
            title={t('module_in_slot', {
              moduleName: moduleInfo.moduleDef.displayName,
              slotName: moduleInfo.slotName,
            })}
            body={t('protocol_setup:heater_shaker_extra_attention')}
            button={
              <TertiaryButton
                data-testid="ModuleExtraAttention_HeaterShakerButton"
                onClick={toggleLatch}
              >
                {isLatchClosed
                  ? t('open_labware_latch')
                  : t('close_labware_latch')}
              </TertiaryButton>
            }
          />
        )
      } else {
        return null
      }
    case THERMOCYCLER_MODULE_TYPE:
      return (
        <BannerItem
          title={t('module_in_slot', {
            moduleName: moduleInfo.moduleDef.displayName,
            slotName: moduleInfo.slotName,
          })}
          body={t(
            moduleInfo.moduleDef.model === THERMOCYCLER_MODULE_V1
              ? 'protocol_setup:thermocycler_extra_attention_gen_1'
              : 'protocol_setup:thermocycler_extra_attention_gen_2'
          )}
          button={
            moduleInfo.moduleDef.model === THERMOCYCLER_MODULE_V1 ? (
              <TertiaryButton
                data-testid="ModuleExtraAttention_ThermocyclerGen1Button"
                onClick={onClick}
              >
                {t('view_instructions')}
              </TertiaryButton>
            ) : null
          }
        />
      )
    default:
      return null
  }
}
