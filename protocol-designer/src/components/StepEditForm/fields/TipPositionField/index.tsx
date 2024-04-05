import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  COLORS,
  Flex,
  FormGroup,
  Icon,
  InputField,
  Tooltip,
  useHoverTooltip,
  UseHoverTooltipTargetProps,
} from '@opentrons/components'
import { getWellsDepth, getWellDimension } from '@opentrons/shared-data'
import {
  getIsTouchTipField,
  getIsDelayPositionField,
} from '../../../../form-types'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { TipPositionModal } from './TipPositionModal'
import { getDefaultMmFromBottom } from './utils'
import { ZTipPositionModal } from './ZTipPositionModal'
import type {
  TipXOffsetFields,
  TipYOffsetFields,
  TipZOffsetFields,
} from '../../../../form-types'
import type { FieldPropsByName } from '../../types'
import type { PositionSpecs } from './TipPositionModal'

import stepFormStyles from '../../StepEditForm.module.css'
import styles from './TipPositionInput.module.css'

interface TipPositionFieldProps {
  propsForFields: FieldPropsByName
  zField: TipZOffsetFields
  xField?: TipXOffsetFields
  yField?: TipYOffsetFields
  labwareId?: string | null
}

export function TipPositionField(props: TipPositionFieldProps): JSX.Element {
  const { labwareId, propsForFields, zField, xField, yField } = props
  const {
    name: zName,
    value: rawZValue,
    updateValue: zUpdateValue,
    tooltipContent,
    isIndeterminate,
    disabled,
  } = propsForFields[zField]

  const { t } = useTranslation('application')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [isModalOpen, setModalOpen] = React.useState<boolean>(false)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const labwareDef =
    labwareId != null && labwareEntities[labwareId] != null
      ? labwareEntities[labwareId].def
      : null

  let wellDepthMm = 0
  let wellXWidthMm = 0
  let wellYWidthMm = 0

  if (labwareDef != null) {
    // NOTE: only taking depth of first well in labware def, UI not currently equipped for multiple depths/widths
    const firstWell = labwareDef.wells.A1
    if (firstWell) {
      wellDepthMm = getWellsDepth(labwareDef, ['A1'])
      wellXWidthMm = getWellDimension(labwareDef, ['A1'], 'x')
      wellYWidthMm = getWellDimension(labwareDef, ['A1'], 'y')
    }
  }

  if (
    (wellDepthMm === 0 || wellXWidthMm === 0 || wellYWidthMm === 0) &&
    labwareId != null &&
    labwareDef != null
  ) {
    console.error(
      `expected to find all well dimensions mm with labwareId ${labwareId} but could not`
    )
  }

  const handleOpen = (has3Specs: boolean): void => {
    if (has3Specs && wellDepthMm && wellXWidthMm && wellYWidthMm) {
      setModalOpen(true)
    }
    if (!has3Specs && wellDepthMm) {
      setModalOpen(true)
    }
  }
  const handleClose = (): void => {
    setModalOpen(false)
  }
  const isTouchTipField = getIsTouchTipField(zName)
  const isDelayPositionField = getIsDelayPositionField(zName)
  let zValue: string | number = '0'
  const mmFromBottom = typeof rawZValue === 'number' ? rawZValue : null
  if (wellDepthMm !== null) {
    // show default value for field in parens if no mmFromBottom value is selected
    zValue =
      mmFromBottom ?? getDefaultMmFromBottom({ name: zName, wellDepthMm })
  }

  let modal = (
    <ZTipPositionModal
      name={zName}
      closeModal={handleClose}
      wellDepthMm={wellDepthMm}
      zValue={mmFromBottom}
      updateValue={zUpdateValue}
      isIndeterminate={isIndeterminate}
    />
  )
  if (yField != null && xField != null) {
    const {
      name: xName,
      value: rawXValue,
      updateValue: xUpdateValue,
    } = propsForFields[xField]
    const {
      name: yName,
      value: rawYValue,
      updateValue: yUpdateValue,
    } = propsForFields[yField]

    const specs: PositionSpecs = {
      z: {
        name: zName,
        value: mmFromBottom,
        updateValue: zUpdateValue,
      },
      x: {
        name: xName,
        value: rawXValue != null ? Number(rawXValue) : null,
        updateValue: xUpdateValue,
      },
      y: {
        name: yName,
        value: rawYValue != null ? Number(rawYValue) : null,
        updateValue: yUpdateValue,
      },
    }

    modal = (
      <TipPositionModal
        closeModal={handleClose}
        wellDepthMm={wellDepthMm}
        wellXWidthMm={wellXWidthMm}
        wellYWidthMm={wellYWidthMm}
        isIndeterminate={isIndeterminate}
        specs={specs}
      />
    )
  }

  return (
    <>
      <Tooltip {...tooltipProps}>{tooltipContent}</Tooltip>
      {isModalOpen ? modal : null}
      <Wrapper
        targetProps={targetProps}
        disabled={disabled}
        isTouchTipField={isTouchTipField}
        isDelayPositionField={isDelayPositionField}
      >
        {yField != null && xField != null ? (
          <Flex
            onClick={disabled != null ? () => handleOpen(true) : () => {}}
            id={`TipPositionIcon_${zName}`}
            data-testid={`TipPositionIcon_${zName}`}
            width="5rem"
          >
            <Icon
              name="ot-calibrate"
              className={styles.tip_position_icon}
              color={disabled ? COLORS.grey30 : COLORS.grey50}
            />
          </Flex>
        ) : (
          <InputField
            disabled={disabled}
            className={stepFormStyles.small_field}
            readOnly
            onClick={() => handleOpen(false)}
            value={String(zValue)}
            isIndeterminate={isIndeterminate}
            units={t('units.millimeter')}
            id={`TipPositionField_${zName}`}
          />
        )}
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
