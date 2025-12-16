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
import { FLEX_STACKER_MODULE_V1, getMaxPoolCount } from '@opentrons/shared-data'

import { HandleEnter } from '/protocol-designer/components/atoms'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import {
  createContainer,
  deleteContainer,
} from '/protocol-designer/labware-ingred/actions'
import { getLabwareEntities } from '/protocol-designer/step-forms/selectors'
import { maskToPositiveInteger } from '/protocol-designer/steplist/fieldLevel/processing'

import { getMainPagePortalEl } from '../Portal'

import type { ThunkDispatch } from '/protocol-designer/types'

interface EditLabwareQuantityModalProps {
  allLabwareIdsOnStack: string[]
  labwareId: string
  onClose: () => void
  isOnHopper: boolean
}
export function EditLabwareQuantityModal(
  props: EditLabwareQuantityModalProps
): JSX.Element {
  const { onClose, allLabwareIdsOnStack, labwareId, isOnHopper } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const labwareEntities = useSelector(getLabwareEntities)
  const labwareDefsByUri = useSelector(getLabwareDefsByURI)
  const { labwareDefURI, def } = labwareEntities[labwareId]
  const labwareOfPrimaryURIOnStack = allLabwareIdsOnStack.filter(id =>
    id.includes(labwareDefURI)
  )
  const initialQuantity = labwareOfPrimaryURIOnStack.length
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
  const lidDefinition = labwareDefinitionsInGroup.find(def =>
    def.allowedRoles?.includes('lid')
  )
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
        marginLeft="0"
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
