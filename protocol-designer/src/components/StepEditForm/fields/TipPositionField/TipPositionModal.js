// @flow
import * as React from 'react'
import cx from 'classnames'
import round from 'lodash/round'
import {
  AlertModal,
  Flex,
  HandleKeypress,
  Icon,
  InputField,
  OutlineButton,
  RadioGroup,
} from '@opentrons/components'
import { i18n } from '../../../../localization'
import { Portal } from '../../../portals/MainPageModalPortal'
import modalStyles from '../../../modals/modal.css'
import { TipPositionZAxisViz } from './TipPositionZAxisViz'

import styles from './TipPositionInput.css'
import * as utils from './utils'
import { getIsTouchTipField, type StepFieldName } from '../../../../form-types'

const SMALL_STEP_MM = 1
const LARGE_STEP_MM = 10
const DECIMALS_ALLOWED = 1

type Props = {|
  closeModal: () => mixed,
  isIndeterminate?: boolean,
  mmFromBottom: number | null,
  name: StepFieldName,
  updateValue: (?number) => mixed,
  wellDepthMm: number,
|}

const roundValue = (value: number | string | null): number => {
  return round(Number(value), DECIMALS_ALLOWED)
}

const TOO_MANY_DECIMALS: 'TOO_MANY_DECIMALS' = 'TOO_MANY_DECIMALS'
const OUT_OF_BOUNDS: 'OUT_OF_BOUNDS' = 'OUT_OF_BOUNDS'
type Error = typeof TOO_MANY_DECIMALS | typeof OUT_OF_BOUNDS

const getErrorText = (args: {|
  errors: Array<Error>,
  maxMmFromBottom: number,
  minMmFromBottom: number,
  isPristine: boolean,
|}): string | null => {
  const { errors, minMmFromBottom, maxMmFromBottom, isPristine } = args

  if (errors.includes(TOO_MANY_DECIMALS)) {
    return i18n.t('modal.tip_position.errors.TOO_MANY_DECIMALS')
  } else if (!isPristine && errors.includes(OUT_OF_BOUNDS)) {
    return i18n.t('modal.tip_position.errors.OUT_OF_BOUNDS', {
      minMmFromBottom,
      maxMmFromBottom,
    })
  } else {
    return null
  }
}

const getErrors = (args: {|
  isDefault: boolean,
  value: string | null,
  maxMmFromBottom: number,
  minMmFromBottom: number,
|}): Array<Error> => {
  const { isDefault, value, maxMmFromBottom, minMmFromBottom } = args
  const errors = []
  if (isDefault) return errors

  const v = Number(value)
  if (value === null || Number.isNaN(v)) {
    // blank or otherwise invalid should show this error as a fallback
    return [OUT_OF_BOUNDS]
  }
  const correctDecimals = round(v, DECIMALS_ALLOWED) === v
  const outOfBounds = v > maxMmFromBottom || v < minMmFromBottom

  if (!correctDecimals) {
    errors.push(TOO_MANY_DECIMALS)
  }
  if (outOfBounds) {
    errors.push(OUT_OF_BOUNDS)
  }
  return errors
}

export const TipPositionModal = (props: Props): React.Node => {
  const { isIndeterminate, name, wellDepthMm } = props

  const defaultMmFromBottom = utils.getDefaultMmFromBottom({
    name,
    wellDepthMm,
  })

  const [value, setValue] = React.useState<string | null>(
    props.mmFromBottom === null ? null : String(props.mmFromBottom)
  )
  const [isDefault, setIsDefault] = React.useState<boolean>(
    !isIndeterminate && props.mmFromBottom === null
  )
  // in this modal, pristinity hides the OUT_OF_BOUNDS error only.
  const [isPristine, setPristine] = React.useState<boolean>(true)

  const getMinMaxMmFromBottom = (): {|
    maxMmFromBottom: number,
    minMmFromBottom: number,
  |} => {
    if (getIsTouchTipField(name)) {
      return {
        maxMmFromBottom: roundValue(wellDepthMm),
        minMmFromBottom: roundValue(wellDepthMm / 2),
      }
    }
    return {
      maxMmFromBottom: roundValue(wellDepthMm * 2),
      minMmFromBottom: 0,
    }
  }
  const { maxMmFromBottom, minMmFromBottom } = getMinMaxMmFromBottom()
  const errors = getErrors({
    isDefault,
    minMmFromBottom,
    maxMmFromBottom,
    value,
  })
  const hasErrors = errors.length > 0
  const hasVisibleErrors = isPristine
    ? errors.includes(TOO_MANY_DECIMALS)
    : hasErrors
  const errorText = getErrorText({
    errors,
    maxMmFromBottom,
    minMmFromBottom,
    isPristine,
  })

  const handleDone = (): void => {
    setPristine(false)

    if (!hasErrors) {
      if (isDefault) {
        props.updateValue(null)
      } else {
        props.updateValue(value === null ? null : Number(value))
      }
      props.closeModal()
    }
  }

  const handleCancel = (): void => {
    props.closeModal()
  }

  const handleChange = (newValueRaw: string | number): void => {
    // if string, strip non-number characters from string and cast to number
    const newValue =
      typeof newValueRaw === 'string'
        ? newValueRaw.replace(/[^.0-9]/, '')
        : String(newValueRaw)

    if (newValue === '.') {
      setValue('0.')
    } else {
      setValue(Number(newValue) >= 0 ? newValue : '0')
    }
  }

  const handleInputFieldChange = (
    e: SyntheticEvent<HTMLInputElement>
  ): void => {
    handleChange(e.currentTarget.value)
  }

  const handleIncrementDecrement = (delta: number): void => {
    const prevValue = value === null ? defaultMmFromBottom : Number(value)
    setIsDefault(false)
    handleChange(roundValue(prevValue + delta))
  }

  const makeHandleIncrement = (step: number): (() => void) => () => {
    handleIncrementDecrement(step)
  }

  const makeHandleDecrement = (step: number): (() => void) => () => {
    handleIncrementDecrement(step * -1)
  }

  const TipPositionInputField = !isDefault && (
    <InputField
      caption={`between ${minMmFromBottom} and ${maxMmFromBottom}`}
      className={styles.position_from_bottom_input}
      error={errorText}
      isIndeterminate={value === null && isIndeterminate}
      onChange={handleInputFieldChange}
      units="mm"
      value={value !== null ? String(value) : ''}
    />
  )

  // Mix Form's asp/disp tip position field has different default value text
  const isMixAspDispField = name === 'mix_mmFromBottom'

  return (
    <Portal>
      <HandleKeypress
        preventDefault
        handlers={[
          {
            key: 'ArrowUp',
            shiftKey: false,
            onPress: makeHandleIncrement(SMALL_STEP_MM),
          },
          {
            key: 'ArrowUp',
            shiftKey: true,
            onPress: makeHandleIncrement(LARGE_STEP_MM),
          },
          {
            key: 'ArrowDown',
            shiftKey: false,
            onPress: makeHandleDecrement(SMALL_STEP_MM),
          },
          {
            key: 'ArrowDown',
            shiftKey: true,
            onPress: makeHandleDecrement(LARGE_STEP_MM),
          },
        ]}
      >
        <AlertModal
          alertOverlay
          buttons={[
            { onClick: handleCancel, children: i18n.t('button.cancel') },
            {
              onClick: handleDone,
              children: i18n.t('button.done'),
              disabled: hasVisibleErrors,
            },
          ]}
          className={modalStyles.modal}
          contentsClassName={cx(modalStyles.modal_contents)}
          onCloseClick={handleCancel}
        >
          <div className={styles.modal_header}>
            <h4>{i18n.t('modal.tip_position.title')}</h4>
            <p>{i18n.t(`modal.tip_position.body.${name}`)}</p>
          </div>
          <div className={styles.main_row}>
            <Flex alignItems="flex-start">
              <div>
                <RadioGroup
                  value={isDefault ? 'default' : 'custom'}
                  onChange={e => {
                    setIsDefault(e.currentTarget.value === 'default')
                  }}
                  options={[
                    {
                      name: isMixAspDispField
                        ? `Aspirate 1mm, Dispense 0.5mm from the bottom (default)`
                        : `${defaultMmFromBottom} mm from the bottom (default)`,
                      value: 'default',
                    },
                    {
                      name: 'Custom',
                      value: 'custom',
                    },
                  ]}
                />
                {TipPositionInputField}
              </div>

              <div className={styles.viz_group}>
                {!isDefault && (
                  <div className={styles.adjustment_buttons}>
                    <OutlineButton
                      className={styles.adjustment_button}
                      onClick={makeHandleIncrement(SMALL_STEP_MM)}
                    >
                      <Icon name="plus" />
                    </OutlineButton>
                    <OutlineButton
                      className={styles.adjustment_button}
                      onClick={makeHandleDecrement(SMALL_STEP_MM)}
                    >
                      <Icon name="minus" />
                    </OutlineButton>
                  </div>
                )}
                <TipPositionZAxisViz
                  mmFromBottom={
                    value !== null ? Number(value) : defaultMmFromBottom
                  }
                  wellDepthMm={wellDepthMm}
                />
              </div>
            </Flex>
          </div>
        </AlertModal>
      </HandleKeypress>
    </Portal>
  )
}
