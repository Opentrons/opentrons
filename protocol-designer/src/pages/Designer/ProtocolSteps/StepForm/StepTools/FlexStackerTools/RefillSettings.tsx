import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { COLORS, StyledText } from '@opentrons/components'
import { getIsTiprack } from '@opentrons/shared-data'

import { InputStepFormField } from '/protocol-designer/components/molecules'
import { getLabwareEntities } from '/protocol-designer/step-forms/selectors'

import styles from './flexstackertools.module.css'
import { MessageField } from './MessageField'
import { StackerContentItem } from './StackerContentItem'

import type { FlexStackerModuleState } from '@opentrons/step-generation'
import type { FieldPropsByName } from '../../types'

interface RefillSettingsProps {
  propsForFields: FieldPropsByName
  moduleState: FlexStackerModuleState | null
  maxPoolCount: number
}

export function RefillSettings(props: RefillSettingsProps): JSX.Element {
  const { propsForFields, moduleState, maxPoolCount } = props
  const { t } = useTranslation('form')
  const { storedLabwareDetails } = moduleState ?? {}
  const labwareEntities = useSelector(getLabwareEntities)
  const storedEntity = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => {
      return labwareDefURI === storedLabwareDetails?.primaryLabwareURI
    }
  )
  const storedEntityName = storedEntity?.def.metadata.displayName
  const isTiprack = storedEntity != null && getIsTiprack(storedEntity.def)
  return (
    <div className={styles.refill_settings_container}>
      {storedLabwareDetails != null ? (
        <div className={styles.selected_labware_container}>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('step_edit_form.flex_stacker.selected_labware')}
          </StyledText>
          {storedEntityName != null ? (
            <StackerContentItem
              primaryLabwareName={storedEntityName}
              hasLid={storedLabwareDetails.lidLabwareURI != null}
              isTiprack={isTiprack}
            />
          ) : null}
        </div>
      ) : null}
      <InputStepFormField
        title={t('step_edit_form.flex_stacker.fields.fillQuantity.title')}
        {...propsForFields.fillQuantity}
        showTooltip={false}
        caption={t('step_edit_form.flex_stacker.fields.fillQuantity.caption', {
          max: maxPoolCount,
        })}
        padding="0"
      />
      <MessageField fieldProps={propsForFields.interventionMessage} />
    </div>
  )
}
