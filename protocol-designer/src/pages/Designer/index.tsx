import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Flex,
  INFO_TOAST,
  OVERFLOW_HIDDEN,
  useOnClickOutside,
} from '@opentrons/components'
import { useKitchen } from '../../components/organisms/Kitchen/hooks'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { generateNewProtocol } from '../../labware-ingred/actions'
import { DefineLiquidsModal } from '../../components/organisms'
import { getFileMetadata } from '../../file-data/selectors'
import { selectors } from '../../labware-ingred/selectors'
import { LiquidsOverflowMenu } from '../../components/organisms/LiquidsOverflowMenu'
import { ProtocolSteps } from './ProtocolSteps'

import type { CutoutId } from '@opentrons/shared-data'
import type { DeckSlot } from '@opentrons/step-generation'

export interface OpenSlot {
  cutoutId: CutoutId
  slot: DeckSlot
}

export function Designer(): JSX.Element {
  const { t } = useTranslation([
    'starting_deck_state',
    'protocol_steps',
    'shared',
  ])
  const { bakeToast } = useKitchen()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const fileMetadata = useSelector(getFileMetadata)
  const zoomIn = useSelector(selectors.getZoomedInSlot)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const isNewProtocol = useSelector(selectors.getIsNewProtocol)
  const [liquidOverflowMenu, showLiquidOverflowMenu] = useState<boolean>(false)
  const [showDefineLiquidModal, setDefineLiquidModal] = useState<boolean>(false)

  const { modules, additionalEquipmentOnDeck } = deckSetup

  const hasHardware =
    (modules != null && Object.values(modules).length > 0) ||
    // greater than 1 to account for the default loaded trashBin
    Object.values(additionalEquipmentOnDeck).length > 1

  // only display toast if its a newly made protocol and has hardware
  useEffect(() => {
    if (hasHardware && isNewProtocol) {
      bakeToast(t('add_rest') as string, INFO_TOAST, {
        heading: t('we_added_hardware'),
        closeButton: true,
      })
      dispatch(generateNewProtocol({ isNewProtocol: false }))
    }
  }, [])

  useEffect(() => {
    if (fileMetadata?.created == null) {
      console.warn(
        'fileMetadata was refreshed while on the designer page, redirecting to landing page'
      )
      navigate('/')
    }
  }, [fileMetadata])

  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      if (!showDefineLiquidModal) {
        showLiquidOverflowMenu(false)
      }
    },
  })

  return (
    <>
      {showDefineLiquidModal ? (
        <DefineLiquidsModal
          onClose={() => {
            setDefineLiquidModal(false)
          }}
        />
      ) : null}
      {liquidOverflowMenu ? (
        <LiquidsOverflowMenu
          overflowWrapperRef={overflowWrapperRef}
          onClose={() => {
            showLiquidOverflowMenu(false)
          }}
          showLiquidsModal={() => {
            showLiquidOverflowMenu(false)
            setDefineLiquidModal(true)
          }}
        />
      ) : null}
      <Flex height="100%" width="100%" overflowY={OVERFLOW_HIDDEN}>
        <ProtocolSteps
          isZoomedIn={zoomIn.slot != null}
          showLiquidOverflowMenu={showLiquidOverflowMenu}
        />
      </Flex>
    </>
  )
}
