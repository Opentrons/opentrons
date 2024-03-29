import * as React from 'react'
import { createPortal } from 'react-dom'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  Flex,
  HandleKeypress,
  Icon,
  InputField,
  OutlineButton,
  RadioGroup,
} from '@opentrons/components'
import { getMainPagePortalEl } from '../../../portals/MainPageModalPortal'
import { getIsTouchTipField } from '../../../../form-types'
import { TipPositionZAxisViz } from './TipPositionZAxisViz'
import * as utils from './utils'
import { LARGE_STEP_MM, SMALL_STEP_MM, TOO_MANY_DECIMALS } from './constants'

import type { StepFieldName } from '../../../../form-types'

import modalStyles from '../../../modals/modal.module.css'
import styles from './TipPositionInput.module.css'

interface Props {
  closeModal: () => void
  isIndeterminate?: boolean
  mmFromBottom: number | null
  name: StepFieldName
  updateValue: (val: number | null | undefined) => unknown
  wellDepthMm: number
}

export const ZTipPositionModal = (props: Props): JSX.Element => {
  const { isIndeterminate, name, wellDepthMm } = props
  const { t } = useTranslation(['modal', 'button'])
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

  const getMinMaxMmFromBottom = (): {
    maxMmFromBottom: number
    minMmFromBottom: number
  } => {
    if (getIsTouchTipField(name)) {
      return {
        maxMmFromBottom: utils.roundValue(wellDepthMm),
        minMmFromBottom: utils.roundValue(wellDepthMm / 2),
      }
    }
    return {
      maxMmFromBottom: utils.roundValue(wellDepthMm * 2),
      minMmFromBottom: 0,
    }
  }
  const { maxMmFromBottom, minMmFromBottom } = getMinMaxMmFromBottom()
  const errors = utils.getErrors({
    isDefault,
    minMm: minMmFromBottom,
    maxMm: maxMmFromBottom,
    value,
  })
  const hasErrors = errors.length > 0
  const hasVisibleErrors = isPristine
    ? errors.includes(TOO_MANY_DECIMALS)
    : hasErrors
  const errorText = utils.getErrorText({
    errors,
    minMm: maxMmFromBottom,
    maxMm: minMmFromBottom,
    isPristine,
    t,
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
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    handleChange(e.currentTarget.value)
  }

  const handleIncrementDecrement = (delta: number): void => {
    const prevValue = value === null ? defaultMmFromBottom : Number(value)
    setIsDefault(false)
    handleChange(utils.roundValue(prevValue + delta))
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
      id={'TipPositionModal_custom_input'}
      isIndeterminate={value === null && isIndeterminate}
      onChange={handleInputFieldChange}
      units="mm"
      value={value !== null ? String(value) : ''}
    />
  )

  return createPortal(
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
          { onClick: handleCancel, children: t('button:cancel') },
          {
            onClick: handleDone,
            children: t('button:done'),
            disabled: hasVisibleErrors,
          },
        ]}
        className={modalStyles.modal}
        contentsClassName={cx(modalStyles.modal_contents)}
        onCloseClick={handleCancel}
      >
        <div className={styles.modal_header}>
          <h4>{t('tip_position.title')}</h4>
          <p>{t(`tip_position.body.${name}`)}</p>
        </div>
        <div className={styles.main_row}>
          <Flex alignItems="flex-start">
            <div>
              <RadioGroup
                value={isDefault ? 'default' : 'custom'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setIsDefault(e.currentTarget.value === 'default')
                }}
                options={[
                  {
                    name: `${defaultMmFromBottom} mm from the bottom (default)`,
                    value: 'default',
                  },
                  {
                    name: 'Custom',
                    value: 'custom',
                  },
                ]}
                name="TipPositionOptions"
              />
              {TipPositionInputField}
            </div>

            <div className={styles.viz_group}>
              {!isDefault && (
                <div className={styles.adjustment_buttons}>
                  <OutlineButton
                    id="Increment_tipPosition"
                    className={styles.adjustment_button}
                    onClick={makeHandleIncrement(SMALL_STEP_MM)}
                  >
                    <Icon name="plus" />
                  </OutlineButton>
                  <OutlineButton
                    id="Decrement_tipPosition"
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
    </HandleKeypress>,
    getMainPagePortalEl()
  )
}
