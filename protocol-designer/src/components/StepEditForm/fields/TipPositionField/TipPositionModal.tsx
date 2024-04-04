import * as React from 'react'
import { createPortal } from 'react-dom'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  RadioGroup,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getMainPagePortalEl } from '../../../portals/MainPageModalPortal'
import { getIsTouchTipField } from '../../../../form-types'
import { PDAlert } from '../../../alerts/PDAlert'
import { TOO_MANY_DECIMALS, PERCENT_RANGE_TO_SHOW_WARNING } from './constants'
import { TipPositionAllViz } from './TipPositionAllViz'
import * as utils from './utils'

import styles from './TipPositionInput.module.css'
import modalStyles from '../../../modals/modal.module.css'

import type { StepFieldName } from '../../../../form-types'

type Offset = 'x' | 'y' | 'z'
interface PositionSpec {
  name: StepFieldName
  value: number | null
  updateValue: (val?: number | null) => void
}
export type PositionSpecs = Record<Offset, PositionSpec>

interface TipPositionModalProps {
  closeModal: () => void
  specs: PositionSpecs
  wellDepthMm: number
  wellXWidthMm: number
  wellYWidthMm: number
  isIndeterminate?: boolean
}

export const TipPositionModal = (
  props: TipPositionModalProps
): JSX.Element | null => {
  const {
    isIndeterminate,
    specs,
    wellDepthMm,
    wellXWidthMm,
    wellYWidthMm,
    closeModal,
  } = props
  const zSpec = specs.z
  const ySpec = specs.y
  const xSpec = specs.x

  const { t } = useTranslation(['modal', 'button'])

  if (zSpec == null || xSpec == null || ySpec == null) {
    console.error(
      'expected to find specs for one of the positions but could not'
    )
  }

  const defaultMmFromBottom = utils.getDefaultMmFromBottom({
    name: zSpec.name,
    wellDepthMm,
  })

  const [zValue, setZValue] = React.useState<string | null>(
    zSpec?.value == null ? null : String(zSpec?.value)
  )
  const [yValue, setYValue] = React.useState<string | null>(
    ySpec?.value == null ? null : String(ySpec?.value)
  )
  const [xValue, setXValue] = React.useState<string | null>(
    xSpec?.value == null ? null : String(xSpec?.value)
  )

  const [isDefault, setIsDefault] = React.useState<boolean>(
    !isIndeterminate &&
      zSpec.value === null &&
      ySpec.value === 0 &&
      xSpec.value === 0
  )
  // in this modal, pristinity hides the OUT_OF_BOUNDS error only.
  const [isPristine, setPristine] = React.useState<boolean>(true)

  const getMinMaxMmFromBottom = (): {
    maxMmFromBottom: number
    minMmFromBottom: number
  } => {
    if (getIsTouchTipField(zSpec?.name ?? '')) {
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
  const { minValue: yMinWidth, maxValue: yMaxWidth } = utils.getMinMaxWidth(
    wellYWidthMm
  )
  const { minValue: xMinWidth, maxValue: xMaxWidth } = utils.getMinMaxWidth(
    wellXWidthMm
  )

  const createErrors = (
    value: string | null,
    min: number,
    max: number
  ): utils.Error[] => {
    return utils.getErrors({ isDefault, minMm: min, maxMm: max, value })
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

  const roundedXMin = utils.roundValue(xMinWidth)
  const roundedYMin = utils.roundValue(yMinWidth)
  const roundedXMax = utils.roundValue(xMaxWidth)
  const roundedYMax = utils.roundValue(yMaxWidth)

  const zErrorText = createErrorText(zErrors, minMmFromBottom, maxMmFromBottom)
  const xErrorText = createErrorText(xErrors, roundedXMin, roundedXMax)
  const yErrorText = createErrorText(yErrors, roundedYMin, roundedYMax)

  const handleDone = (): void => {
    setPristine(false)
    if (!hasErrors) {
      if (isDefault) {
        zSpec?.updateValue(null)
        xSpec?.updateValue(0)
        ySpec?.updateValue(0)
      } else {
        zSpec?.updateValue(zValue === null ? null : Number(zValue))
        xSpec?.updateValue(xValue === null ? null : Number(xValue))
        ySpec?.updateValue(yValue === null ? null : Number(yValue))
      }
      closeModal()
    }
  }

  const handleCancel = (): void => {
    closeModal()
  }

  const handleZChange = (newValueRaw: string | number): void => {
    // if string, strip non-number characters from string and cast to number
    const newValue =
      typeof newValueRaw === 'string'
        ? newValueRaw.replace(/[^.0-9]/, '')
        : String(newValueRaw)

    if (newValue === '.') {
      setZValue('0.')
    } else {
      setZValue(Number(newValue) >= 0 ? newValue : '0')
    }
  }

  const handleZInputFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    handleZChange(e.currentTarget.value)
  }

  const handleXChange = (newValueRaw: string | number): void => {
    // if string, strip non-number characters from string and cast to number
    const newValue =
      typeof newValueRaw === 'string'
        ? newValueRaw.replace(/[^-.0-9]/g, '')
        : String(newValueRaw)

    if (newValue === '.') {
      setXValue('0.')
    } else {
      setXValue(newValue)
    }
  }

  const handleXInputFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    handleXChange(e.currentTarget.value)
  }

  const handleYChange = (newValueRaw: string | number): void => {
    // if string, strip non-number characters from string and cast to number
    const newValue =
      typeof newValueRaw === 'string'
        ? newValueRaw.replace(/[^-.0-9]/g, '')
        : String(newValueRaw)

    if (newValue === '.') {
      setYValue('0.')
    } else {
      setYValue(newValue)
    }
  }

  const handleYInputFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    handleYChange(e.currentTarget.value)
  }
  const isXValueNearEdge =
    xValue != null &&
    (parseInt(xValue) > PERCENT_RANGE_TO_SHOW_WARNING * xMaxWidth ||
      parseInt(xValue) < PERCENT_RANGE_TO_SHOW_WARNING * xMinWidth)
  const isYValueNearEdge =
    yValue != null &&
    (parseInt(yValue) > PERCENT_RANGE_TO_SHOW_WARNING * yMaxWidth ||
      parseInt(yValue) < PERCENT_RANGE_TO_SHOW_WARNING * yMinWidth)

  const TipPositionInputField = !isDefault ? (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText as="label" paddingLeft={SPACING.spacing24}>
          {t('tip_position.field_titles.x_position')}
        </StyledText>
        <InputField
          caption={t('tip_position.caption', {
            min: roundedXMin,
            max: roundedXMax,
          })}
          error={xErrorText}
          className={styles.position_from_bottom_input}
          id="TipPositionModal_x_custom_input"
          onChange={handleXInputFieldChange}
          units="mm"
          value={xValue ?? ''}
        />
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText as="label" paddingLeft={SPACING.spacing24}>
          {t('tip_position.field_titles.y_position')}
        </StyledText>
        <InputField
          caption={t('tip_position.caption', {
            min: roundedYMin,
            max: roundedYMax,
          })}
          error={yErrorText}
          className={styles.position_from_bottom_input}
          id="TipPositionModal_y_custom_input"
          onChange={handleYInputFieldChange}
          units="mm"
          value={yValue ?? ''}
        />
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText as="label" paddingLeft={SPACING.spacing24}>
          {t('tip_position.field_titles.z_position')}
        </StyledText>
        <InputField
          caption={t('tip_position.caption', {
            min: minMmFromBottom,
            max: maxMmFromBottom,
          })}
          error={zErrorText}
          className={styles.position_from_bottom_input}
          id="TipPositionModal_z_custom_input"
          isIndeterminate={zValue === null && isIndeterminate}
          onChange={handleZInputFieldChange}
          units="mm"
          value={zValue !== null ? zValue : ''}
        />
      </Flex>
    </Flex>
  ) : null

  // Mix Form's asp/disp tip position field has different default value text
  const isMixAspDispField = zSpec?.name === 'mix_mmFromBottom'

  return createPortal(
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
        <p>{t(`tip_position.body.${zSpec?.name}`)}</p>
      </div>

      {(isXValueNearEdge || isYValueNearEdge) && !isDefault ? (
        <Flex marginTop={SPACING.spacing8}>
          <PDAlert
            alertType="warning"
            title=""
            description={t('tip_position.warning')}
          />
        </Flex>
      ) : null}

      <div className={styles.main_row}>
        <Flex alignItems="flex-start">
          <Flex flexDirection={DIRECTION_COLUMN}>
            <RadioGroup
              value={isDefault ? 'default' : 'custom'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setIsDefault(e.currentTarget.value === 'default')
              }}
              options={[
                {
                  name: isMixAspDispField
                    ? t('tip_position.radio_button.mix')
                    : t('tip_position.radio_button.default', {
                        defaultMmFromBottom,
                      }),
                  value: 'default',
                },
                {
                  name: t('tip_position.radio_button.custom'),
                  value: 'custom',
                },
              ]}
              name="TipPositionOptions"
            />
            {TipPositionInputField}
          </Flex>

          <div className={styles.viz_group}>
            <TipPositionAllViz
              mmFromBottom={
                zValue !== null ? Number(zValue) : defaultMmFromBottom
              }
              wellDepthMm={wellDepthMm}
              xPosition={parseInt(xValue ?? '0')}
              xWidthMm={wellXWidthMm}
            />
          </div>
        </Flex>
      </div>
    </AlertModal>,
    getMainPagePortalEl()
  )
}
