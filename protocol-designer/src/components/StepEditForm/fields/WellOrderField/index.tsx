import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  FormGroup,
  Text,
  Tooltip,
  useHoverTooltip,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_BODY_1,
  C_LIGHT_GRAY,
} from '@opentrons/components'
import cx from 'classnames'
import ZIG_ZAG_IMAGE from '../../../../images/zig_zag_icon.svg'
import { WellOrderModal } from './WellOrderModal'
import stepEditStyles from '../../StepEditForm.module.css'
import styles from './WellOrderInput.module.css'
import { FieldProps } from '../../types'
import { WellOrderOption } from '../../../../form-types'

export interface WellOrderFieldProps {
  className?: string | null
  label?: string
  prefix: 'aspirate' | 'dispense' | 'mix'
  firstValue?: WellOrderOption | null
  secondValue?: WellOrderOption | null
  firstName: string
  secondName: string
  updateFirstWellOrder: FieldProps['updateValue']
  updateSecondWellOrder: FieldProps['updateValue']
}

export const WellOrderField = (props: WellOrderFieldProps): JSX.Element => {
  const {
    firstValue,
    secondValue,
    firstName,
    secondName,
    updateFirstWellOrder,
    updateSecondWellOrder,
  } = props
  const { t } = useTranslation(['form', 'modal'])
  const [isModalOpen, setModalOpen] = React.useState(false)

  const handleOpen = (): void => {
    setModalOpen(true)
  }
  const handleClose = (): void => {
    setModalOpen(false)
  }

  const updateValues = (firstValue: unknown, secondValue: unknown): void => {
    updateFirstWellOrder(firstValue)
    updateSecondWellOrder(secondValue)
  }

  const getIconClassNames = (): string[] => {
    const iconClassNames = []
    if (firstValue) {
      iconClassNames.push(styles[`${firstValue}_first`])
    }
    if (secondValue) {
      iconClassNames.push(styles[`${secondValue}_second`])
    }
    return iconClassNames
  }

  const [targetProps, tooltipProps] = useHoverTooltip()

  const className = cx(props.className, {
    [styles.small_field]: !props.label,
    [stepEditStyles.no_label]: !props.label,
  })

  const mixedWellOrderStyles = css`
    font-weight: ${FONT_WEIGHT_SEMIBOLD};
    font-size: ${FONT_SIZE_BODY_1};
    padding-top: 0.5rem;
    padding-bottom: 0.325rem;

    &:hover {
      background-color: ${C_LIGHT_GRAY};
    }
  `

  return (
    <>
      <Tooltip {...tooltipProps}>
        {t('step_edit_form.field.well_order.label')}
      </Tooltip>
      <div {...targetProps}>
        <FormGroup label={props.label} className={className}>
          {firstValue != null && secondValue != null ? (
            <img
              onClick={handleOpen}
              src={ZIG_ZAG_IMAGE}
              className={cx(
                styles.well_order_icon,
                // @ts-expect-error(sa, 2021-6-22): I think props.label needs to be casted to a boolean first
                { [styles.icon_with_label]: props.label },
                getIconClassNames()
              )}
              id={`WellOrderField_button_${props.prefix}`}
              data-test={`WellOrderField_button_${String(firstValue)}_${String(
                secondValue
              )}`}
            />
          ) : (
            <Text
              onClick={handleOpen}
              css={mixedWellOrderStyles}
              id={`WellOrderField_button_${props.prefix}`}
              data-test={`WellOrderField_button_${String(firstValue)}_${String(
                secondValue
              )}`}
            >
              {t('step_edit_form.field.well_order.mixed')}
            </Text>
          )}
        </FormGroup>
      </div>
      <WellOrderModal
        prefix={props.prefix}
        closeModal={handleClose}
        isOpen={isModalOpen}
        updateValues={updateValues}
        firstValue={firstValue}
        secondValue={secondValue}
        firstName={firstName}
        secondName={secondName}
      />
    </>
  )
}
