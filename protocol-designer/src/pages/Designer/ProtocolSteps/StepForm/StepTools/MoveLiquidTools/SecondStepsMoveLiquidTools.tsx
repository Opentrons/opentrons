import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import Plot from 'react-plotly'
import { useSelector } from 'react-redux'
import { round } from 'lodash'

import {
  ALIGN_CENTER,
  Chip,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  FLEX_MIN_CONTENT,
  JUSTIFY_FLEX_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  Tabs,
} from '@opentrons/components'
import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  getMaxPushOutVolume,
  getMinXYDimension,
  NONE_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'
import { getTrashOrLabware } from '@opentrons/step-generation'

import {
  CheckboxExpandStepFormField,
  InputStepFormField,
  ToggleStepFormField,
} from '../../../../../../components/molecules'
import { getMainPagePortalEl } from '../../../../../../components/organisms'
import { ResetSettingsModal } from '../../../../../../components/organisms/ResetSettingsModal'
import { getRobotType } from '../../../../../../file-data/selectors'
import {
  getAdditionalEquipmentEntities,
  getInvariantContext,
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import { updateFieldsForLiquidClass } from '../../../../../../steplist/formLevel/handleFormChange/utils'
import { getMaxConditioningVolume } from '../../../../../../utils'
import {
  BlowoutLocationField,
  DisposalField,
  FlowRateField,
  PositionField,
  WellsOrderField,
} from '../../PipetteFields'
import {
  getBlowoutLocationOptionsForForm,
  getLabwareFieldForPositioningField,
} from '../../utils'
import { MultiInputField } from './MultiInputField'
import { ResetSettingsField } from './ResetSettingsField'

import type { Dispatch, SetStateAction } from 'react'
import type { LiquidHandlingPropertyByVolume } from '@opentrons/shared-data'
import type { FormData, StepFieldName } from '../../../../../../form-types'
import type { FieldPropsByName, LiquidHandlingTab } from '../../types'
import type { StepInputFieldProps } from './MultiInputField'

interface DataPoint {
  x: number
  y: number
}

function DraggableLineChart(props: {
  dataPoints: DataPoint[]
  setDataPoints: (dataPoints: DataPoint[]) => void
  byVolume: LiquidHandlingPropertyByVolume
}): JSX.Element {
  const { dataPoints, setDataPoints } = props

  // Function to handle the relayout event (when shapes are dragged)
  const handleRelayout = (eventData: any): void => {
    const updatedPoints = [...dataPoints]
    let changed = false

    for (let i = 0; i < updatedPoints.length; i++) {
      const xKey = `shapes[${i}].x0`
      const yKey = `shapes[${i}].y0`

      if (eventData[xKey] !== undefined && eventData[yKey] !== undefined) {
        const newX = eventData[xKey] as number
        const newY = eventData[yKey] as number

        if (updatedPoints[i].x !== newX || updatedPoints[i].y !== newY) {
          updatedPoints[i] = {
            ...updatedPoints[i],
            y: Math.max(newY, 0),
          }
          changed = true
        }
      }
    }

    if (changed) {
      const sortedPoints = updatedPoints.sort((a, b) => a.x - b.x)
      setDataPoints(sortedPoints)
    }
  }

  // Function to handle a click on the invisible "click" trace
  const handlePlotClick = (eventData: any): void => {
    // This event handler is triggered by clicking on the invisible trace's line.
    // The `eventData.points` array will contain information about the clicked point.
    if (eventData && eventData.points && eventData.points.length > 0) {
      const point = eventData.points[0]
      const newPoint: DataPoint = {
        x: point.x,
        y: point.y,
      }

      const updatedPoints = [...dataPoints, newPoint]
      const sortedPoints = updatedPoints.sort((a, b) => a.x - b.x)
      setDataPoints(sortedPoints)
    }
  }

  // Helper function to generate annotations
  const getAnnotations = (): any => {
    return dataPoints.map(point => ({
      xref: 'x',
      yref: 'y',
      x: point.x,
      y: point.y,
      text: `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
      showarrow: false,
      xanchor: 'center',
      yanchor: 'bottom',
      yshift: 15,
      font: {
        color: 'black',
        size: 11,
      },
      opacity: 1,
    }))
  }

  // Helper function to generate shapes based on data points
  const getShapes = (): any => {
    return dataPoints.map((point, index) => ({
      type: 'circle',
      xref: 'x',
      yref: 'y',
      x0: point.x - 5,
      y0: point.y - 5,
      x1: point.x + 5,
      y1: point.y + 5,
      fillcolor: COLORS.blue50,
      line: { width: 0 },
      editable: true,
      name: String(point.x),
    }))
  }

  return (
    <div>
      <Plot
        data={[
          {
            x: dataPoints.map(p => p.x),
            y: dataPoints.map(p => p.y),
            mode: 'lines+markers',
            type: 'scatter',
            marker: {
              size: 35,
              opacity: 0,
            },
            line: { width: 2 },
            showlegend: false,
            hoverinfo: 'none',
          },
          // This is the invisible, "clickable" trace.
          {
            x: dataPoints.map(p => p.x),
            y: dataPoints.map(p => p.y),
            mode: 'lines',
            type: 'scatter',
            line: {
              width: 20,
              color: 'rgba(0,0,0,0)', // Completely transparent
            },
            hoverinfo: 'none',
            showlegend: false,
            name: 'click-trace',
          },
        ]}
        layout={{
          width: 700,
          height: 700,
          title: { text: 'Flow rate (ul/s) vs Volume (ul)', editable: false },
          xaxis: { title: 'Volume (ul)', range: [0, 210] },
          yaxis: { title: 'Flow rate (ul/s)', range: [0, 210] },
          shapes: getShapes(),
          hovermode: 'closest',
          annotations: getAnnotations(),
        }}
        config={{
          editable: true,
          displayModeBar: true,
          modeBarButtonsToRemove: [
            'zoom2d',
            'pan2d',
            'autoScale2d',
            'hoverClosestCartesian',
            'toImage',
            'lasso2d',
            'select2d',
            'toggleHover',
            'zoomIn2d',
            'zoomOut2d',
          ],
          edits: {
            titleText: false,
            axisTitleText: false,
            legendText: false,
            colorbarTitleText: false,
            shapePosition: true,
            shapeEdit: false,
          },
        }}
        onRelayout={handleRelayout}
        onClick={handlePlotClick}
      />
    </div>
  )
}

const addPrefix = (prefix: string) => (fieldName: string): StepFieldName =>
  `${prefix}_${fieldName}`

const getByVolumeMappedToXY = (
  data: LiquidHandlingPropertyByVolume
): Array<{ x: number; y: number }> => {
  return [
    { x: 0, y: data[0][1] },
    ...data.map(item => ({
      x: item[0],
      y: item[1],
    })),
  ]
}

function EditableLineChartModal(props: {
  byVolume: LiquidHandlingPropertyByVolume
  onClose: () => void
  setFlowRates: Dispatch<SetStateAction<LiquidHandlingPropertyByVolume>>
  defaultFlowRates: LiquidHandlingPropertyByVolume
  setIsFlowRatesUpdated: Dispatch<SetStateAction<boolean>>
}): JSX.Element {
  const {
    byVolume = [],
    onClose,
    setFlowRates,
    defaultFlowRates,
    setIsFlowRatesUpdated,
  } = props
  const defaultDataPoints = getByVolumeMappedToXY(byVolume)
  const [dataPoints, setDataPoints] = useState(defaultDataPoints)

  return createPortal(
    <Modal
      title="Flow rate (ul/s) vs Volume (ul)"
      onClose={onClose}
      closeOnOutsideClick
      width={FLEX_MIN_CONTENT}
    >
      <DraggableLineChart
        dataPoints={dataPoints}
        setDataPoints={setDataPoints}
        byVolume={byVolume}
      />
      <Flex justifyContent={JUSTIFY_FLEX_END} gridGap={SPACING.spacing4}>
        <SecondaryButton
          onClick={() => {
            setDataPoints(getByVolumeMappedToXY(defaultFlowRates))
          }}
        >
          Reset curve
        </SecondaryButton>
        <PrimaryButton
          onClick={() => {
            setFlowRates(dataPoints.map(p => [p.x, p.y]))
            onClose()
            setIsFlowRatesUpdated(true)
          }}
        >
          Save
        </PrimaryButton>
      </Flex>
    </Modal>,
    getMainPagePortalEl()
  )
}

interface SecondStepsMoveLiquidToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
  tab: LiquidHandlingTab
  setTab: Dispatch<SetStateAction<LiquidHandlingTab>>
  setShowFormErrors?: Dispatch<SetStateAction<boolean>>
}

export const SecondStepsMoveLiquidTools = ({
  propsForFields,
  formData,
  tab,
  setTab,
  setShowFormErrors,
}: SecondStepsMoveLiquidToolsProps): JSX.Element => {
  const { t, i18n } = useTranslation(['protocol_steps', 'form', 'tooltip'])
  const toolsComponentRef = useRef<HTMLDivElement | null>(null)
  const pipetteEntities = useSelector(getPipetteEntities)
  const labwareEntities = useSelector(getLabwareEntities)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const { trashBinEntities, wasteChuteEntities } = useSelector(
    getInvariantContext
  )
  const { spec: pipetteSpecs } = pipetteEntities[String(formData.pipette)]
  const byTipValues = getAllLiquidClassDefs()
    [
      formData.liquidClass !== NONE_LIQUID_CLASS_NAME
        ? formData.liquidClass
        : 'waterV1'
    ].byPipette.find(
      ({ pipetteModel }) => pipetteModel === getFlexNameConversion(pipetteSpecs)
    )
    ?.byTipType.find(({ tiprack }) => tiprack === formData.tipRack)?.aspirate
    .flowRateByVolume

  const robotType = useSelector(getRobotType)
  const pipetteSpec = useSelector(getPipetteEntities)[formData.pipette]?.spec
  const [showResetModal, setShowResetModal] = useState<boolean>(false)
  const [showChart, setShowChart] = useState<boolean>(false)
  const [flowRates, setFlowRates] = useState<LiquidHandlingPropertyByVolume>(
    byTipValues ?? []
  )
  // need presaved logic here
  const [isFlowRatesUpdated, setIsFlowRatesUpdated] = useState<boolean>(false)
  const addFieldNamePrefix = addPrefix(tab)
  const isWasteChuteSelected =
    propsForFields.dispense_labware?.value != null
      ? wasteChuteEntities[String(propsForFields.dispense_labware.value)] !=
        null
      : false
  const isTrashBinSelected =
    propsForFields.dispense_labware?.value != null
      ? trashBinEntities[String(propsForFields.dispense_labware.value)] != null
      : false
  const destinationLabwareType =
    formData.dispense_labware != null
      ? getTrashOrLabware(
          labwareEntities,
          wasteChuteEntities,
          trashBinEntities,
          formData.dispense_labware as string
        )
      : null
  const isDestinationTrash =
    destinationLabwareType != null
      ? ['trashBin', 'wasteChute'].includes(destinationLabwareType)
      : false
  const dispenseMixDisabledTooltipText = t(
    `tooltip:step_fields.moveLiquid.disabled.${
      isDestinationTrash ? 'dispense_mix_checkbox' : 'dispense_mix_checkbox_2'
    }`
  )

  const aspirateTab = {
    text: t('aspirate'),
    isActive: tab === 'aspirate',
    onClick: () => {
      setTab('aspirate')
      setShowFormErrors?.(false)
    },
  }
  const dispenseTab = {
    text: t('dispense'),
    isActive: tab === 'dispense',
    onClick: () => {
      setTab('dispense')
      setShowFormErrors?.(false)
    },
  }

  const hideWellOrderField =
    tab === 'dispense' && (isWasteChuteSelected || isTrashBinSelected)

  const getFields = (type: 'submerge' | 'retract'): StepInputFieldProps[] => {
    return [
      {
        fieldTitle: t(`protocol_steps:${type}_speed`),
        fieldKey: `${tab}_${type}_speed`,
        units: 'application:units.millimeterPerSec',
      },
      {
        fieldTitle: t('protocol_steps:delay_duration'),
        fieldKey: `${tab}_${type}_delay_seconds`,
        units: 'application:units.seconds_long',
      },
    ]
  }

  const maxPushoutVolume = getMaxPushOutVolume(
    Number(formData.volume),
    pipetteSpec
  )
  const maxConditioningVolume = useMemo(
    () =>
      getMaxConditioningVolume({
        transferVolume: Number(formData.volume),
        disposalVolume:
          formData.disposalVolume_checkbox === true
            ? Number(formData.disposalVolume_volume)
            : 0,
        pipetteSpecs: pipetteSpec,
        labwareEntities: labwareEntities,
        tiprackDefUri: formData.tipRack,
      }),
    [
      formData.transferVolume,
      formData.disposalVolume_volume,
      formData.pipette,
      formData.tipRack,
    ]
  )
  const minXYDimension = isDestinationTrash
    ? null
    : getMinXYDimension(labwareEntities[formData[`${tab}_labware`]]?.def, [
        'A1',
      ])
  const minRadiusForTouchTip =
    minXYDimension != null ? round(minXYDimension / 2, 1) : null

  const handleScrollToTop = (): void => {
    if (toolsComponentRef.current != null) {
      toolsComponentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const delayComponent = (
    <CheckboxExpandStepFormField
      title={i18n.format(
        t('form:step_edit_form.field.delay.label'),
        'capitalize'
      )}
      fieldProps={propsForFields[`${tab}_delay_checkbox`]}
    >
      {formData[`${tab}_delay_checkbox`] === true ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing6}
          width="100^"
        >
          <InputStepFormField
            showTooltip={false}
            padding="0"
            title={t('protocol_steps:delay_duration')}
            {...propsForFields[`${tab}_delay_seconds`]}
            units={t('application:units.seconds')}
          />
        </Flex>
      ) : null}
    </CheckboxExpandStepFormField>
  )
  const mixComponent = (
    <CheckboxExpandStepFormField
      title={i18n.format(
        t('form:step_edit_form.field.mix.label'),
        'capitalize'
      )}
      fieldProps={propsForFields[`${tab}_mix_checkbox`]}
      tooltipOverride={
        tab === 'dispense' ? dispenseMixDisabledTooltipText : null
      }
    >
      {formData[`${tab}_mix_checkbox`] === true ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing6}
          width="100^"
        >
          <InputStepFormField
            showTooltip={false}
            padding="0"
            title={t('protocol_steps:mix_volume')}
            {...propsForFields[`${tab}_mix_volume`]}
            units={t('application:units.microliter')}
          />
          <InputStepFormField
            showTooltip={false}
            padding="0"
            title={t('protocol_steps:mix_times')}
            {...propsForFields[`${tab}_mix_times`]}
            units={t('application:units.times')}
          />
        </Flex>
      ) : null}
    </CheckboxExpandStepFormField>
  )

  return (
    <>
      {showResetModal ? (
        <ResetSettingsModal
          tab={tab}
          onContinue={() => {
            updateFieldsForLiquidClass({
              propsForFields,
              rawForm: formData,
              pipetteEntities,
              labwareEntities,
              additionalEquipmentEntities,
              liquidHandlingAction: tab,
              robotType,
            })
          }}
          onClose={() => {
            setShowResetModal(false)
          }}
          onScroll={() => {
            handleScrollToTop()
          }}
          liquidClass={formData.liquidClass}
        />
      ) : null}
      <Flex
        ref={toolsComponentRef}
        flexDirection={DIRECTION_COLUMN}
        width="100%"
        paddingY={SPACING.spacing16}
        gridGap={SPACING.spacing12}
      >
        <Flex padding={`0 ${SPACING.spacing16}`}>
          <Tabs tabs={[aspirateTab, dispenseTab]} />
        </Flex>
        <Divider marginY="0" />
        {byTipValues != null ? (
          <Flex
            paddingX={SPACING.spacing16}
            gridGap={SPACING.spacing4}
            alignItems={ALIGN_CENTER}
          >
            <PrimaryButton
              onClick={() => {
                setShowChart(true)
              }}
            >
              Flow rate builder
            </PrimaryButton>
            {isFlowRatesUpdated ? (
              <Chip type="success" text="updated flow rates" />
            ) : null}
            {showChart ? (
              <EditableLineChartModal
                byVolume={flowRates}
                onClose={() => {
                  setShowChart(false)
                }}
                setFlowRates={setFlowRates}
                defaultFlowRates={byTipValues ?? []}
                setIsFlowRatesUpdated={setIsFlowRatesUpdated}
              />
            ) : null}
          </Flex>
        ) : null}

        {hideWellOrderField ? null : (
          <>
            <WellsOrderField
              prefix={tab}
              updateFirstWellOrder={
                propsForFields[addFieldNamePrefix('wellOrder_first')]
                  .updateValue
              }
              updateSecondWellOrder={
                propsForFields[addFieldNamePrefix('wellOrder_second')]
                  .updateValue
              }
              firstValue={formData[addFieldNamePrefix('wellOrder_first')]}
              secondValue={formData[addFieldNamePrefix('wellOrder_second')]}
              firstName={addFieldNamePrefix('wellOrder_first')}
              secondName={addFieldNamePrefix('wellOrder_second')}
            />
          </>
        )}
        {isDestinationTrash ? null : (
          <>
            <Divider marginY="0" />
            <PositionField
              formData={formData}
              prefix={tab}
              propsForFields={propsForFields}
              zField={`${tab}_mmFromBottom`}
              xField={`${tab}_x_position`}
              yField={`${tab}_y_position`}
              labwareId={
                formData[
                  getLabwareFieldForPositioningField(
                    addFieldNamePrefix('mmFromBottom')
                  )
                ]
              }
              referenceField={`${tab}_position_reference`}
            />
          </>
        )}
        {!isDestinationTrash ? (
          <>
            <Divider marginY="0" />
            <MultiInputField
              formData={formData}
              name={t('submerge')}
              prefix={`${tab}_submerge`}
              tooltipContent={t(`tooltip:step_fields.defaults.${tab}_submerge`)}
              propsForFields={propsForFields}
              fields={getFields('submerge')}
              isWellPosition
              labwareId={
                formData[
                  getLabwareFieldForPositioningField(
                    addFieldNamePrefix('submerge_mmFromBottom')
                  )
                ]
              }
              referenceField={`${tab}_submerge_position_reference`}
            />
            <Divider marginY="0" />
            <MultiInputField
              formData={formData}
              name={t('retract')}
              prefix={`${tab}_retract`}
              tooltipContent={t(`tooltip:step_fields.defaults.${tab}_retract`)}
              propsForFields={propsForFields}
              fields={getFields('retract')}
              isWellPosition
              labwareId={
                formData[
                  getLabwareFieldForPositioningField(
                    addFieldNamePrefix('retract_mmFromBottom')
                  )
                ]
              }
              referenceField={`${tab}_retract_position_reference`}
            />
          </>
        ) : null}
        <Divider marginY="0" />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          padding={`0 ${SPACING.spacing16}`}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('protocol_steps:advanced_settings')}
          </StyledText>
          {tab === 'aspirate' ? (
            <ToggleStepFormField
              title={i18n.format(
                t('form:step_edit_form.field.preWetTip.label'),
                'capitalize'
              )}
              toggleValue={propsForFields.preWetTip.value}
              isSelected={propsForFields.preWetTip.value === true}
              toggleUpdateValue={propsForFields.preWetTip.updateValue}
              toggleElement="checkbox"
              tooltipContent={propsForFields.preWetTip.tooltipContent ?? null}
              isDisabled={propsForFields.preWetTip.disabled}
            />
          ) : null}
          {tab === 'aspirate' ? (
            <>
              {mixComponent}
              {formData.path === 'multiDispense' ? (
                <CheckboxExpandStepFormField
                  title={t('form:step_edit_form.field.conditioning.title')}
                  fieldProps={propsForFields.conditioning_checkbox}
                >
                  {formData.conditioning_checkbox === true ? (
                    <InputStepFormField
                      {...propsForFields.conditioning_volume}
                      title={t(
                        'form:step_edit_form.field.conditioning.conditioning_volume.label'
                      )}
                      caption={t(
                        'form:step_edit_form.field.conditioning.conditioning_volume.caption',
                        { min: 0, max: maxConditioningVolume }
                      )}
                      padding="0"
                      showTooltip={false}
                    />
                  ) : null}
                </CheckboxExpandStepFormField>
              ) : null}
              {delayComponent}
            </>
          ) : (
            <>
              {delayComponent}
              {mixComponent}
              <CheckboxExpandStepFormField
                title={i18n.format(
                  t('form:step_edit_form.field.pushOut.title'),
                  'capitalize'
                )}
                fieldProps={propsForFields.pushOut_checkbox}
              >
                {formData.pushOut_checkbox === true ? (
                  <InputStepFormField
                    {...propsForFields.pushOut_volume}
                    showTooltip={false}
                    padding="0"
                    title={t(
                      'form:step_edit_form.field.pushOut.pushOut_volume.label'
                    )}
                    caption={t(
                      'form:step_edit_form.field.pushOut.pushOut_volume.caption',
                      { min: 0, max: maxPushoutVolume }
                    )}
                    units={t('application:units.microliter')}
                  />
                ) : null}
              </CheckboxExpandStepFormField>
              <CheckboxExpandStepFormField
                title={i18n.format(
                  t('form:step_edit_form.field.blowout.label'),
                  'capitalize'
                )}
                fieldProps={propsForFields.blowout_checkbox}
              >
                {formData.blowout_checkbox === true ? (
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    gridGap={SPACING.spacing6}
                    width="100^"
                  >
                    <BlowoutLocationField
                      {...propsForFields.blowout_location}
                      options={getBlowoutLocationOptionsForForm({
                        path: formData.path,
                        stepType: formData.stepType,
                      })}
                      padding="0"
                    />
                    <FlowRateField
                      key="blowout_flowRate"
                      {...propsForFields.blowout_flowRate}
                      pipetteId={formData.pipette}
                      flowRateType="blowout"
                      volume={propsForFields.volume?.value ?? 0}
                      tiprack={propsForFields.tipRack.value}
                      padding="0"
                      formData={formData}
                    />
                  </Flex>
                ) : null}
              </CheckboxExpandStepFormField>
              {formData.path === 'multiDispense' ? (
                <DisposalField
                  aspirate_airGap_checkbox={formData.aspirate_airGap_checkbox}
                  aspirate_airGap_volume={formData.aspirate_airGap_volume}
                  path={formData.path}
                  pipette={formData.pipette}
                  propsForFields={propsForFields}
                  stepType={formData.stepType}
                  volume={formData.volume}
                  formData={formData}
                />
              ) : null}
            </>
          )}
          <CheckboxExpandStepFormField
            title={i18n.format(
              t('form:step_edit_form.field.touchTip.label'),
              'capitalize'
            )}
            fieldProps={propsForFields[`${tab}_touchTip_checkbox`]}
          >
            {formData[`${tab}_touchTip_checkbox`] === true ? (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing10}
              >
                <InputStepFormField
                  showTooltip={false}
                  padding="0"
                  title={t('form:step_edit_form.field.touchTip_speed.label')}
                  {...propsForFields[`${tab}_touchTip_speed`]}
                  units={t('application:units.millimeterPerSec')}
                />
                <InputStepFormField
                  showTooltip={false}
                  padding="0"
                  title={t(
                    'form:step_edit_form.field.touchTip_mmFromEdge.label'
                  )}
                  {...propsForFields[`${tab}_touchTip_mmFromEdge`]}
                  caption={t(
                    `form:step_edit_form.field.touchTip_mmFromEdge.caption`,
                    {
                      min: 0,
                      max: minRadiusForTouchTip,
                    }
                  )}
                  units={t('application:units.millimeter')}
                />
                <PositionField
                  formData={formData}
                  prefix={tab}
                  propsForFields={propsForFields}
                  zField={`${tab}_touchTip_mmFromTop`}
                  labwareId={
                    formData[
                      getLabwareFieldForPositioningField(
                        addFieldNamePrefix('touchTip_mmFromTop')
                      )
                    ]
                  }
                  showButton
                  padding="0"
                  isNested
                />
              </Flex>
            ) : null}
          </CheckboxExpandStepFormField>
          <CheckboxExpandStepFormField
            title={i18n.format(
              t('form:step_edit_form.field.airGap.title'),
              'capitalize'
            )}
            fieldProps={propsForFields[`${tab}_airGap_checkbox`]}
          >
            {formData[`${tab}_airGap_checkbox`] === true ? (
              <InputStepFormField
                {...propsForFields[`${tab}_airGap_volume`]}
                showTooltip={false}
                padding="0"
                title={t('form:step_edit_form.field.airGap.label')}
                units={t('application:units.microliter')}
              />
            ) : null}
          </CheckboxExpandStepFormField>
        </Flex>
        <ResetSettingsField
          tab={tab}
          onClick={() => {
            setShowResetModal(true)
          }}
        />
      </Flex>
    </>
  )
}
