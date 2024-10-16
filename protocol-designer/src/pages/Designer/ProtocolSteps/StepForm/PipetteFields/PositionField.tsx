import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  ListButton,
  SPACING,
  StyledText,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { getWellsDepth, getWellDimension } from '@opentrons/shared-data'
import { getIsDelayPositionField } from '../../../../../form-types'
import { selectors as stepFormSelectors } from '../../../../../step-forms'
import { TipPositionModal } from '../../../../../components/StepEditForm/fields/TipPositionField/TipPositionModal'
import { getDefaultMmFromBottom } from '../../../../../components/StepEditForm/fields/TipPositionField/utils'
import { ZTipPositionModal } from '../../../../../components/StepEditForm/fields/TipPositionField/ZTipPositionModal'
import type {
  TipXOffsetFields,
  TipYOffsetFields,
  TipZOffsetFields,
} from '../../../../../form-types'
import type { FieldPropsByName } from '../types'
import type { PositionSpecs } from '../../../../../components/StepEditForm/fields/TipPositionField/TipPositionModal'
interface PositionFieldProps {
  prefix: 'aspirate' | 'dispense' | 'mix'
  propsForFields: FieldPropsByName
  zField: TipZOffsetFields
  xField?: TipXOffsetFields
  yField?: TipYOffsetFields
  labwareId?: string | null
}

export function PositionField(props: PositionFieldProps): JSX.Element {
  const { labwareId, propsForFields, zField, xField, yField, prefix } = props
  const {
    name: zName,
    value: rawZValue,
    updateValue: zUpdateValue,
    tooltipContent,
    isIndeterminate,
    disabled,
  } = propsForFields[zField]

  const { t, i18n } = useTranslation(['application', 'protocol_steps'])
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [isModalOpen, setModalOpen] = useState<boolean>(false)
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
      <Tooltip tooltipProps={tooltipProps}>{tooltipContent}</Tooltip>
      {isModalOpen ? modal : null}
      {yField != null && xField != null ? (
        <Flex
          {...targetProps}
          padding={SPACING.spacing16}
          gridGap={SPACING.spacing8}
          flexDirection={DIRECTION_COLUMN}
        >
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {i18n.format(
              t('protocol_steps:tip_position', { prefix }),
              'capitalize'
            )}
          </StyledText>
          <ListButton
            padding={SPACING.spacing12}
            type="noActive"
            onClick={() => {
              handleOpen(true)
            }}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('protocol_steps:well_position')}
              {`${
                propsForFields[xField].value != null
                  ? Number(propsForFields[xField].value)
                  : 0
              }${t('units.millimeter')}, 
                  ${
                    propsForFields[yField].value != null
                      ? Number(propsForFields[yField].value)
                      : 0
                  }${t('units.millimeter')},
                  ${mmFromBottom ?? 0}${t('units.millimeter')}`}
            </StyledText>
          </ListButton>
        </Flex>
      ) : (
        <InputField
          title={
            isDelayPositionField
              ? t('protocol_steps:delay_position')
              : t('protocol_steps:touch_tip_position')
          }
          disabled={disabled}
          readOnly
          onClick={() => {
            handleOpen(false)
          }}
          value={String(zValue)}
          isIndeterminate={isIndeterminate}
          units={t('units.millimeter')}
          id={`TipPositionField_${zName}`}
        />
      )}
    </>
  )
}
