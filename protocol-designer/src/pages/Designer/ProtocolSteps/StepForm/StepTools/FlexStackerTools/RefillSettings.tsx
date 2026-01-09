import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  InlineNotification,
  ListItem,
  StyledText,
} from '@opentrons/components'
import { getIsTiprack } from '@opentrons/shared-data'

import { InputStepFormField } from '/protocol-designer/components/molecules'
import {
  getLabwareEntities,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'
import { uuid } from '/protocol-designer/utils'

import styles from './flexstackertools.module.css'
import { MessageField } from './MessageField'
import { StackerContentItem } from './StackerContentItem'

import type { FlexStackerModuleState } from '@opentrons/step-generation'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface RefillSettingsProps {
  formData: FormData
  propsForFields: FieldPropsByName
  moduleState: FlexStackerModuleState | null
  maxPoolCount: number
}

export function RefillSettings(props: RefillSettingsProps): JSX.Element {
  const { formData, propsForFields, moduleState, maxPoolCount } = props
  const { t } = useTranslation('form')
  const { storedLabwareDetails } = moduleState ?? {}
  const labwareEntities = useSelector(getLabwareEntities)
  const savedStepForms = useSelector(getSavedStepForms)
  const initialLabwareIds =
    (savedStepForms[formData.id]?.fillLabwareIds as string[]) ?? []
  const oldFillQuantity = initialLabwareIds.length
  const [fillQuantityLocalState, setFillQuantityState] = useState<
    string | null
    // initialize if saved step form exists
  >(initialLabwareIds.length > 0 ? String(initialLabwareIds.length) : null)
  const storedEntity = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => {
      return labwareDefURI === storedLabwareDetails?.primaryLabwareURI
    }
  )

  const storedEntityName = storedEntity?.def.metadata.displayName
  const isTiprack = storedEntity != null && getIsTiprack(storedEntity.def)
  // TODO: figure out a way to not need this use Effect. its hard because
  // you can't rely on generating the uuid in the hydrated form
  useEffect(() => {
    const quantity = Number(fillQuantityLocalState) ?? 1
    const difference = quantity - oldFillQuantity
    if (difference > 0) {
      const additionalIds = Array.from(
        { length: difference },
        () => `${uuid()}:${storedEntity?.labwareDefURI}`
      )
      // ensure we preserve the existing labware IDs, even if a user extensively modifies the quantity up/down
      propsForFields.fillLabwareIds.updateValue([
        ...initialLabwareIds,
        ...additionalIds,
      ])
    } else if (difference < 0) {
      propsForFields.fillLabwareIds.updateValue(
        initialLabwareIds.slice(0, quantity)
      )
    }
  }, [fillQuantityLocalState, storedEntity?.labwareDefURI])

  return (
    <div className={styles.refill_settings_container}>
      <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
        {t('step_edit_form.flex_stacker.selected_labware')}
      </StyledText>
      {storedLabwareDetails != null ? (
        <div className={styles.selected_labware_container}>
          {storedEntityName != null ? (
            <StackerContentItem
              primaryLabwareName={storedEntityName}
              hasLid={storedLabwareDetails.lidLabwareURI != null}
              isTiprack={isTiprack}
            />
          ) : null}
        </div>
      ) : (
        <ListItem type="default" className={styles.list_item}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('step_edit_form.flex_stacker.no_labware_selected')}
          </StyledText>
        </ListItem>
      )}

      {storedEntityName != null && (
        <div>
          <InputStepFormField
            title={t('step_edit_form.flex_stacker.fields.fillLabwareIds.title')}
            {...propsForFields.fillLabwareIds}
            showTooltip={false}
            caption={t(
              'step_edit_form.flex_stacker.fields.fillLabwareIds.caption',
              { max: maxPoolCount }
            )}
            type="number"
            padding="0"
            setFillQuantityState={setFillQuantityState}
            fillQuantityLocalState={fillQuantityLocalState}
          />
          <MessageField fieldProps={propsForFields.interventionMessage} />
        </div>
      )}

      {storedLabwareDetails == null ? (
        <InlineNotification
          type="error"
          heading={t('step_edit_form.flex_stacker.stacker_labware_not_defined')}
          message={t('step_edit_form.flex_stacker.no_labware_selected_body')}
        />
      ) : null}
    </div>
  )
}
