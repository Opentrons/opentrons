import {
  COLORS,
  NewPrimaryBtn,
  SPACING,
  TEXT_TRANSFORM_NONE,
  TYPOGRAPHY,
  Text,
  Flex,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Divider } from '../../../../../atoms/structure/Divider'
import { HeaterShakerWizard } from '../../../../Devices/HeaterShakerWizard'
import { ModuleRenderInfoForProtocol } from '../../../../Devices/hooks'
import { Banner } from '../Banner/Banner'

interface HeaterShakerBannerProps {
  displayName: string
  modules: ModuleRenderInfoForProtocol[]
}

export function HeaterShakerBanner(
  props: HeaterShakerBannerProps
): JSX.Element | null {
  const [showWizard, setShowWizard] = React.useState(false)
  const { displayName, modules } = props
  const { t } = useTranslation('heater_shaker')
  return (
    <Banner title={t('attach_heater_shaker_to_deck', { name: displayName })}>
      {modules.map((module, index) => (
        <React.Fragment key={index}>
          {showWizard && (
            <HeaterShakerWizard
              onCloseClick={() => setShowWizard(false)}
              hasProtocol={true}
              moduleFromProtocol={module}
            />
          )}
          {index > 0 && <Divider color={COLORS.medGrey} />}
          <Text
            fontSize={TYPOGRAPHY.fontSizeP}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={COLORS.darkBlack}
            paddingTop={SPACING.spacing4}
          >
            {t('module_in_slot', {
              moduleName: module.moduleDef.displayName,
              slotName: module.slotName,
            })}
          </Text>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Text
              marginTop={SPACING.spacing3}
              color={COLORS.darkGrey}
              fontSize={TYPOGRAPHY.fontSizeP}
              data-testid={`banner_subtitle_${index}`}
            >
              {t('improperly_fastened_description')}
            </Text>
            <NewPrimaryBtn
              marginLeft={SPACING.spacingXL}
              backgroundColor={COLORS.blue}
              borderRadius={SPACING.spacingM}
              textTransform={TEXT_TRANSFORM_NONE}
              css={TYPOGRAPHY.labelRegular}
              marginBottom={SPACING.spacingXL}
              data-testid={`banner_open_wizard_btn`}
              onClick={() => setShowWizard(true)}
            >
              {t('view_instructions')}
            </NewPrimaryBtn>
          </Flex>
        </React.Fragment>
      ))}
    </Banner>
  )
}
