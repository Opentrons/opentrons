import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  StyledText,
  useOnClickOutside,
} from '@opentrons/components'
import {
  AssignLiquidsModal,
  DefineLiquidsModal,
  ProtocolMetadataNav,
} from '../../organisms'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { LiquidsOverflowMenu } from '../Designer/LiquidsOverflowMenu'

export function Liquids(): JSX.Element {
  const { t } = useTranslation('starting_deck_state')
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
      console.warn('selectedLabware was lost, navigate to deisgner page')
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

      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex padding={SPACING.spacing12}>
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
            <ProtocolMetadataNav />
            <PrimaryButton
              onClick={() => {
                showLiquidOverflowMenu(true)
              }}
            >
              <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                <Icon size="1rem" name="liquid" />
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('liquids')}
                </StyledText>
              </Flex>
            </PrimaryButton>
          </Flex>
        </Flex>
        <AssignLiquidsModal />
      </Flex>
    </>
  )
}
