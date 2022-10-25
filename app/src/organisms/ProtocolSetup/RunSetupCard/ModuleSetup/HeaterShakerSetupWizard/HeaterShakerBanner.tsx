import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'
import {
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  Box,
} from '@opentrons/components'
import { Banner } from '../../../../../atoms/Banner'
import { StyledText } from '../../../../../atoms/text'
import { HeaterShakerWizard } from '../../../../Devices/HeaterShakerWizard'
import { ModuleRenderInfoForProtocol } from '../../../../Devices/hooks'

interface HeaterShakerBannerProps {
  modules: ModuleRenderInfoForProtocol[]
}

export function HeaterShakerBanner(
  props: HeaterShakerBannerProps
): JSX.Element | null {
  const [wizardId, setWizardId] = React.useState<String | null>(null)
  const { modules } = props
  const { t } = useTranslation('heater_shaker')

  return (
    <>
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
          <Box marginTop={SPACING.spacing3}>
            <Banner
              type="informing"
              onCloseClick={() => setWizardId(module.moduleId)}
              closeButton={
                <StyledText
                  as="p"
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                >
                  {t('view_instructions')}
                </StyledText>
              }
            >
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText css={TYPOGRAPHY.pSemiBold}>
                  {t('heater_shaker_in_slot', {
                    moduleName: module.moduleDef.displayName,
                    slotName: module.slotName,
                  })}
                </StyledText>
                <StyledText as="p">
                  {t('improperly_fastened_description')}
                </StyledText>
              </Flex>
            </Banner>
          </Box>
        </React.Fragment>
      ))}
    </>
  )
}
