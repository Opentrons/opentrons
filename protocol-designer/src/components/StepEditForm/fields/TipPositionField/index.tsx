import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  FormGroup,
  InputField,
  Tooltip,
  useHoverTooltip,
  UseHoverTooltipTargetProps,
} from '@opentrons/components'
import { getWellsDepth } from '@opentrons/shared-data'
import {
  getIsTouchTipField,
  getIsDelayPositionField,
} from '../../../../form-types'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { TipPositionModal } from './TipPositionModal'
import { getDefaultMmFromBottom } from './utils'
import stepFormStyles from '../../StepEditForm.module.css'
import styles from './TipPositionInput.module.css'
import type { FieldProps } from '../../types'

interface TipPositionFieldProps extends FieldProps {
  labwareId?: string | null
  className?: string
}

export function TipPositionField(props: TipPositionFieldProps): JSX.Element {
  const {
    disabled,
    name,
    tooltipContent,
    updateValue,
    isIndeterminate,
    labwareId,
  } = props
  const { t } = useTranslation('application')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [isModalOpen, setModalOpen] = React.useState(false)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const labwareDef =
    labwareId != null && labwareEntities[labwareId] != null
      ? labwareEntities[labwareId].def
      : null

  let wellDepthMm = 0
  if (labwareDef != null) {
    // NOTE: only taking depth of first well in labware def, UI not currently equipped for multiple depths
    const firstWell = labwareDef.wells.A1
    if (firstWell) {
      wellDepthMm = getWellsDepth(labwareDef, ['A1'])
    }
  }

  if (wellDepthMm === 0 && labwareId != null && labwareDef != null) {
    console.error(
      `expected to find the well depth mm with labwareId ${labwareId} but could not`
    )
  }

  const handleOpen = (): void => {
    if (wellDepthMm) {
      setModalOpen(true)
    }
  }
  const handleClose = (): void => {
    setModalOpen(false)
  }
  const isTouchTipField = getIsTouchTipField(name)
  const isDelayPositionField = getIsDelayPositionField(name)
  let value: string | number = '0'
  const mmFromBottom = typeof value === 'number' ? value : null
  if (wellDepthMm !== null) {
    // show default value for field in parens if no mmFromBottom value is selected
    value =
      mmFromBottom !== null
        ? mmFromBottom
        : getDefaultMmFromBottom({ name, wellDepthMm })
  }
  return (
    <>
      <Tooltip {...tooltipProps}>{tooltipContent}</Tooltip>
      {isModalOpen && (
        <TipPositionModal
          name={name}
          closeModal={handleClose}
          wellDepthMm={wellDepthMm}
          mmFromBottom={mmFromBottom}
          updateValue={updateValue}
          isIndeterminate={isIndeterminate}
        />
      )}
      <Wrapper
        targetProps={targetProps}
        disabled={disabled}
        isTouchTipField={isTouchTipField}
        isDelayPositionField={isDelayPositionField}
      >
        <InputField
          disabled={disabled}
          className={props.className || stepFormStyles.small_field}
          readOnly
          onClick={handleOpen}
          value={String(value)}
          isIndeterminate={isIndeterminate}
          units={t('units.millimeter')}
          id={`TipPositionField_${name}`}
        />
      </Wrapper>
    </>
  )
}

interface WrapperProps {
  isTouchTipField: boolean
  isDelayPositionField: boolean
  children: React.ReactNode
  disabled: boolean
  targetProps: UseHoverTooltipTargetProps
}

const Wrapper = (props: WrapperProps): JSX.Element => {
  const { t } = useTranslation('form')
  return props.isTouchTipField || props.isDelayPositionField ? (
    <div {...props.targetProps}>{props.children}</div>
  ) : (
    <span {...props.targetProps}>
      <FormGroup
        label={t('step_edit_form.field.tip_position.label')}
        disabled={props.disabled}
        className={styles.well_order_input}
      >
        {props.children}
      </FormGroup>
    </span>
  )
}
