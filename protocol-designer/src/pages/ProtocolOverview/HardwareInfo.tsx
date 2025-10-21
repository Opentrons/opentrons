import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  ListItemDescriptor,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getModuleDisplayName,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { LINK_BUTTON_STYLE } from '../../components/atoms'

import type { RobotType } from '@opentrons/shared-data'
import type { AdditionalEquipmentEntities } from '@opentrons/step-generation'
import type { ModuleOnDeck } from '../../step-forms'

interface InstrumentsInfoProps {
  robotType: RobotType
  additionalEquipment: AdditionalEquipmentEntities
  modules: ModuleOnDeck[]
}

export function HardwareInfo({
  robotType,
  additionalEquipment,
  modules,
}: InstrumentsInfoProps): JSX.Element {
  const { t } = useTranslation(['protocol_overview', 'shared'])
  const navigate = useNavigate()
  const isFlex = robotType === FLEX_ROBOT_TYPE
  const tCSlot = isFlex ? 'A1+B1' : '7,8,10,11'
  const additionalEquipmentLength = Object.keys(additionalEquipment).length

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="headingSmallBold">
          {isFlex ? t('shared:deck_hardware') : t('modules')}
        </StyledText>
        <Flex padding={SPACING.spacing4}>
          <Btn
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
            onClick={() => {
              navigate('/hardware')
            }}
            css={LINK_BUTTON_STYLE}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('edit')}
            </StyledText>
          </Btn>
        </Flex>
      </Flex>
      {modules.length > 0 || (additionalEquipmentLength > 0 && isFlex) ? (
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          {modules.map(module => (
            <ListItem type="default" key={`HardwareInfo_${module.id}`}>
              <ListItemDescriptor
                type="large"
                description={
                  <Flex minWidth="13.75rem">
                    <StyledText
                      desktopStyle="bodyDefaultRegular"
                      color={COLORS.grey60}
                    >
                      {module.type === THERMOCYCLER_MODULE_TYPE
                        ? tCSlot
                        : module.slot}
                    </StyledText>
                  </Flex>
                }
                content={
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {getModuleDisplayName(module.model)}
                  </StyledText>
                }
              />
            </ListItem>
          ))}
          {isFlex &&
            Object.values(additionalEquipment).map(ae => (
              <ListItem type="default" key={`ProtocolOverview_${ae.id}`}>
                <ListItemDescriptor
                  type="large"
                  description={
                    <Flex minWidth="13.75rem">
                      <StyledText
                        desktopStyle="bodyDefaultRegular"
                        color={COLORS.grey60}
                      >
                        {ae.location.replace('cutout', '')}
                      </StyledText>
                    </Flex>
                  }
                  content={
                    <StyledText desktopStyle="bodyDefaultRegular">
                      {t(`shared:${ae.name}`)}
                    </StyledText>
                  }
                />
              </ListItem>
            ))}
        </Flex>
      ) : (
        <InfoScreen content={t('no_modules_added')} />
      )}
    </Flex>
  )
}
