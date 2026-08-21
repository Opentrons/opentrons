import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'

import { HandleEnter } from '/protocol-designer/components/atoms'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { deleteContainer } from '/protocol-designer/labware-ingred/actions'
import { TIPRACK_LID_LOADNAME } from '/protocol-designer/pages/Designer/utils'
import { selectors as stepFormSelectors } from '/protocol-designer/step-forms'
import { deletePipettes } from '/protocol-designer/step-forms/actions'
import {
  getAdditionalEquipment,
  getInitialDeckSetup,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'
import { getHas96Channel } from '/protocol-designer/utils'

import { getMainPagePortalEl } from '../Portal'
import { editPipettes } from './editPipettes'
import { PipetteConfiguration } from './PipetteConfiguration'
import { PipetteOverview } from './PipetteOverview'
import { usePipetteConfig } from './usePipetteConfig'

import type { PipetteName } from '@opentrons/shared-data'
import type { ThunkDispatch } from '/protocol-designer/types'

interface EditInstrumentsModalProps {
  onClose: () => void
}

export function EditInstrumentsModal(
  props: EditInstrumentsModalProps
): JSX.Element {
  const { onClose } = props
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation('shared')
  const pipetteConfig = usePipetteConfig()
  const robotType = useSelector(getRobotType)
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const pipetteEntities = useSelector(getPipetteEntities)
  const [saveAttemptFailed, setSaveAttemptFailed] = useState<boolean>(false)
  const { pipettes, labware } = initialDeckSetup
  const pipettesOnDeck = Object.values(pipettes)
  const has96Channel = getHas96Channel(pipetteEntities)
  const leftPipette = pipettesOnDeck.find(pipette => pipette.mount === 'left')
  const rightPipette = pipettesOnDeck.find(pipette => pipette.mount === 'right')
  const gripper = Object.values(additionalEquipment).find(
    ae => ae.name === 'gripper'
  )
  const {
    page,
    mount,
    pipetteType,
    pipetteGen,
    pipetteVolume,
    selectedTips,
    setPage,
    temporarilyDeletedPipettes,
    resetFields,
    resetTemporarilyDeletedPipettes,
  } = pipetteConfig

  const activePipettesCount = pipettesOnDeck.filter(
    p => !temporarilyDeletedPipettes.includes(p.id)
  ).length

  const selectedPipette =
    pipetteType === '96' || pipetteGen === 'GEN1'
      ? `${pipetteVolume}_${pipetteType}`
      : `${pipetteVolume}_${pipetteType}_${pipetteGen.toLowerCase()}`

  const canSave =
    (page === 'add' &&
      pipetteVolume != null &&
      pipetteType != null &&
      pipetteGen != null &&
      selectedTips.length > 0) ||
    (page === 'overview' && activePipettesCount > 0)
  const handleOnSave = (): void => {
    if (!canSave) {
      setSaveAttemptFailed(true)
      return
    }

    if (temporarilyDeletedPipettes.length > 0) {
      dispatch(deletePipettes(temporarilyDeletedPipettes))

      temporarilyDeletedPipettes.forEach(pipetteId => {
        const pipette = pipettes[pipetteId]
        if (pipette) {
          const previousTipracks = Object.values(labware)
            .filter(lw => lw.def.parameters.isTiprack)
            .filter(tip => pipette.tiprackDefURI.includes(tip.labwareDefURI))

          previousTipracks.forEach(tip => {
            const tipStack = tip.stack
            tipStack.forEach(item => {
              if (labware[item] != null) {
                dispatch(deleteContainer({ labwareId: item }))
              }
            })
          })
        }
      })

      const allTiprackLidsOnDeck = Object.values(labware).filter(
        lw => lw.def.parameters.loadName === TIPRACK_LID_LOADNAME
      )
      allTiprackLidsOnDeck.forEach(lid =>
        dispatch(deleteContainer({ labwareId: lid.id }))
      )
    }

    if (page === 'overview') {
      onClose()
    } else {
      setPage('overview')
      editPipettes(
        pipettes,
        orderedStepIds,
        dispatch,
        mount,
        selectedPipette as PipetteName,
        selectedTips,
        labware,
        leftPipette,
        rightPipette
      )
    }
  }

  return createPortal(
    <HandleEnter onEnter={handleOnSave}>
      <Modal
        title={page === 'add' ? t('edit_pipette') : t('edit_instruments')}
        type="info"
        closeOnOutsideClick
        width="37.125rem"
        onClose={() => {
          resetFields()
          onClose()
        }}
        footer={
          <Flex
            justifyContent={JUSTIFY_END}
            gridGap={SPACING.spacing8}
            padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
          >
            <SecondaryButton
              onClick={() => {
                if (page === 'overview') {
                  resetTemporarilyDeletedPipettes()
                  resetFields()
                  onClose()
                } else {
                  setPage('overview')
                  resetFields()
                }
              }}
            >
              {page === 'overview' ? t('cancel') : t('back')}
            </SecondaryButton>
            <PrimaryButton onClick={handleOnSave}>{t('save')}</PrimaryButton>
          </Flex>
        }
      >
        {page === 'overview' ? (
          <PipetteOverview
            has96Channel={has96Channel}
            labware={labware}
            pipettes={pipettes}
            robotType={robotType}
            leftPipette={leftPipette}
            rightPipette={rightPipette}
            gripper={gripper}
            pipetteConfig={pipetteConfig}
            showNoPipetteError={saveAttemptFailed && !canSave}
            setSaveAttemptFailed={setSaveAttemptFailed}
          />
        ) : (
          <PipetteConfiguration
            robotType={robotType}
            selectedPipette={selectedPipette}
            leftPipette={leftPipette}
            rightPipette={rightPipette}
            pipetteConfig={pipetteConfig}
          />
        )}
      </Modal>
    </HandleEnter>,
    getMainPagePortalEl()
  )
}
