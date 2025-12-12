import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { COLORS, ListItem, StyledText } from '@opentrons/components'

import { InputStepFormField } from '/protocol-designer/components/molecules'
import { getLabwareEntities } from '/protocol-designer/step-forms/selectors'

import styles from './flexstackertools.module.css'
import { MessageField } from './MessageField'

import type { FlexStackerModuleState } from '@opentrons/step-generation'
import type { FieldPropsByName } from '../../types'

interface RefillSettingsProps {
  propsForFields: FieldPropsByName
  moduleState: FlexStackerModuleState | null
}
export function RefillSettings(props: RefillSettingsProps): JSX.Element {
  const { propsForFields, moduleState } = props
  const { t } = useTranslation('form')
  const { storedLabwareDetails } = moduleState ?? {}
  const labwareEntities = useSelector(getLabwareEntities)
  const storedEntityName = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => {
      return labwareDefURI === storedLabwareDetails?.primaryLabwareURI
    }
  )?.def.metadata.displayName

  return (
    <div className={styles.refill_settings_container}>
      {storedLabwareDetails != null ? (
        <div className={styles.selected_labware_container}>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('step_edit_form.flex_stacker.selected_labware')}
          </StyledText>
          <ListItem type="default" className={styles.list_item}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {storedEntityName}
            </StyledText>
            {storedLabwareDetails.lidLabwareURI != null ? (
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.grey60}
              >
                {t('step_edit_form.flex_stacker.with_tiprack_lid', {
                  lidDisplayName: storedLabwareDetails.lidLabwareURI,
                })}
              </StyledText>
            ) : null}
          </ListItem>
        </div>
      ) : null}
      <InputStepFormField
        title={t('step_edit_form.flex_stacker.fields.fillQuantity.title')}
        {...propsForFields.fillQuantity}
        showTooltip={false}
        caption={t('step_edit_form.flex_stacker.fields.fillQuantity.caption')}
        padding="0"
      />
      <MessageField fieldProps={propsForFields.interventionMessage} />
    </div>
  )
}
