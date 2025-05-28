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

import { getAllowAllTipracks } from '../../../feature-flags/selectors'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { getTiprackOptions } from '../../../pages/Onboarding/utils'
import { IncompatibleTipsModal } from '../IncompatibleTipsModal'
import { getMainPagePortalEl } from '../Portal'
import { SelectPipetteGen } from './SelectPipetteGen'
import { SelectPipetteTips } from './SelectPipetteTips'
import { SelectPipetteType } from './SelectPipetteType'
import { SelectPipetteVolume } from './SelectPipetteVolume'

import type { Dispatch, SetStateAction } from 'react'
import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type {
  Gen,
  PipetteType,
  WizardTileProps,
} from '../../../pages/Onboarding/types'

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
): JSX.Element | null {
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
  const pipettesByMount = watch('pipettesByMount')
  const fields = watch('fields')
  const allLabware = useSelector(getLabwareDefsByURI)
  const [showIncompatibleTip, setIncompatibleTip] = useState<boolean>(false)
  const allowAllTipracks = useSelector(getAllowAllTipracks)
  const allPipetteOptions = getAllPipetteNames('maxVolume', 'channels')
  const robotType = fields.robotType
  const selectedPipetteName =
    pipetteType === '96' || pipetteGen === 'GEN1'
      ? `${pipetteVolume}_${pipetteType}`
      : `${pipetteVolume}_${pipetteType}_${pipetteGen.toLowerCase()}`

  const selectedValues = pipettesByMount[mount].tiprackDefURI ?? []

  const noPipette =
    (pipettesByMount.left.pipetteName == null ||
      pipettesByMount.left.tiprackDefURI == null) &&
    (pipettesByMount.right.pipetteName == null ||
      pipettesByMount.right.tiprackDefURI == null)

  const isDisabled =
    (pipettesByMount[mount].tiprackDefURI == null && noPipette) ||
    ((pipettesByMount.left.tiprackDefURI == null ||
      pipettesByMount.left.tiprackDefURI.length === 0) &&
      (pipettesByMount.right.tiprackDefURI == null ||
        pipettesByMount.right.tiprackDefURI.length === 0))

  if (robotType == null) {
    return null
  }

  return createPortal(
    showIncompatibleTip ? (
      <IncompatibleTipsModal
        onClose={() => {
          setIncompatibleTip(false)
        }}
      />
    ) : (
      <Modal
        marginLeft="0"
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
            <PrimaryButton
              onClick={() => {
                setSelectedPipetteName(selectedPipetteName)
              }}
              disabled={isDisabled}
            >
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
                    tiprackOptions={tiprackOptions}
                    setIncompatibleTip={setIncompatibleTip}
                    mount={mount}
                    robotType={robotType}
                    selectedValues={selectedValues}
                    pipetteVolume={pipetteVolume}
                    setValue={setValue}
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
