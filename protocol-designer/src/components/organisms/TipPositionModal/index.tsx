import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Banner,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getMmFromBottom,
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_CENTER,
  POSITION_REFERENCE_TOP,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
} from '@opentrons/shared-data'

import { LINK_BUTTON_STYLE } from '/protocol-designer/components/atoms'
import { getIsTouchTipField } from '/protocol-designer/form-types'

import { getMainPagePortalEl } from '../Portal'
import {
  MoveLiquidPrefixToAction,
  PERCENT_RANGE_TO_SHOW_WARNING,
  TOO_MANY_DECIMALS,
} from './constants'
import { useDefaultPosition, usePositionReference } from './hooks'
import { TipPositionSideView } from './TipPositionSideView'
import { TipPositionTopView } from './TipPositionTopView'
import { getIsTipInWell } from './utils'
import * as utils from './utils'

import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react'
import type { PositionReference } from '@opentrons/shared-data'
import type { FormData, StepFieldName } from '/protocol-designer/form-types'
import type { FieldProps } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/types'
import type { MoveLiquidPrefixType } from '/protocol-designer/resources/types'

type Offset = 'x' | 'y' | 'z'
interface PositionSpec {
  name: StepFieldName
  value: number
  updateValue: (val: number) => void
}
export type PositionSpecs = Record<Offset, PositionSpec>

interface TipPositionModalProps {
  closeModal: () => void
  specs: PositionSpecs
  wellDepthMm: number
  wellXWidthMm: number
  wellYWidthMm: number
  prefix: MoveLiquidPrefixType
  isIndeterminate?: boolean
  reference?: FieldProps | null
  liquidClass?: string | null
  // optional to support batch edit
  formData?: FormData | null
}

export function TipPositionModal(props: TipPositionModalProps): ReactNode {
  const {
    formData = null,
    isIndeterminate,
    specs,
    wellDepthMm,
    wellXWidthMm,
    wellYWidthMm,
    closeModal,
    prefix,
    reference: referenceSpec,
  } = props
  const { t } = useTranslation([
    'modal',
    'button',
    'tooltip',
    'shared',
    'application',
  ])
  const [view, setView] = useState<'top' | 'side'>('side')
  const { z: zSpec, y: ySpec, x: xSpec } = specs

  if (zSpec == null || xSpec == null || ySpec == null) {
    console.error(
      'expected to find specs for one of the positions but could not'
    )
  }

  const defaultMmFromBottom = utils.getDefaultMmFromEdge({
    name: zSpec.name,
  })
  const defaultPosition = useDefaultPosition(formData, prefix)

  const [zValue, setZValue] = useState<string>(
    zSpec?.value == null
      ? String(
          referenceSpec?.value === POSITION_REFERENCE_BOTTOM
            ? defaultMmFromBottom
            : 0
        )
      : String(zSpec?.value)
  )
  const [yValue, setYValue] = useState<string>(
    ySpec?.value == null ? '0' : String(ySpec?.value)
  )
  const [xValue, setXValue] = useState<string>(
    xSpec?.value == null ? '0' : String(xSpec?.value)
  )
  const { positionReferenceDropdown, reference, setReference } =
    usePositionReference({
      initialReference: referenceSpec?.value,
      zValue: Number(zValue),
      updateZValue: setZValue,
      wellDepth: wellDepthMm,
    })

  // submerge/retract in well warning
  const isInWell =
    zValue != null && zValue !== ''
      ? getIsTipInWell(Number(zValue), reference, wellDepthMm)
      : false
  const isSubmergeOrRetract =
    MoveLiquidPrefixToAction[prefix] === 'submerge' ||
    MoveLiquidPrefixToAction[prefix] === 'retract'

  // in this modal, pristinity hides the OUT_OF_BOUNDS error only.
  const [isPristine, setPristine] = useState<boolean>(true)
  const getMinMaxMmFromBottom = (
    reference: PositionReference,
    wellDepth: number
  ): {
    maxMmFromBottom: number
    minMmFromBottom: number
  } => {
    if (getIsTouchTipField(zSpec?.name ?? '')) {
      return {
        maxMmFromBottom: utils.roundValue(wellDepthMm, 'up'),
        minMmFromBottom: utils.roundValue(wellDepthMm / 2, 'up'),
      }
    }
    let [min, max]: [number, number] = [
      0,
      wellDepthMm + SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    ]
    switch (reference) {
      case POSITION_REFERENCE_CENTER:
        ;[min, max] = [
          -wellDepth / 2,
          wellDepth / 2 + SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
        ]
        break
      case POSITION_REFERENCE_TOP:
        ;[min, max] = [-wellDepth, 0 + SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM]
        break
      default:
        break
    }
    return {
      maxMmFromBottom: utils.roundValue(max, 'up'),
      minMmFromBottom: utils.roundValue(min, 'up'),
    }
  }

  const { maxMmFromBottom, minMmFromBottom } = getMinMaxMmFromBottom(
    reference,
    wellDepthMm
  )
  const { minValue: yMinWidth, maxValue: yMaxWidth } =
    utils.getMinMaxWidth(wellYWidthMm)
  const { minValue: xMinWidth, maxValue: xMaxWidth } =
    utils.getMinMaxWidth(wellXWidthMm)

  const createErrors = (
    value: string | null,
    min: number,
    max: number
  ): utils.Error[] => {
    return utils.getErrors({ minMm: min, maxMm: max, value })
  }
  const zErrors = createErrors(zValue, minMmFromBottom, maxMmFromBottom)
  const xErrors = createErrors(xValue, xMinWidth, xMaxWidth)
  const yErrors = createErrors(yValue, yMinWidth, yMaxWidth)

  const hasErrors =
    zErrors.length > 0 || xErrors.length > 0 || yErrors.length > 0
  const hasVisibleErrors = isPristine
    ? zErrors.includes(TOO_MANY_DECIMALS) ||
      xErrors.includes(TOO_MANY_DECIMALS) ||
      yErrors.includes(TOO_MANY_DECIMALS)
    : hasErrors

  const createErrorText = (
    errors: utils.Error[],
    min: number,
    max: number
  ): string | null => {
    return utils.getErrorText({ errors, minMm: min, maxMm: max, isPristine, t })
  }

  const roundedXMin = utils.roundValue(xMinWidth, 'up')
  const roundedYMin = utils.roundValue(yMinWidth, 'up')
  const roundedXMax = utils.roundValue(xMaxWidth, 'down')
  const roundedYMax = utils.roundValue(yMaxWidth, 'down')

  const zErrorText = createErrorText(zErrors, minMmFromBottom, maxMmFromBottom)
  const xErrorText = createErrorText(xErrors, roundedXMin, roundedXMax)
  const yErrorText = createErrorText(yErrors, roundedYMin, roundedYMax)

  const handleDone = (): void => {
    if (!hasErrors) {
      zSpec?.updateValue(Number(zValue))
      xSpec?.updateValue(Number(xValue))
      ySpec?.updateValue(Number(yValue))
      referenceSpec?.updateValue(reference)
      closeModal()
    }
  }

  const handleCancel = (): void => {
    closeModal()
  }

  const handleChange = (
    newValueRaw: string,
    setValue: Dispatch<SetStateAction<string>>
  ): void => {
    // if string, strip non-number characters from string and cast to number
    const newValue =
      typeof newValueRaw === 'string'
        ? newValueRaw.replace(/[^-.0-9]/g, '')
        : String(newValueRaw)

    if (newValue === '.') {
      setValue('0.')
    } else {
      setValue(newValue)
    }
    setPristine(false)
  }

  const handleResetToDefault = (): void => {
    setXValue(String(defaultPosition?.offset?.x ?? 0))
    setYValue(String(defaultPosition?.offset?.y ?? 0))
    setZValue(String(defaultPosition?.offset?.z ?? 0))
    const reference = defaultPosition.origin
    setReference(reference as PositionReference)
  }

  const isXValueNearEdge =
    xValue != null &&
    (parseInt(xValue) > PERCENT_RANGE_TO_SHOW_WARNING * xMaxWidth ||
      parseInt(xValue) < PERCENT_RANGE_TO_SHOW_WARNING * xMinWidth)
  const isYValueNearEdge =
    yValue != null &&
    (parseInt(yValue) > PERCENT_RANGE_TO_SHOW_WARNING * yMaxWidth ||
      parseInt(yValue) < PERCENT_RANGE_TO_SHOW_WARNING * yMinWidth)

  // logic for determining if tip is at bottom based on reference
  const isZValueAtBottom =
    zValue != null
      ? utils.getIsZValueAtBottom(zValue, wellDepthMm, reference)
      : false

  const titleText =
    prefix === 'aspirate' || prefix === 'dispense' || prefix === 'mix'
      ? t('shared:tip_position', { prefix: MoveLiquidPrefixToAction[prefix] })
      : t('shared:start_point', { prefix: MoveLiquidPrefixToAction[prefix] })

  return createPortal(
    <Modal
      type="info"
      width="47rem"
      closeOnOutsideClick
      title={titleText}
      onClose={handleCancel}
      footer={
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing24}
          alignItems={ALIGN_CENTER}
        >
          <Btn onClick={handleResetToDefault} css={LINK_BUTTON_STYLE}>
            {t('shared:reset_to_default')}
          </Btn>
          <Flex gridGap={SPACING.spacing8} justifyContent={JUSTIFY_END}>
            <SecondaryButton onClick={handleCancel}>
              {t('shared:cancel')}
            </SecondaryButton>
            <PrimaryButton onClick={handleDone} disabled={hasVisibleErrors}>
              {t('shared:save')}
            </PrimaryButton>
          </Flex>
        </Flex>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        {isXValueNearEdge || isYValueNearEdge || isZValueAtBottom ? (
          <Banner type="warning">
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('tip_position.warning.close_to_edge')}
            </StyledText>
          </Banner>
        ) : null}
        {isInWell && isSubmergeOrRetract ? (
          <Banner type="warning">
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('tip_position.warning.submerge_retract_in_well.header')}
              </StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('tip_position.warning.submerge_retract_in_well.subtext')}
              </StyledText>
            </Flex>
          </Banner>
        ) : null}
        <Flex gridGap={SPACING.spacing40}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing12}
            width="100%"
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t(`tip_position.body.${zSpec?.name}`)}
            </StyledText>
            {positionReferenceDropdown}
            <InputField
              title={t('tip_position.field_titles.x_position')}
              caption={
                xErrorText == null
                  ? t('tip_position.caption', {
                      min: roundedXMin,
                      max: roundedXMax,
                    })
                  : null
              }
              error={xErrorText}
              id="TipPositionModal_x_custom_input"
              testId="tip-position-modal-x-custom-input"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                handleChange(e.target.value, setXValue)
              }}
              units={t('application:units.millimeter')}
              value={xValue ?? ''}
            />
            <InputField
              tooltipText={t('tooltip:y_position_value')}
              title={t('tip_position.field_titles.y_position')}
              caption={
                yErrorText == null
                  ? t('tip_position.caption', {
                      min: roundedYMin,
                      max: roundedYMax,
                    })
                  : null
              }
              error={yErrorText}
              id="TipPositionModal_y_custom_input"
              testId="tip-position-modal-y-custom-input"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                handleChange(e.target.value, setYValue)
              }}
              units={t('application:units.millimeter')}
              value={yValue ?? ''}
            />
            <InputField
              title={t('tip_position.field_titles.z_position')}
              caption={
                zErrorText == null
                  ? t('tip_position.caption', {
                      min: minMmFromBottom,
                      max: maxMmFromBottom,
                    })
                  : null
              }
              error={zErrorText}
              id="TipPositionModal_z_custom_input"
              testId="tip-position-modal-z-custom-input"
              isIndeterminate={zValue === null && isIndeterminate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                handleChange(e.target.value, setZValue)
              }}
              units={t('application:units.millimeter')}
              value={zValue !== null ? zValue : ''}
            />
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            width="100%"
          >
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {t(`modal:tip_position.view.${view}`)}
              </StyledText>
              <Btn
                color={COLORS.grey60}
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                css={LINK_BUTTON_STYLE}
                onClick={() => {
                  setView(view === 'side' ? 'top' : 'side')
                }}
              >
                {t('shared:swap_view')}
              </Btn>
            </Flex>
            {view === 'side' ? (
              <TipPositionSideView
                mmFromBottom={
                  zValue !== null
                    ? (getMmFromBottom(
                        Number(zValue),
                        reference,
                        wellDepthMm
                      ) ?? defaultMmFromBottom)
                    : defaultMmFromBottom
                }
                wellDepthMm={wellDepthMm}
                xPosition={parseFloat(xValue ?? '0')}
                xWidthMm={wellXWidthMm}
              />
            ) : (
              <TipPositionTopView
                xPosition={parseFloat(xValue ?? '0')}
                xWidthMm={wellXWidthMm}
                yPosition={parseFloat(yValue ?? '0')}
                yWidthMm={wellYWidthMm}
              />
            )}
          </Flex>
        </Flex>
      </Flex>
    </Modal>,
    getMainPagePortalEl()
  )
}
