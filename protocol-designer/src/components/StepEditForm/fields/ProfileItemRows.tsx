import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import cx from 'classnames'
import {
  Icon,
  InputField,
  OutlineButton,
  Tooltip,
  useConditionalConfirm,
  useHoverTooltip,
  TOOLTIP_TOP,
  TOOLTIP_TOP_END,
} from '@opentrons/components'
import * as steplistActions from '../../../steplist/actions'
import {
  PROFILE_CYCLE,
  ProfileStepItem,
  ProfileItem,
  ProfileCycleItem,
} from '../../../form-types'
import {
  getProfileFieldErrors,
  maskProfileField,
} from '../../../steplist/fieldLevel'
import {
  ConfirmDeleteModal,
  DELETE_PROFILE_CYCLE,
} from '../../modals/ConfirmDeleteModal'
import { getDynamicFieldFocusHandlerId } from '../utils'
import styles from '../StepEditForm.css'

import { FocusHandlers } from '../types'

export const showProfileFieldErrors = ({
  fieldId,
  focusedField,
  dirtyFields,
}: {
  fieldId: string
  focusedField?: string | null
  dirtyFields: string[]
}): boolean =>
  !(fieldId === focusedField) && dirtyFields && dirtyFields.includes(fieldId)

interface ProfileCycleRowProps {
  cycleItem: ProfileCycleItem
  focusHandlers: FocusHandlers
  stepOffset: number
}
export const ProfileCycleRow = (props: ProfileCycleRowProps): JSX.Element => {
  const { cycleItem, focusHandlers, stepOffset } = props
  const dispatch = useDispatch()
  const { t } = useTranslation(['tooltip', 'application'])
  const addStepToCycle = (): void => {
    dispatch(steplistActions.addProfileStep({ cycleId: cycleItem.id }))
  }

  // TODO IMMEDIATELY make conditional
  const deleteProfileCycle = (): steplistActions.DeleteProfileCycleAction =>
    dispatch(steplistActions.deleteProfileCycle({ id: cycleItem.id }))

  const [
    addStepToCycleTargetProps,
    addStepToCycleTooltipProps,
  ] = useHoverTooltip({
    placement: TOOLTIP_TOP_END,
  })
  const {
    confirm: confirmDeleteCycle,
    showConfirmation: showConfirmDeleteCycle,
    cancel: cancelConfirmDeleteCycle,
  } = useConditionalConfirm(deleteProfileCycle, true)

  const [deleteCycleTargetProps, deleteCycleTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
  })

  return (
    <>
      {showConfirmDeleteCycle && (
        <ConfirmDeleteModal
          modalType={DELETE_PROFILE_CYCLE}
          onContinueClick={confirmDeleteCycle}
          onCancelClick={cancelConfirmDeleteCycle}
        />
      )}

      <div className={styles.profile_cycle_wrapper}>
        <div className={styles.profile_cycle_group}>
          {cycleItem.steps.length > 0 && (
            <div className={styles.cycle_steps}>
              <div className={styles.cycle_row}>
                {cycleItem.steps.map((stepItem, index) => {
                  return (
                    <ProfileStepRow
                      profileStepItem={stepItem}
                      focusHandlers={focusHandlers}
                      key={stepItem.id}
                      stepNumber={stepOffset + index}
                      isCycle
                    />
                  )
                })}
              </div>

              <ProfileField
                name="repetitions"
                focusHandlers={focusHandlers}
                profileItem={cycleItem}
                units={t('application:units.cycles')}
                className={cx(styles.small_field, styles.cycles_field)}
                updateValue={(name, value) =>
                  dispatch(
                    steplistActions.editProfileCycle({
                      id: cycleItem.id,
                      fields: { [name]: value },
                    })
                  )
                }
              />
            </div>
          )}
          <Tooltip {...addStepToCycleTooltipProps}>
            {t('profile.add_step_to_cycle')}
          </Tooltip>
          <div className={styles.add_cycle_step} {...addStepToCycleTargetProps}>
            <OutlineButton onClick={addStepToCycle}>+ Step</OutlineButton>
          </div>
        </div>
        <div onClick={confirmDeleteCycle} {...deleteCycleTargetProps}>
          <Tooltip {...deleteCycleTooltipProps}>
            {t('profile.delete_cycle')}
          </Tooltip>
          <Icon name="close" className={styles.delete_step_icon} />
        </div>
      </div>
    </>
  )
}

export interface ProfileItemRowsProps {
  focusHandlers: FocusHandlers
  orderedProfileItems: string[]
  profileItemsById: {
    [key: string]: ProfileItem
  }
}

export const ProfileItemRows = (props: ProfileItemRowsProps): JSX.Element => {
  const { orderedProfileItems, profileItemsById } = props
  const { t } = useTranslation(['tooltip', 'form'])
  const dispatch = useDispatch()
  const addProfileCycle = (): void => {
    dispatch(steplistActions.addProfileCycle(null))
  }
  const addProfileStep = (): void => {
    dispatch(steplistActions.addProfileStep(null))
  }

  const [addCycleTargetProps, addCycleTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
  })
  const [addStepTargetProps, addStepTooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
  })

  let counter = 0

  const rows = orderedProfileItems.map((itemId, index) => {
    const itemFields: ProfileItem = profileItemsById[itemId]

    if (itemFields.type === PROFILE_CYCLE) {
      const cycleRow = (
        <ProfileCycleRow
          cycleItem={itemFields}
          focusHandlers={props.focusHandlers}
          key={itemId}
          stepOffset={counter + 1}
        />
      )

      counter += itemFields.steps.length

      return cycleRow
    }
    counter++
    return (
      <ProfileStepRow
        profileStepItem={itemFields}
        focusHandlers={props.focusHandlers}
        key={itemId}
        stepNumber={counter}
      />
    )
  })

  return (
    <>
      {rows.length > 0 && (
        <div className={styles.profile_step_labels}>
          <div>Name:</div>
          <div>Temperature:</div>
          <div>Time:</div>
        </div>
      )}
      {rows}
      <Tooltip {...addStepTooltipProps}>{t('profile.add_step')}</Tooltip>
      <Tooltip {...addCycleTooltipProps}>{t('profile.add_cycle')}</Tooltip>
      <div className={styles.profile_button_group}>
        <OutlineButton
          hoverTooltipHandlers={addStepTargetProps}
          onClick={addProfileStep}
        >
          {t('form:step_edit_form.field.thermocyclerProfile.add_step_button')}
        </OutlineButton>
        <OutlineButton
          hoverTooltipHandlers={addCycleTargetProps}
          onClick={addProfileCycle}
        >
          {t('form:step_edit_form.field.thermocyclerProfile.add_cycle_button')}
        </OutlineButton>
      </div>
    </>
  )
}

interface ProfileFieldProps {
  name: string
  focusHandlers: FocusHandlers
  profileItem: ProfileItem
  units?: React.ReactNode
  className?: string
  updateValue: (name: string, value: unknown) => unknown
}
const ProfileField = (props: ProfileFieldProps): JSX.Element => {
  const {
    focusHandlers,
    name,
    profileItem,
    units,
    className,
    updateValue,
  } = props
  const value = profileItem[name as keyof ProfileItem] // this is not very safe but I don't know how else to tell TS that name should be keyof ProfileItem without being a discriminated union
  const fieldId = getDynamicFieldFocusHandlerId({
    id: profileItem.id,
    name,
  })

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.currentTarget.value
    const maskedValue = maskProfileField(name, value)
    updateValue(name, maskedValue)
  }

  const showErrors = showProfileFieldErrors({
    fieldId,
    focusedField: focusHandlers.focusedField,
    dirtyFields: focusHandlers.dirtyFields,
  })
  const errors = getProfileFieldErrors(name, value)
  const errorToShow = showErrors && errors.length > 0 ? errors.join(', ') : null

  const onBlur = (): void => {
    focusHandlers.blur(fieldId)
  }
  const onFocus = (): void => {
    focusHandlers.focus(fieldId)
  }
  return (
    <div className={styles.step_input_wrapper}>
      <InputField
        className={cx(styles.step_input, className)}
        error={errorToShow}
        units={units}
        {...{ name, onChange, onBlur, onFocus, value }}
      />
    </div>
  )
}

interface ProfileStepRowProps {
  focusHandlers: FocusHandlers
  profileStepItem: ProfileStepItem
  stepNumber: number
  isCycle?: boolean | null
}

const ProfileStepRow = (props: ProfileStepRowProps): JSX.Element => {
  const { focusHandlers, profileStepItem, isCycle } = props
  const { t } = useTranslation(['application', 'tooltip'])
  const dispatch = useDispatch()

  const updateStepFieldValue = (name: string, value: unknown): void => {
    dispatch(
      steplistActions.editProfileStep({
        id: profileStepItem.id,
        fields: { [name]: value },
      })
    )
  }

  const deleteProfileStep = (): void => {
    dispatch(steplistActions.deleteProfileStep({ id: profileStepItem.id }))
  }
  const names = [
    'title',
    'temperature',
    'durationMinutes',
    'durationSeconds',
  ] as const
  const units: Record<typeof names[number], string | null> = {
    title: null,
    temperature: t('units.degrees'),
    durationMinutes: t('units.minutes'),
    durationSeconds: t('units.seconds'),
  }
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
  })
  const fields = names.map(name => {
    const className = name === 'title' ? styles.title : styles.profile_field
    return (
      <ProfileField
        key={name}
        units={units[name]}
        className={className}
        {...{
          name,
          focusHandlers,
          profileItem: profileStepItem,
          updateValue: updateStepFieldValue,
        }}
      />
    )
  })
  return (
    <div className={cx(styles.profile_step_row, { [styles.cycle]: isCycle })}>
      <div
        className={cx(styles.profile_step_fields, {
          [styles.profile_cycle_fields]: isCycle,
        })}
      >
        <span className={styles.profile_step_number}>{props.stepNumber}. </span>
        {fields}
      </div>
      <div
        onClick={deleteProfileStep}
        className={cx({ [styles.cycle_step_delete]: isCycle })}
        {...targetProps}
      >
        <Tooltip {...tooltipProps}>{t('tooltip:profile.delete_step')}</Tooltip>
        <Icon name="close" className={styles.delete_step_icon} />
      </div>
    </div>
  )
}
