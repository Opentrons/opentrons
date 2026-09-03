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
import { BOTTOM_UP_STORED_LABWARE_URI_KEYS } from '@opentrons/step-generation'

import { InputStepFormField } from '/protocol-designer/components/molecules'
import {
  getLabwareEntities,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'
import { uuid } from '/protocol-designer/utils'

import styles from './flexstackertools.module.css'
import { MessageField } from './MessageField'
import { StackerContentItem } from './StackerContentItem'

import type { ReactNode } from 'react'
import type {
  FlexStackerModuleState,
  LabwareEntity,
} from '@opentrons/step-generation'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface RefillSettingsProps {
  formData: FormData
  propsForFields: FieldPropsByName
  moduleState: FlexStackerModuleState | null
  maxPoolCount: number
  isStackerFillEnabled: boolean
  showFormErrors: boolean
}

export function RefillSettings(props: RefillSettingsProps): ReactNode {
  const {
    formData,
    propsForFields,
    moduleState,
    maxPoolCount,
    isStackerFillEnabled,
    showFormErrors,
  } = props
  const { t } = useTranslation('form')
  const { storedLabwareDetails, labwareInHopper } = moduleState ?? {}
  const labwareEntities = useSelector(getLabwareEntities)
  const savedStepForms = useSelector(getSavedStepForms)
  const initialLabwareIds =
    (savedStepForms[formData.id]?.fillLabwareIds as string[]) ?? []
  const [storedAdapterEntity, storedPrimaryEntity, storedLidEntity] =
    BOTTOM_UP_STORED_LABWARE_URI_KEYS.map(lwKey =>
      Object.values(labwareEntities).find(({ labwareDefURI }) => {
        return labwareDefURI === storedLabwareDetails?.[lwKey]
      })
    )
  const nonNullEntities = [
    storedAdapterEntity,
    storedPrimaryEntity,
    storedLidEntity,
  ].filter(entity => entity != null) as LabwareEntity[]
  const numEntitiesInGroup = nonNullEntities.length
  // flooring to be safe in case the lengath does not evenly divide (should not fire)
  if (initialLabwareIds.length % numEntitiesInGroup !== 0) {
    console.warn(
      'initialLabwareIds.length does not evenly divide by numEntitiesInGroup'
    )
  }
  const oldGroupQuantity = Math.floor(
    initialLabwareIds.length / numEntitiesInGroup
  )

  const [fillQuantityLocalState, setFillQuantityState] = useState<
    string | null
    // initialize if saved step form exists
  >(oldGroupQuantity > 0 ? String(oldGroupQuantity) : null)

  const numberOfGroupsInHopper = labwareInHopper?.length ?? 0
  const maxRefillGroupQuantity = maxPoolCount - numberOfGroupsInHopper

  const storedEntityName = storedPrimaryEntity?.def.metadata.displayName
  const isPrimaryTiprack =
    storedPrimaryEntity != null && getIsTiprack(storedPrimaryEntity.def)
  // TODO: figure out a way to not need this use Effect. its hard because
  // you can't rely on generating the uuid in the hydrated form
  useEffect(
    () => {
      const newGroupQuantity = Number(fillQuantityLocalState) ?? 1
      const difference = newGroupQuantity - oldGroupQuantity
      const valueTooHigh = newGroupQuantity > maxRefillGroupQuantity
      // Form errors do not have acccess to module state, so this logic is used
      // to clear out the fillLabwareIds value if the quantity entered is too high
      // and raise an error.
      if (valueTooHigh) {
        propsForFields.fillLabwareIds.updateValue([])
      } else {
        if (difference > 0) {
          const additionalIds = Array.from({ length: difference }, () =>
            nonNullEntities.map(entity => `${uuid()}:${entity.labwareDefURI}`)
          ).flat()
          // ensure we preserve the existing labware IDs, even if a user extensively modifies the quantity up/down
          propsForFields.fillLabwareIds.updateValue([
            ...initialLabwareIds,
            ...additionalIds,
          ])
        } else if (difference < 0) {
          propsForFields.fillLabwareIds.updateValue(
            initialLabwareIds.slice(0, newGroupQuantity * numEntitiesInGroup)
          )
        }
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fillQuantityLocalState, storedPrimaryEntity?.labwareDefURI]
  )

  return (
    <div className={styles.refill_settings_container}>
      <div className={styles.selected_labware_container}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('step_edit_form.flex_stacker.selected_labware')}
        </StyledText>
        {storedLabwareDetails != null ? (
          <div className={styles.selected_labware_container}>
            {storedEntityName != null ? (
              <StackerContentItem
                primaryLabwareName={storedEntityName}
                hasLid={storedLabwareDetails.lidLabwareURI != null}
                isTiprack={isPrimaryTiprack}
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
      </div>

      {storedEntityName != null && (
        <div className={styles.refill_settings_input_container}>
          <InputStepFormField
            title={t('step_edit_form.flex_stacker.fields.fillLabwareIds.title')}
            {...propsForFields.fillLabwareIds}
            showTooltip={false}
            caption={t(
              'step_edit_form.flex_stacker.fields.fillLabwareIds.caption',
              { max: maxRefillGroupQuantity }
            )}
            type="number"
            padding="0"
            setFillQuantityState={setFillQuantityState}
            fillQuantityLocalState={fillQuantityLocalState}
          />
          <MessageField fieldProps={propsForFields.interventionMessage} />
        </div>
      )}

      {showFormErrors && !isStackerFillEnabled ? (
        <InlineNotification
          type="error"
          heading={t('step_edit_form.flex_stacker.stacker_labware_not_defined')}
          message={t('step_edit_form.flex_stacker.no_labware_selected_body')}
        />
      ) : null}
    </div>
  )
}
