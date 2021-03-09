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

type OP = {|
  closeModal: () => mixed,
  mmFromBottom: number | null,
  name: StepFieldName,
  wellDepthMm: number,
|}

type DP = {| updateValue: (?number) => mixed |}

type Props = { ...OP, ...DP }

const roundValue = (value: number | string | null): number => {
  return round(Number(value), DECIMALS_ALLOWED)
}

export const TipPositionModal = (props: Props): React.Node => {
  const { wellDepthMm } = props
  const defaultMmFromBottom = utils.getDefaultMmFromBottom({
    name: props.name,
    wellDepthMm,
  })

  const [value, setValue] = React.useState<string | null>(
    props.mmFromBottom === null ? null : String(props.mmFromBottom)
  )
  const [isDefault, setIsDefault] = React.useState<boolean>(
    props.mmFromBottom === null
  )
  const [pristine, setPristine] = React.useState<boolean>(true)

  const getMinMaxMmFromBottom = (): {|
    maxMmFromBottom: number,
    minMmFromBottom: number,
  |} => {
    if (getIsTouchTipField(props.name)) {
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

  const getErrors = (): string | null => {
    let errors = null
    if (isDefault) return errors

    const v = Number(value)
    const correctDecimals = round(v, DECIMALS_ALLOWED) === v
    const outOfBounds = v > maxMmFromBottom || v < minMmFromBottom

    // TODO IMMEDIATELY: use i18n
    if (!correctDecimals) {
      errors = 'a max of 1 decimal place is allowed'
    }
    if (outOfBounds) {
      errors = `accepted range is ${minMmFromBottom} to ${maxMmFromBottom}`
    }
    return errors
  }

  const handleDone = (): void => {
    if (pristine && getErrors()) {
      setPristine(false)
    } else {
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

    setValue(Number(newValue) > 0 ? newValue : '0')
  }

  const handleInputFieldChange = (
    e: SyntheticEvent<HTMLInputElement>
  ): void => {
    handleChange(e.currentTarget.value)
  }

  const handleIncrementDecrement = (delta: number): void => {
    const prevValue = value === null ? defaultMmFromBottom : Number(value)

    handleChange(prevValue + delta)
  }

  const makeHandleIncrement = (step: number): (() => void) => () => {
    handleIncrementDecrement(step)
  }

  const makeHandleDecrement = (step: number): (() => void) => () => {
    handleIncrementDecrement(step * -1)
  }

  const TipPositionInput = !isDefault && (
    <InputField
      className={styles.position_from_bottom_input}
      onChange={handleInputFieldChange}
      units="mm"
      caption={`between ${minMmFromBottom} and ${maxMmFromBottom}`}
      error={pristine ? null : getErrors()}
      value={value !== null ? String(value) : ''}
    />
  )

  return (
    <Portal>
      {/* TODO IMMEDIATELY remove this keypress thing?? */}
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
              disabled: !pristine && Boolean(getErrors()),
            },
          ]}
          className={modalStyles.modal}
          contentsClassName={cx(modalStyles.modal_contents)}
          onCloseClick={handleCancel}
        >
          <div className={styles.modal_header}>
            <h4>{i18n.t('modal.tip_position.title')}</h4>
            <p>{i18n.t(`modal.tip_position.body.${props.name}`)}</p>
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
                      name: `${defaultMmFromBottom} mm from the bottom (default)`,
                      value: 'default',
                    },
                    {
                      name: 'Custom',
                      value: 'custom',
                    },
                  ]}
                />
                {TipPositionInput}
              </div>

              <div className={styles.viz_group}>
                {!isDefault && (
                  <div className={styles.adjustment_buttons}>
                    <OutlineButton
                      className={styles.adjustment_button}
                      disabled={
                        value !== null && Number(value) >= maxMmFromBottom
                      }
                      onClick={makeHandleIncrement(SMALL_STEP_MM)}
                    >
                      <Icon name="plus" />
                    </OutlineButton>
                    <OutlineButton
                      className={styles.adjustment_button}
                      disabled={
                        value !== null && Number(value) <= minMmFromBottom
                      }
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
