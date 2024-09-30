import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { MAGNETIC_MODULE_V1 } from '@opentrons/shared-data'
import {
  MAX_ENGAGE_HEIGHT_V1,
  MAX_ENGAGE_HEIGHT_V2,
  MIN_ENGAGE_HEIGHT_V1,
  MIN_ENGAGE_HEIGHT_V2,
} from '../../../../../../constants'
import { getMagnetLabwareEngageHeight, getMagneticLabwareOptions } from '../../../../../../ui/modules/selectors'
import { ToggleExpandStepFormField } from '../../../../../../molecules'
import { getModuleEntities } from '../../../../../../step-forms/selectors'

import type { StepFormProps } from '../../types'


export function MagnetTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getMagneticLabwareOptions)
  const moduleEntities = useSelector(getModuleEntities)
  const defaultEngageHeight = useSelector(getMagnetLabwareEngageHeight)
  const moduleModel = moduleEntities[formData.moduleId].model
  const engageHeightMinMax =
    moduleModel === MAGNETIC_MODULE_V1
      ? t('magnet_height_caption', {
          low: MIN_ENGAGE_HEIGHT_V1,
          high: MAX_ENGAGE_HEIGHT_V1,
        })
      : t('magnet_height_caption', {
          low: MIN_ENGAGE_HEIGHT_V2,
          high: MAX_ENGAGE_HEIGHT_V2,
        })
  const engageHeightDefault =
    defaultEngageHeight != null
      ? t('magnet_recommended', { default: defaultEngageHeight })
      : ''
  const engageHeightCaption = `${engageHeightMinMax} ${engageHeightDefault} mm.`


  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing16} ${SPACING.spacing12} ${SPACING.spacing16}`}
        gridGap={SPACING.spacing12}
        width="100%"
      >
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('protocol_steps:module')}
        </StyledText>
        <ListItem type="noActive">
          <Flex padding={SPACING.spacing12}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {moduleLabwareOptions[0].name}
            </StyledText>
          </Flex>
        </ListItem>
      </Flex>
      <Box borderBottom={`1px solid ${COLORS.grey30}`} />
      <Flex flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing16}
        >
        <ToggleExpandStepFormField
          {...propsForFields.engageHeight}
          toggleValue={propsForFields.magnetAction.value}
          toggleUpdateValue={propsForFields.magnetAction.updateValue}
          title={t('form:step_edit_form.field.magnetAction.label')}
          fieldTitle={t('protocol_steps:engage_height')}
          isSelected={formData.magnetAction === 'engage'}
          units={t('units.millimeter')}
          onLabel={t('form:step_edit_form.field.magnetAction.options.engage')}
          offLabel={t(
            'form:step_edit_form.field.magnetAction.options.disengage'
          )}
          caption={engageHeightCaption}
        />
      </Flex>
    </Flex>
  )
}
