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
  createContainer,
  deleteContainer,
} from '../../../labware-ingred/actions'
import { getLabwareEntities } from '../../../step-forms/selectors'
import { maskToPositiveInteger } from '../../../steplist/fieldLevel/processing'
import { HandleEnter } from '../../atoms'
import { getMainPagePortalEl } from '../Portal'

import type { ThunkDispatch } from '../../../types'

interface EditLabwareQuantityModalProps {
  allLabwareIdsOnStack: string[]
  labwareId: string
  onClose: () => void
}
export function EditLabwareQuantityModal(
  props: EditLabwareQuantityModalProps
): JSX.Element {
  const { onClose, allLabwareIdsOnStack, labwareId } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const labwareEntities = useSelector(getLabwareEntities)
  const { labwareDefURI, def } = labwareEntities[labwareId]
  const stackingLimit = def.stackLimit ?? 0
  const initialQuantity = allLabwareIdsOnStack.length
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
    const arrayOfLabwareDefURI = Array(parseInt(quantity) - 1).fill(
      labwareDefURI
    )
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
