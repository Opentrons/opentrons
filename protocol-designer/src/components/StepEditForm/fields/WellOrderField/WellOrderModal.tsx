import * as React from 'react'
import { createPortal } from 'react-dom'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { getMainPagePortalEl } from '../../../portals/MainPageModalPortal'
import {
  Modal,
  OutlineButton,
  DeprecatedPrimaryButton,
  FormGroup,
  DropdownField,
} from '@opentrons/components'
import modalStyles from '../../../modals/modal.module.css'

import styles from './WellOrderInput.module.css'
import stepEditStyles from '../../StepEditForm.module.css'
import { WellOrderViz } from './WellOrderViz'
import type { WellOrderOption } from '../../../../form-types'

const DEFAULT_FIRST: WellOrderOption = 't2b'
const DEFAULT_SECOND: WellOrderOption = 'l2r'
const VERTICAL_VALUES: WellOrderOption[] = ['t2b', 'b2t']
const HORIZONTAL_VALUES: WellOrderOption[] = ['l2r', 'r2l']
const WELL_ORDER_VALUES: WellOrderOption[] = [
  ...VERTICAL_VALUES,
  ...HORIZONTAL_VALUES,
]

export interface WellOrderModalProps {
  isOpen: boolean
  closeModal: () => unknown
  prefix: 'aspirate' | 'dispense' | 'mix'
  firstValue?: WellOrderOption | null
  secondValue?: WellOrderOption | null
  firstName: string
  secondName: string
  updateValues: (
    firstValue?: WellOrderOption | null,
    secondValue?: WellOrderOption | null
  ) => void
}

interface State {
  firstValue: WellOrderOption
  secondValue: WellOrderOption
}

export const ResetButton = (props: { onClick: () => void }): JSX.Element => {
  const { t } = useTranslation('button')
  return (
    <OutlineButton
      className={modalStyles.button_medium}
      onClick={props.onClick}
    >
      {t('reset')}
    </OutlineButton>
  )
}

export const CancelButton = (props: { onClick: () => void }): JSX.Element => {
  const { t } = useTranslation('button')

  return (
    <DeprecatedPrimaryButton
      className={cx(
        modalStyles.button_medium,
        modalStyles.button_right_of_break
      )}
      onClick={props.onClick}
    >
      {t('cancel')}
    </DeprecatedPrimaryButton>
  )
}
export const DoneButton = (props: { onClick: () => void }): JSX.Element => {
  const { t } = useTranslation('button')

  return (
    <DeprecatedPrimaryButton
      className={modalStyles.button_medium}
      onClick={props.onClick}
    >
      {t('done')}
    </DeprecatedPrimaryButton>
  )
}

export const WellOrderModal = (
  props: WellOrderModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['form', 'modal'])
  const {
    isOpen,
    closeModal,
    firstName,
    secondName,
    updateValues,
    firstValue,
    secondValue,
  } = props
  const getInitialFirstValues: () => {
    initialFirstValue: WellOrderOption
    initialSecondValue: WellOrderOption
  } = () => {
    if (firstValue == null || secondValue == null) {
      return {
        initialFirstValue: DEFAULT_FIRST,
        initialSecondValue: DEFAULT_SECOND,
      }
    }
    return {
      initialFirstValue: firstValue,
      initialSecondValue: secondValue,
    }
  }

  const [wellOrder, setWellOrder] = React.useState<State>({
    firstValue: DEFAULT_FIRST,
    secondValue: DEFAULT_SECOND,
  })

  React.useEffect(() => {
    if (firstValue != null && secondValue != null) {
      setWellOrder({
        firstValue: firstValue,
        secondValue: secondValue,
      })
    }
  }, [firstValue, secondValue])

  const applyChanges = (): void => {
    updateValues(wellOrder.firstValue, wellOrder.secondValue)
  }

  const handleReset = (): void => {
    setWellOrder({ firstValue: DEFAULT_FIRST, secondValue: DEFAULT_SECOND })
    applyChanges()
    closeModal()
  }

  const handleCancel = (): void => {
    const { initialFirstValue, initialSecondValue } = getInitialFirstValues()
    setWellOrder({
      firstValue: initialFirstValue,
      secondValue: initialSecondValue,
    })
    closeModal()
  }

  const handleDone = (): void => {
    applyChanges()
    closeModal()
  }

  const makeOnChange = (ordinality: 'first' | 'second') => (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const { value } = event.currentTarget
    // @ts-expect-error (ce, 2021-06-22) missing one prop or the other
    let nextState: State = { [`${ordinality}Value`]: value }
    if (ordinality === 'first') {
      if (
        VERTICAL_VALUES.includes(value as WellOrderOption) &&
        VERTICAL_VALUES.includes(wellOrder.secondValue)
      ) {
        nextState = { ...nextState, secondValue: HORIZONTAL_VALUES[0] }
      } else if (
        HORIZONTAL_VALUES.includes(value as WellOrderOption) &&
        HORIZONTAL_VALUES.includes(wellOrder.secondValue)
      ) {
        nextState = { ...nextState, secondValue: VERTICAL_VALUES[0] }
      }
    }
    setWellOrder(nextState)
  }

  const isSecondOptionDisabled = (value: WellOrderOption): boolean => {
    if (VERTICAL_VALUES.includes(wellOrder.firstValue)) {
      return VERTICAL_VALUES.includes(value)
    } else if (HORIZONTAL_VALUES.includes(wellOrder.firstValue)) {
      return HORIZONTAL_VALUES.includes(value)
    } else {
      return false
    }
  }

  if (!isOpen) return null

  return (
    createPortal(
      <Modal
        className={modalStyles.modal}
        contentsClassName={cx(modalStyles.modal_contents)}
        onCloseClick={handleCancel}
      >
        <div className={styles.modal_header}>
          <h4>{t('modal:well_order.title')}</h4>
          <p>{t('modal:well_order.body')}</p>
        </div>
        <div className={styles.main_row}>
          <FormGroup label={t('modal:well_order.field_label')}>
            <div className={styles.field_row}>
              <DropdownField
                name={firstName}
                value={wellOrder.firstValue}
                className={cx(stepEditStyles.field, styles.well_order_dropdown)}
                onChange={makeOnChange('first')}
                options={WELL_ORDER_VALUES.map(value => ({
                  value,
                  name: t(`step_edit_form.field.well_order.option.${value}`),
                }))}
              />
              <span className={styles.field_spacer}>
                {t('modal:well_order.then')}
              </span>
              <DropdownField
                name={secondName}
                value={wellOrder.secondValue}
                className={cx(stepEditStyles.field, styles.well_order_dropdown)}
                onChange={makeOnChange('second')}
                options={WELL_ORDER_VALUES.map(value => ({
                  value,
                  name: t(`step_edit_form.field.well_order.option.${value}`),
                  disabled: isSecondOptionDisabled(value),
                }))}
              />
            </div>
          </FormGroup>
          <FormGroup label={t('well_order.viz_label')}>
            <WellOrderViz
              firstValue={wellOrder.firstValue}
              secondValue={wellOrder.secondValue}
            />
          </FormGroup>
        </div>
        <div className={modalStyles.button_row_divided}>
          <ResetButton onClick={handleReset} />
          <div>
            <CancelButton onClick={handleCancel} />
            <DoneButton onClick={handleDone} />
          </div>
        </div>
      </Modal>,
      getMainPagePortalEl()
    )
  )
}
