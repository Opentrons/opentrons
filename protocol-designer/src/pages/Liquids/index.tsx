import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { useOnClickOutside } from '@opentrons/components'

import {
  AssignLiquidsModalContainer,
  DefineLiquidsModal,
} from '../../components/organisms'
import { LiquidsOverflowMenu } from '../../components/organisms/LiquidsOverflowMenu'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'

import type { ReactNode } from 'react'

export function Liquids(): ReactNode {
  const navigate = useNavigate()
  const selectedLabware = useSelector(
    labwareIngredSelectors.getSelectedLabwareId
  )
  const [liquidOverflowMenu, showLiquidOverflowMenu] = useState<boolean>(false)
  const [showDefineLiquidModal, setDefineLiquidModal] = useState<boolean>(false)
  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      if (!showDefineLiquidModal) {
        showLiquidOverflowMenu(false)
      }
    },
  })

  useEffect(() => {
    if (selectedLabware == null) {
      console.warn('selectedLabware was lost, navigate to designer page')
      navigate('/designer')
    }
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

      <AssignLiquidsModalContainer
        showLiquidOverflowMenu={showLiquidOverflowMenu}
        setDefineLiquidModal={setDefineLiquidModal}
      />
    </>
  )
}
