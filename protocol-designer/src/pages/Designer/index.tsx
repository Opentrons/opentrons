import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  Flex,
  INFO_TOAST,
  OVERFLOW_HIDDEN,
  useOnClickOutside,
} from '@opentrons/components'

import { NAV_BAR_HEIGHT_REM } from '../../components/atoms/constants'
import { DefineLiquidsModal } from '../../components/organisms'
import { useKitchen } from '../../components/organisms/Kitchen/useKitchen'
import { LiquidsOverflowMenu } from '../../components/organisms/LiquidsOverflowMenu'
import { getFileMetadata } from '../../file-data/selectors'
import { generateNewProtocol } from '../../labware-ingred/actions'
import { selectors } from '../../labware-ingred/selectors'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { ProtocolSteps } from './ProtocolSteps'

import type { ReactNode } from 'react'
import type { CutoutId } from '@opentrons/shared-data'
import type { DeckSlot } from '@opentrons/step-generation'

export interface OpenSlot {
  cutoutId: CutoutId
  slot: DeckSlot
}

export function Designer(): ReactNode {
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
  const [targetWidth, setTargetWidth] = useState<number>(235)

  const { modules, additionalEquipmentOnDeck } = deckSetup

  const hasHardware =
    (modules != null && Object.values(modules).length > 0) ||
    // greater than 1 to account for the default loaded trashBin
    Object.values(additionalEquipmentOnDeck).length > 1

  // only display toast if its a newly made protocol and has hardware
  useEffect(
    () => {
      if (hasHardware && isNewProtocol) {
        bakeToast(t('add_rest') as string, INFO_TOAST, {
          heading: t('we_added_hardware'),
          closeButton: true,
        })
        dispatch(generateNewProtocol({ isNewProtocol: false }))
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(
    () => {
      if (fileMetadata?.created == null) {
        console.warn(
          'fileMetadata was refreshed while on the designer page, redirecting to landing page'
        )
        navigate('/')
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileMetadata]
  )

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
          targetWidth={targetWidth}
        />
      ) : null}
      <Flex
        height="100%"
        maxHeight={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem )`}
        width="100%"
        overflowY={OVERFLOW_HIDDEN}
      >
        <ProtocolSteps
          zoomedInSlot={zoomIn.slot}
          showLiquidOverflowMenu={showLiquidOverflowMenu}
          targetWidth={targetWidth}
          setTargetWidth={setTargetWidth}
          showDefineLiquidModal={showDefineLiquidModal}
        />
      </Flex>
    </>
  )
}
