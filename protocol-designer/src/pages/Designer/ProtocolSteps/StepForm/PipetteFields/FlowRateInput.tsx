import * as React from 'react'
import { createPortal } from 'react-dom'
import round from 'lodash/round'
import { useTranslation } from 'react-i18next'
import {
  RadioGroup,
  Flex,
  useHoverTooltip,
  InputField,
  Modal,
  SecondaryButton,
  PrimaryButton,
  Tooltip,
} from '@opentrons/components'
import { getMainPagePortalEl } from '../../../../../components/portals/MainPageModalPortal'
import type { FieldProps } from '../types'

const DECIMALS_ALLOWED = 1

export interface FlowRateInputProps extends FieldProps {
  flowRateType: 'aspirate' | 'dispense' | 'blowout'
  minFlowRate: number
  maxFlowRate: number
  defaultFlowRate?: number | null
  pipetteDisplayName?: string | null
}

interface InitialState {
  isPristine: boolean
  modalUseDefault: boolean
  showModal: boolean
  modalFlowRate?: string | null
}

export const FlowRateInput = (props: FlowRateInputProps): JSX.Element => {
  const {
    defaultFlowRate,
    disabled,
    flowRateType,
    isIndeterminate,
    maxFlowRate,
    minFlowRate,
    name,
    pipetteDisplayName,
    tooltipContent,
    value,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { t, i18n } = useTranslation([
    'form',
    'application',
    'shared',
    'protocol_steps',
  ])

  const initialState: InitialState = {
    isPristine: true,
    modalFlowRate: props.value ? String(props.value) : null,
    modalUseDefault: !props.value && !isIndeterminate,
    showModal: false,
  }

  const [isPristine, setIsPristine] = React.useState<
    InitialState['isPristine']
  >(initialState.isPristine)

  const [modalFlowRate, setModalFlowRate] = React.useState<
    InitialState['modalFlowRate']
  >(initialState.modalFlowRate)

  const [modalUseDefault, setModalUseDefault] = React.useState<
    InitialState['modalUseDefault']
  >(initialState.modalUseDefault)

  const [showModal, setShowModal] = React.useState<InitialState['showModal']>(
    initialState.showModal
  )

  const resetModalState = (): void => {
    setShowModal(initialState.showModal)
    setModalFlowRate(initialState.modalFlowRate)
    setModalUseDefault(initialState.modalUseDefault)
    setIsPristine(initialState.isPristine)
  }

  const cancelModal = resetModalState

  const openModal = (): void => {
    setShowModal(true)
  }

  const makeSaveModal = (allowSave: boolean) => (): void => {
    setIsPristine(false)

    if (allowSave) {
      const newFlowRate = modalUseDefault ? null : Number(modalFlowRate)
      props.updateValue(newFlowRate)
      resetModalState()
    }
  }

  const handleChangeRadio = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setModalUseDefault(e.target.value !== 'custom')
  }

  const handleChangeNumber = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    if (value === '' || value === '.' || !Number.isNaN(Number(value))) {
      setModalFlowRate(value)
      setModalUseDefault(false)
    }
  }
  const title = i18n.format(
    t('protocol_steps:flow_type_title', { type: flowRateType }),
    'capitalize'
  )

  const modalFlowRateNum = Number(modalFlowRate)

  // show 0.1 not 0 as minimum, since bottom of range is non-inclusive
  const displayMinFlowRate = minFlowRate || Math.pow(10, -DECIMALS_ALLOWED)
  const rangeDescription = t('step_edit_form.field.flow_rate.range', {
    min: displayMinFlowRate,
    max: maxFlowRate,
  })
  const outOfBounds =
    modalFlowRateNum === 0 ||
    minFlowRate > modalFlowRateNum ||
    modalFlowRateNum > maxFlowRate
  const correctDecimals =
    round(modalFlowRateNum, DECIMALS_ALLOWED) === modalFlowRateNum
  const allowSave = modalUseDefault || (!outOfBounds && correctDecimals)

  let errorMessage = null
  // validation only happens when "Custom" is selected, not "Default"
  // and pristinity only masks the outOfBounds error, not the correctDecimals error
  if (!modalUseDefault) {
    if (!Number.isNaN(modalFlowRateNum) && !correctDecimals) {
      errorMessage = t('step_edit_form.field.flow_rate.error_decimals', {
        decimals: `${DECIMALS_ALLOWED}`,
      })
    } else if (!isPristine && outOfBounds) {
      errorMessage = t('step_edit_form.field.flow_rate.error_out_of_bounds', {
        min: displayMinFlowRate,
        max: maxFlowRate,
      })
    }
  }

  const FlowRateInputField = (
    <InputField
      disabled={disabled}
      caption={rangeDescription}
      error={errorMessage}
      isIndeterminate={isIndeterminate && modalFlowRate === null}
      name={`${name}_customFlowRate`}
      onChange={handleChangeNumber}
      units={t('application:units.microliterPerSec')}
      value={`${modalFlowRate || ''}`}
    />
  )

  //    TODO: update the modal
  const FlowRateModal =
    pipetteDisplayName &&
    createPortal(
      <Modal
        footer={
          <Flex>
            <SecondaryButton onClick={cancelModal}>
              {t('shared:cancel')}
            </SecondaryButton>
            <PrimaryButton
              disabled={isPristine ? false : !allowSave}
              onClick={makeSaveModal(allowSave)}
            >
              {t('shared:done')}
            </PrimaryButton>
          </Flex>
        }
      >
        <h3>{t('protocol_steps:flow_type_title', { type: flowRateType })}</h3>

        <div>{title}</div>

        <div>{`${flowRateType} speed`}</div>

        <RadioGroup
          inline
          value={modalUseDefault ? 'default' : 'custom'}
          onChange={handleChangeRadio}
          options={[
            {
              name: `${defaultFlowRate || '?'} ${t(
                'application:units.microliterPerSec'
              )} (default)`,
              value: 'default',
            },
            {
              name: 'Custom',
              value: 'custom',
              children: FlowRateInputField,
            },
          ]}
        />
      </Modal>,
      getMainPagePortalEl()
    )

  return (
    <>
      {flowRateType === 'blowout' ? (
        <Flex {...targetProps}>
          <InputField
            title={title}
            disabled={disabled}
            isIndeterminate={isIndeterminate}
            name={name}
            onClick={openModal}
            readOnly
            units={t('application:units.microliterPerSec')}
            value={value ? String(value) : 'default'}
            caption={t('protocol_steps:valid_range', {
              min: displayMinFlowRate,
              max: maxFlowRate,
              unit: t('application:units.microliterPerSec'),
            })}
          />
          <Tooltip tooltipProps={tooltipProps}>{tooltipContent}</Tooltip>
        </Flex>
      ) : (
        <Flex width="100%">
          <InputField
            title={title}
            disabled={disabled}
            isIndeterminate={isIndeterminate}
            name={name}
            onClick={openModal}
            readOnly
            units={t('application:units.microliterPerSec')}
            value={value ? String(value) : 'default'}
            caption={t('protocol_steps:valid_range', {
              min: displayMinFlowRate,
              max: maxFlowRate,
              unit: t('application:units.microliterPerSec'),
            })}
          />
        </Flex>
      )}

      {showModal && FlowRateModal}
    </>
  )
}
