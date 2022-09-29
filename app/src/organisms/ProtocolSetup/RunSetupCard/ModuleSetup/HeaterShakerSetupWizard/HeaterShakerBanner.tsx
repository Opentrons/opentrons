import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS } from '@opentrons/components'
import { Divider } from '../../../../../atoms/structure/Divider'
import { TertiaryButton } from '../../../../../atoms/buttons'
import { HeaterShakerWizard } from '../../../../Devices/HeaterShakerWizard'
import { ModuleRenderInfoForProtocol } from '../../../../Devices/hooks'
import { Banner, BannerItem } from '../Banner/Banner'
import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

interface HeaterShakerBannerProps {
  displayName: string
  modules: ModuleRenderInfoForProtocol[]
}

export function HeaterShakerBanner(
  props: HeaterShakerBannerProps
): JSX.Element | null {
  const [wizardId, setWizardId] = React.useState<String | null>(null)
  const { displayName, modules } = props
  const { t } = useTranslation('heater_shaker')

  return (
    <Banner title={t('attach_heater_shaker_to_deck', { name: displayName })}>
      {modules.map((module, index) => (
        <React.Fragment key={index}>
          {wizardId === module.moduleId && (
            <HeaterShakerWizard
              onCloseClick={() => setWizardId(null)}
              moduleFromProtocol={module}
              attachedModule={
                module.attachedModuleMatch != null &&
                module.attachedModuleMatch?.moduleType ===
                  HEATERSHAKER_MODULE_TYPE
                  ? module.attachedModuleMatch
                  : null
              }
            />
          )}
          {index > 0 && <Divider color={COLORS.medGrey} />}
          <BannerItem
            title={t('module_in_slot', {
              moduleName: module.moduleDef.displayName,
              slotName: module.slotName,
            })}
            body={t('improperly_fastened_description')}
            button={
              <TertiaryButton
                data-testid="HeaterShakerBanner_Button"
                onClick={() => setWizardId(module.moduleId)}
              >
                {t('view_instructions')}
              </TertiaryButton>
            }
          />
        </React.Fragment>
      ))}
    </Banner>
  )
}
