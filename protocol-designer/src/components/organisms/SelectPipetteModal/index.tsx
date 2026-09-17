import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_END,
  Modal,
  OVERFLOW_AUTO,
  PrimaryButton,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getAllPipetteNames,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import { getTiprackOptions } from '/protocol-designer/pages/Onboarding/utils'

import { IncompatibleTipsModal } from '../IncompatibleTipsModal'
import { getMainPagePortalEl } from '../Portal'
import { SelectPipetteGen } from './SelectPipetteGen'
import { SelectPipetteTips } from './SelectPipetteTips'
import { SelectPipetteType } from './SelectPipetteType'
import { SelectPipetteVolume } from './SelectPipetteVolume'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type {
  Gen,
  PipetteType,
  WizardTileProps,
} from '/protocol-designer/pages/Onboarding/types'

interface SelectedPipetteModalProps extends WizardTileProps {
  mount: PipetteMount
  handleBack: () => void
  pipetteGen: Gen | 'flex'
  pipetteVolume: string | null
  pipetteType: PipetteType | null
  setPipetteGen: Dispatch<SetStateAction<'flex' | Gen>>
  setPipetteVolume: Dispatch<SetStateAction<string | null>>
  setPipetteType: Dispatch<SetStateAction<PipetteType | null>>
  setSelectedPipetteName: Dispatch<SetStateAction<string | null>>
}

export function SelectPipetteModal(
  props: SelectedPipetteModalProps
): ReactNode {
  const {
    handleBack,
    watch,
    setValue,
    mount,
    pipetteGen,
    pipetteType,
    pipetteVolume,
    setPipetteGen,
    setPipetteVolume,
    setPipetteType,
    setSelectedPipetteName,
  } = props
  const { t } = useTranslation(['onboarding', 'shared'])
  const [allowAllTipracks, setAllowAllTipracks] = useState<boolean>(false)
  const pipettesByMount = watch('pipettesByMount')
  const fields = watch('fields')
  const allLabware = useSelector(getLabwareDefsByURI)
  const [showIncompatibleTip, setIncompatibleTip] = useState<boolean>(false)
  const [selectedTipracks, setSelectedTipracks] = useState<string[]>(
    () => pipettesByMount[mount].tiprackDefURI ?? []
  )

  const allPipetteOptions = getAllPipetteNames('maxVolume', 'channels')
  const robotType = fields.robotType
  const selectedPipetteName =
    pipetteType === '96' || pipetteGen === 'GEN1'
      ? `${pipetteVolume}_${pipetteType}`
      : `${pipetteVolume}_${pipetteType}_${pipetteGen.toLowerCase()}`

  const currentPipetteSelected = pipetteType != null && pipetteVolume != null
  const currentTipracksSelected = selectedTipracks.length > 0
  const otherMount = mount === 'left' ? 'right' : 'left'
  const otherMountData = pipettesByMount[otherMount]
  const otherPipetteConfigured = otherMountData?.pipetteName != null
  const otherTipracksConfigured =
    otherMountData?.tiprackDefURI != null &&
    otherMountData.tiprackDefURI.length > 0
  const otherMountComplete = otherPipetteConfigured && otherTipracksConfigured
  const currentMountComplete = currentPipetteSelected && currentTipracksSelected
  const noPipette = !currentMountComplete && !otherMountComplete
  const isDisabled = noPipette || !currentTipracksSelected

  if (robotType == null) {
    return null
  }

  const handleSave = (): void => {
    setValue(`pipettesByMount.${mount}.tiprackDefURI`, selectedTipracks)
    setSelectedPipetteName(selectedPipetteName)
  }

  return createPortal(
    showIncompatibleTip ? (
      <IncompatibleTipsModal
        onClose={() => {
          setIncompatibleTip(false)
        }}
        setAllowAllTipracks={setAllowAllTipracks}
      />
    ) : (
      <Modal
        width="37.125rem"
        type="info"
        title={t('add_pipette')}
        footer={
          <Flex
            justifyContent={JUSTIFY_END}
            gridGap={SPACING.spacing8}
            padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
            alignItems={ALIGN_CENTER}
          >
            <SecondaryButton onClick={handleBack}>
              {t('shared:cancel')}
            </SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={isDisabled}>
              {t('shared:save')}
            </PrimaryButton>
          </Flex>
        }
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          overflowY={OVERFLOW_AUTO}
          gridGap={SPACING.spacing32}
        >
          <SelectPipetteType
            mount={mount}
            robotType={robotType}
            pipettesByMount={pipettesByMount}
            setPipetteGen={setPipetteGen}
            setPipetteVolume={setPipetteVolume}
            setPipetteType={setPipetteType}
            pipetteType={pipetteType}
            setValue={setValue}
          />
          {pipetteType != null && robotType === OT2_ROBOT_TYPE ? (
            <SelectPipetteGen
              setPipetteGen={setPipetteGen}
              setPipetteVolume={setPipetteVolume}
              pipetteGen={pipetteGen}
            />
          ) : null}
          {(pipetteType != null && robotType === FLEX_ROBOT_TYPE) ||
          (pipetteGen !== 'flex' &&
            pipetteType != null &&
            robotType === OT2_ROBOT_TYPE) ? (
            <SelectPipetteVolume
              setPipetteVolume={setPipetteVolume}
              robotType={robotType}
              pipetteGen={pipetteGen}
              pipetteType={pipetteType}
              pipetteVolume={pipetteVolume}
            />
          ) : null}
          {allPipetteOptions.includes(selectedPipetteName as PipetteName)
            ? (() => {
                const tiprackOptions = getTiprackOptions({
                  allLabware,
                  allowAllTipracks,
                  selectedPipetteName,
                })
                return (
                  <SelectPipetteTips
                    setAllowAllTipracks={setAllowAllTipracks}
                    tiprackOptions={tiprackOptions}
                    setIncompatibleTip={setIncompatibleTip}
                    robotType={robotType}
                    pipetteVolume={pipetteVolume}
                    selectedValues={selectedTipracks}
                    setSelectedTipracks={setSelectedTipracks}
                    allowAllTipracks={allowAllTipracks}
                  />
                )
              })()
            : null}
        </Flex>
      </Modal>
    ),
    getMainPagePortalEl()
  )
}
