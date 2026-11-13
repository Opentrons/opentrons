import { useTranslation } from 'react-i18next'

import {
  COLORS,
  Icon,
  RadioButton,
  StyledText,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import {
  FLEX_STACKER_EMPTY,
  FLEX_STACKER_FILL,
  FLEX_STACKER_RETRIEVE,
  FLEX_STACKER_STORE,
} from '/protocol-designer/constants'

import styles from './flexstackertools.module.css'

import type { ReactNode } from 'react'
import type {
  FlexStackerFormType,
  FormData,
} from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface StackerControlsProps {
  formData: FormData
  propsForFields: FieldPropsByName
  isStackerStoreEnabled: boolean
  isStackerRetrieveEnabled: boolean
  isStackerEmptyEnabled: boolean
}

export function StackerControls(props: StackerControlsProps): ReactNode {
  const {
    formData,
    propsForFields,
    isStackerStoreEnabled,
    isStackerRetrieveEnabled,
    isStackerEmptyEnabled,
  } = props
  const { t } = useTranslation('form')
  const [targetProps, tooltipProps] = useHoverTooltip({})
  const handleRadioButtonChange = (value: FlexStackerFormType): void => {
    propsForFields.flexStackerFormType.updateValue(value)
  }

  /// TODO: add preselect functionality
  return (
    <div className={styles.refill_settings_container}>
      <div className={styles.title}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('step_edit_form.flex_stacker.module_controls.title')}
        </StyledText>
        <div {...targetProps}>
          <Icon name="information" size="1rem" color={COLORS.grey60} />
          <Tooltip tooltipProps={tooltipProps}>
            {t('step_edit_form.flex_stacker.module_controls.tooltip')}
          </Tooltip>
        </div>
      </div>
      <div className={styles.radio_button_container}>
        {isStackerStoreEnabled ? (
          <RadioButton
            buttonLabel={t(
              'step_edit_form.flex_stacker.fields.flexStackerFormType.store.title'
            )}
            buttonSubLabel={{
              label: t(
                'step_edit_form.flex_stacker.fields.flexStackerFormType.store.subtext'
              ),
              align: 'vertical',
            }}
            buttonValue={FLEX_STACKER_STORE}
            isSelected={formData.flexStackerFormType === FLEX_STACKER_STORE}
            onChange={() => {
              handleRadioButtonChange(FLEX_STACKER_STORE)
            }}
            largeDesktopBorderRadius
          />
        ) : null}
        {isStackerRetrieveEnabled ? (
          <RadioButton
            buttonLabel={t(
              'step_edit_form.flex_stacker.fields.flexStackerFormType.retrieve.title'
            )}
            buttonSubLabel={{
              label: t(
                'step_edit_form.flex_stacker.fields.flexStackerFormType.retrieve.subtext'
              ),
              align: 'vertical',
            }}
            buttonValue={FLEX_STACKER_RETRIEVE}
            isSelected={formData.flexStackerFormType === FLEX_STACKER_RETRIEVE}
            onChange={() => {
              handleRadioButtonChange(FLEX_STACKER_RETRIEVE)
            }}
            largeDesktopBorderRadius
          />
        ) : null}
        <RadioButton
          buttonLabel={t(
            'step_edit_form.flex_stacker.fields.flexStackerFormType.fill.title'
          )}
          buttonValue={FLEX_STACKER_FILL}
          buttonSubLabel={{
            label: t(
              'step_edit_form.flex_stacker.fields.flexStackerFormType.fill.subtext'
            ),
            align: 'vertical',
          }}
          isSelected={formData.flexStackerFormType === FLEX_STACKER_FILL}
          onChange={() => {
            handleRadioButtonChange(FLEX_STACKER_FILL)
          }}
          largeDesktopBorderRadius
        />
        {isStackerEmptyEnabled ? (
          <RadioButton
            buttonLabel={t(
              'step_edit_form.flex_stacker.fields.flexStackerFormType.empty.title'
            )}
            buttonValue={FLEX_STACKER_EMPTY}
            buttonSubLabel={{
              label: t(
                'step_edit_form.flex_stacker.fields.flexStackerFormType.empty.subtext'
              ),
              align: 'vertical',
            }}
            isSelected={formData.flexStackerFormType === FLEX_STACKER_EMPTY}
            onChange={() => {
              handleRadioButtonChange(FLEX_STACKER_EMPTY)
            }}
            largeDesktopBorderRadius
          />
        ) : null}
      </div>
    </div>
  )
}
