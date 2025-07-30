import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { registerLicense } from '@syncfusion/ej2-base'
import {
  Category,
  ChartComponent,
  ColumnSeries,
  DataEditing,
  Inject,
  Legend,
  LineSeries,
  SeriesCollectionDirective,
  SeriesDirective,
} from '@syncfusion/ej2-react-charts'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  Modal,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  NONE_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'

import { getMainPagePortalEl } from '../../../../../../components/organisms'
import {
  getEnablePartialTipSupport,
  getEnableReturnTip,
} from '../../../../../../feature-flags/selectors'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import {
  ChangeTipField,
  DropTipField,
  LabwareField,
  PartialTipField,
  PathField,
  PickUpTipField,
  PipetteField,
  TiprackField,
  TipWellSelectionField,
  VolumeField,
  WellSelectionField,
} from '../../PipetteFields'

import type { LiquidHandlingPropertyByVolume } from '@opentrons/shared-data'
import type { FormData } from '../../../../../../form-types'
import type { FieldPropsByName } from '../../types'

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
}): JSX.Element {
  const { byVolume = [], onClose } = props
  const onChartLoad = (): void => {
    registerLicense(
      'Ngo9BigBOggjHTQxAR8/V1JEaF5cXmRCdkx0THxbf1x1ZFRHallVTnVdUiweQnxTdEBjXnxecXVQQmNbUkVzW0leYw=='
    )
    let chart: Element = document.getElementById('charts')
    chart.setAttribute('title', '')
  }

  const data = getByVolumeMappedToXY(byVolume)
  const maxFlowRate = 200
  return createPortal(
    <Modal
      title="Flow rate (ul/s) vs Volume (ul)"
      onClose={onClose}
      closeOnOutsideClick
    >
      <div className="control-pane" style={{ width: '100%' }}>
        <div className="control-section">
          <ChartComponent
            id="charts"
            style={{ textAlign: 'center' }}
            primaryXAxis={{
              valueType: 'Category',
              labelFormat: 'y',
              labelPlacement: 'BetweenTicks',
              majorGridLines: { width: 0 },
              edgeLabelPlacement: 'Shift',
              majorTickLines: { width: 0 },
              minorTickLines: { width: 0 },
            }}
            primaryYAxis={{
              rangePadding: 'None',
              minimum: 0,
              maximum: maxFlowRate,
              interval: maxFlowRate / 10,
              title: 'Flow rate (ul/s)',
              lineStyle: { width: 0 },
              majorTickLines: { width: 0 },
              minorTickLines: { width: 0 },
            }}
            chartArea={{ border: { width: 0 }, margin: { bottom: 12 } }}
            width="100%"
            title="Flow rate (ul/s) vs Volume (ul)"
            loaded={onChartLoad}
          >
            <Inject
              services={[
                LineSeries,
                ColumnSeries,
                Category,
                DataEditing,
                Legend,
              ]}
            />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={data}
                dragSettings={{ enable: true }}
                xName="x"
                yName="y"
                name="Volume (ul)"
                width={2}
                marker={{ visible: true, width: 7, height: 7, isFilled: true }}
                type="Line"
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>
      </div>
    </Modal>,
    getMainPagePortalEl()
  )
}

interface FirstStepMoveLiquidToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
}

export function FirstStepMoveLiquidTools({
  propsForFields,
  formData,
}: FirstStepMoveLiquidToolsProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const labwares = useSelector(getLabwareEntities)
  const pipettes = useSelector(getPipetteEntities)
  const enablePartialTip = useSelector(getEnablePartialTipSupport)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const enableReturnTip = useSelector(getEnableReturnTip)

  const { pipette, tipRack } = propsForFields
  const is96Channel =
    pipette.value != null && pipettes[String(pipette.value)].name === 'p1000_96'
  const is8Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].spec.channels === 8
  const userSelectedDropTipLocation =
    labwares[String(propsForFields.dropTip_location.value)] != null
  const userSelectedPickUpTipLocation =
    labwares[String(propsForFields.pickUpTip_location.value)] != null
  const isDisposalLocation =
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'wasteChute' ||
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'trashBin'

  const { spec: pipetteSpecs } = pipettes[String(formData.pipette)]
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

  const [showChart, setShowChart] = useState<boolean>(false)
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingY={SPACING.spacing16}
    >
      <PipetteField {...propsForFields.pipette} />
      {propsForFields.pipette.value != null &&
      (is96Channel || (is8Channel && enablePartialTip)) ? (
        <>
          <Divider marginY="0" />
          <PartialTipField
            {...propsForFields.nozzles}
            pipetteSpecs={pipettes[String(propsForFields.pipette.value)]?.spec}
          />
        </>
      ) : null}
      <Divider marginY="0" />
      <TiprackField {...tipRack} pipetteId={pipette.value} />
      <Divider marginY="0" />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        <LabwareField {...propsForFields.aspirate_labware} />
        <WellSelectionField
          {...propsForFields.aspirate_wells}
          labwareId={
            typeof propsForFields.aspirate_labware.value === 'string'
              ? propsForFields.aspirate_labware.value
              : null
          }
          pipetteId={formData.pipette}
          nozzles={
            typeof propsForFields.nozzles.value === 'string'
              ? propsForFields.nozzles.value
              : null
          }
          hasFormError={propsForFields.aspirate_wells.errorToShow != null}
        />
      </Flex>
      <Divider marginY="0" />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        <LabwareField {...propsForFields.dispense_labware} />
        {isDisposalLocation ? null : (
          <WellSelectionField
            {...propsForFields.dispense_wells}
            labwareId={
              typeof propsForFields.dispense_labware.value === 'string'
                ? propsForFields.dispense_labware.value
                : null
            }
            pipetteId={formData.pipette}
            nozzles={
              typeof propsForFields.nozzles.value === 'string'
                ? propsForFields.nozzles.value
                : null
            }
            hasFormError={propsForFields.dispense_wells.errorToShow != null}
          />
        )}
      </Flex>
      <Divider marginY="0" />
      <VolumeField {...propsForFields.volume} />
      <Divider marginY="0" />
      <PathField
        {...propsForFields.path}
        aspirate_airGap_checkbox={formData.aspirate_airGap_checkbox}
        aspirate_airGap_volume={formData.aspirate_airGap_volume}
        aspirate_wells={formData.aspirate_wells}
        changeTip={formData.changeTip}
        dispense_wells={formData.dispense_wells}
        pipette={formData.pipette}
        volume={formData.volume}
        tipRack={formData.tipRack}
        isDisposalLocation={isDisposalLocation}
        title={t('pipette_path')}
      />
      <Divider marginY="0" />
      <Flex
        paddingX={SPACING.spacing16}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('tip_management')}
        </StyledText>
        <ChangeTipField
          {...propsForFields.changeTip}
          aspirateWells={formData.aspirate_wells}
          dispenseWells={formData.dispense_wells}
          path={formData.path}
          stepType={formData.stepType}
          isDisposalLocation={isDisposalLocation}
          tooltipContent={null}
          padding="0"
        />
        <DropTipField
          {...propsForFields.dropTip_location}
          tooltipContent={null}
          padding="0"
        />
      </Flex>
      {enableReturnTip ? (
        <>
          <Divider marginY="0" />
          <PickUpTipField {...propsForFields.pickUpTip_location} />
          {userSelectedPickUpTipLocation ? (
            <>
              <TipWellSelectionField
                {...propsForFields.pickUpTip_wellNames}
                nozzles={
                  typeof propsForFields.nozzles.value === 'string'
                    ? propsForFields.nozzles.value
                    : null
                }
                labwareId={propsForFields.pickUpTip_location.value}
                pipetteId={propsForFields.pipette.value}
              />
            </>
          ) : null}
        </>
      ) : null}
      {userSelectedDropTipLocation && enableReturnTip ? (
        <>
          <Divider marginY="0" />
          <TipWellSelectionField
            {...propsForFields.dropTip_wellNames}
            nozzles={
              typeof propsForFields.nozzles.value === 'string'
                ? propsForFields.nozzles.value
                : null
            }
            labwareId={propsForFields.dropTip_location.value}
            pipetteId={propsForFields.pipette.value}
          />
        </>
      ) : null}
    </Flex>
  )
}
