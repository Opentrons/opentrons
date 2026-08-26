import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  getIsLid,
  getMaxPoolCount,
} from '@opentrons/shared-data'
import { FAKE_HOPPER_LOCATION_MAP } from '@opentrons/step-generation'

import { HandleEnter } from '/protocol-designer/components/atoms'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import {
  createContainer,
  deleteContainer,
} from '/protocol-designer/labware-ingred/actions'
import { updateStackerModuleState } from '/protocol-designer/step-forms/actions'
import { createContainerAboveModule } from '/protocol-designer/step-forms/actions/thunks'
import {
  getInitialDeckSetup,
  getLabwareEntities,
} from '/protocol-designer/step-forms/selectors'
import { maskToPositiveInteger } from '/protocol-designer/steplist/fieldLevel/processing'

import { getMainPagePortalEl } from '../Portal'

import type { ReactNode } from 'react'
import type {
  FlexStackerModuleState,
  HopperLocationMapKey,
} from '@opentrons/step-generation'
import type { ThunkDispatch } from '/protocol-designer/types'

interface EditLabwareQuantityModalProps {
  allLabwareIdsOnStack: string[]
  labwareId: string
  onClose: () => void
  isOnHopper: boolean
  location: string
}
export function EditLabwareQuantityModal(
  props: EditLabwareQuantityModalProps
): ReactNode {
  const { onClose, allLabwareIdsOnStack, labwareId, isOnHopper, location } =
    props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const labwareEntities = useSelector(getLabwareEntities)
  const labwareDefsByUri = useSelector(getLabwareDefsByURI)
  const { modules } = useSelector(getInitialDeckSetup)
  const { labwareDefURI, def } = labwareEntities[labwareId]
  const labwareOfPrimaryURIOnStack = allLabwareIdsOnStack.filter(id =>
    id.includes(labwareDefURI)
  )
  const labwareDefURIsInStack = new Set(
    allLabwareIdsOnStack.map(
      labwareId => labwareEntities[labwareId].labwareDefURI
    )
  )
  const labwareDefURIsInStackArray = Array.from(labwareDefURIsInStack)
  const hasLidInStack = labwareDefURIsInStackArray.length > 1
  const labwareDefinitionsInGroup = labwareDefURIsInStackArray.map(
    uri => labwareDefsByUri[uri]
  )
  const lidDefinition = labwareDefinitionsInGroup.find(def => getIsLid(def))

  const [stackerId, stackerModule] =
    Object.entries(modules).find(
      ([_, { slot, moduleState }]) =>
        slot === FAKE_HOPPER_LOCATION_MAP[location as HopperLocationMapKey] &&
        moduleState.type === FLEX_STACKER_MODULE_TYPE
    ) ?? []
  const stackerSlot = FAKE_HOPPER_LOCATION_MAP[location as HopperLocationMapKey]
  const stackerModuleState =
    stackerModule?.moduleState as FlexStackerModuleState
  const initialQuantity =
    stackerModuleState != null
      ? (stackerModuleState.labwareInHopper?.length ?? 1)
      : labwareOfPrimaryURIOnStack.length

  const handleHopperQuantityUpdate = (newQuantity: number): void => {
    // slice from bottom up, up to the new quantity
    const { storedLabwareDetails, labwareInHopper } = stackerModuleState
    if (
      stackerId != null &&
      stackerModuleState != null &&
      storedLabwareDetails != null &&
      labwareInHopper != null
    ) {
      const initialGroupsInHopperQuantity = labwareInHopper.length
      if (newQuantity < initialGroupsInHopperQuantity) {
        const newLabwareInHopper = labwareInHopper.slice(0, newQuantity)
        dispatch(
          updateStackerModuleState({
            moduleId: stackerId,
            moduleState: {
              ...stackerModuleState,
              labwareInHopper: newLabwareInHopper,
            },
          })
        )
        // delete the labwares
        const groupsToDelete = labwareInHopper.slice(
          newQuantity,
          initialGroupsInHopperQuantity
        )
        for (const group of groupsToDelete) {
          for (const id of Object.values(group)) {
            if (id != null) {
              dispatch(
                deleteContainer({
                  labwareId: id,
                })
              )
            }
          }
        }
      } else if (newQuantity > initialGroupsInHopperQuantity) {
        const quantityToAdd = newQuantity - initialGroupsInHopperQuantity
        dispatch(
          createContainerAboveModule({
            slot: stackerSlot,
            labwareDefURIGroup: {
              adapterDefURI: storedLabwareDetails.adapterLabwareURI ?? null,
              topLabwareDefURI: storedLabwareDetails.primaryLabwareURI,
              lidDefURI: storedLabwareDetails.lidLabwareURI ?? null,
            },
            stackerInfo: {
              stackerPosition: 'hopper',
              amount: quantityToAdd,
            },
          })
        )
      }
    }
  }

  const stackingLimit = isOnHopper
    ? getMaxPoolCount({
        labwareDefinitions: {
          primary: def,
          adapter: null,
          lid: lidDefinition ?? null,
        },
        model: FLEX_STACKER_MODULE_V1,
      })
    : (def.stackLimit ?? 0)

  const [quantity, setQuantity] = useState<string>(initialQuantity.toString())
  const [showError, setError] = useState<boolean>(false)
  const saveQuantity = (quantity: string): void => {
    if (isOnHopper) {
      handleHopperQuantityUpdate(parseInt(quantity))
    } else {
      //  delete the full stack above the labwareId in question
      allLabwareIdsOnStack.forEach(labwareIdStack => {
        if (labwareIdStack !== labwareId) {
          dispatch(
            deleteContainer({
              labwareId: labwareIdStack,
            })
          )
        }
      })
      // recreate the stack
      const count = parseInt(quantity) - 1
      const arrayOfLabwareDefURI = hasLidInStack
        ? Array.from({ length: count * 2 }, (_, index) =>
            index % 2 === 0
              ? labwareDefURIsInStackArray[0]
              : labwareDefURIsInStackArray[1]
          )
        : Array.from({ length: count }, () => labwareDefURI)
      if (arrayOfLabwareDefURI.length > 0) {
        dispatch(
          createContainer({
            labwareDefURIStack: arrayOfLabwareDefURI,
            slot: labwareId,
          })
        )
      }
    }
    onClose()
  }

  let errorText: string | null = null
  if (parseInt(quantity) > stackingLimit || parseInt(quantity) < 1) {
    errorText = t('quantity_out_of_limit')
  } else if (quantity === '') {
    errorText = t('enter_integer')
  }

  useEffect(() => {
    if (errorText == null) {
      setError(false)
    }
  }, [errorText])

  const handleConfirmClick = (): void => {
    if (errorText) {
      setError(true)
    } else {
      saveQuantity(quantity)
    }
  }

  return createPortal(
    <HandleEnter
      onEnter={() => {
        saveQuantity(quantity)
      }}
    >
      <Modal
        width="37.125rem"
        title={t('edit_labware_quantity')}
        type="info"
        onClose={onClose}
        footer={
          <Flex justifyContent={JUSTIFY_END} padding={SPACING.spacing24}>
            <Flex gridGap={SPACING.spacing8}>
              <SecondaryButton onClick={onClose}>
                {t('shared:cancel')}
              </SecondaryButton>
              <PrimaryButton onClick={handleConfirmClick}>
                {t('confirm_quantity')}
              </PrimaryButton>
            </Flex>
          </Flex>
        }
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('labware_quantity')}
          </StyledText>
          <InputField
            error={showError ? errorText : null}
            name="changeQuantity"
            onChange={e => {
              const maskedValue = maskToPositiveInteger(e.target.value)
              setQuantity(maskedValue)
            }}
            value={quantity}
            autoFocus
            caption={t('valid_range', { max: stackingLimit })}
          />
        </Flex>
      </Modal>
    </HandleEnter>,
    getMainPagePortalEl()
  )
}
