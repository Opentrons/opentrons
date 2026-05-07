import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Btn,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  EmptySelectorButton,
  Flex,
  FLEX_MAX_CONTENT,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { HandleEnter, LINK_BUTTON_STYLE } from '../../components/atoms'
import { PipetteInfoItem, SelectPipetteModal } from '../../components/organisms'
import { WizardBody } from './WizardBody'

import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type { Gen, PipetteType, WizardTileProps } from './types'

export function SelectBasics(props: WizardTileProps): JSX.Element {
  const { setValue, proceed, watch } = props
  const { t } = useTranslation(['onboarding', 'shared'])
  const [mount, setMount] = useState<PipetteMount>('left')
  const [pipetteModal, openPipetteModal] = useState<boolean>(false)
  const [pipetteGen, setPipetteGen] = useState<Gen | 'flex'>('flex')
  const [pipetteVolume, setPipetteVolume] = useState<string | null>(null)
  const [selectedPipetteName, setSelectedPipetteName] = useState<string | null>(
    null
  )
  const [pipetteType, setPipetteType] = useState<PipetteType | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  const pipettesByMount = watch('pipettesByMount')

  const targetPipetteMount =
    pipettesByMount.left.pipetteName == null ||
    pipettesByMount.left.tiprackDefURI == null
      ? 'left'
      : 'right'
  const noPipette =
    (pipettesByMount.left.pipetteName == null ||
      pipettesByMount.left.tiprackDefURI == null) &&
    (pipettesByMount.right.pipetteName == null ||
      pipettesByMount.right.tiprackDefURI == null)

  const isDisabled = noPipette

  const resetPipetteFields = (): void => {
    setPipetteType(null)
    setPipetteGen('flex')
    setPipetteVolume(null)
  }

  const subStepNumber = noPipette ? 2 : 3

  const handleScrollToBottom = (): void => {
    if (ref.current != null) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
    }
  }

  useEffect(() => {
    handleScrollToBottom()
  }, [selectedPipetteName])

  const handleSwapMounts = (): void => {
    const leftPipetteName = pipettesByMount.left.pipetteName
    const rightPipetteName = pipettesByMount.right.pipetteName
    const leftTiprackDefURI = pipettesByMount.left.tiprackDefURI
    const rightTiprackDefURI = pipettesByMount.right.tiprackDefURI

    setValue('pipettesByMount.left.pipetteName', rightPipetteName)
    setValue('pipettesByMount.right.pipetteName', leftPipetteName)
    setValue('pipettesByMount.left.tiprackDefURI', rightTiprackDefURI)
    setValue('pipettesByMount.right.tiprackDefURI', leftTiprackDefURI)
  }

  useEffect(
    () => {
      if (selectedPipetteName != null) {
        setValue(`pipettesByMount.${mount}.pipetteName`, selectedPipetteName)
        openPipetteModal(false)
        setSelectedPipetteName(null)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPipetteName]
  )

  return (
    <>
      {pipetteModal ? (
        <SelectPipetteModal
          {...props}
          mount={mount}
          setPipetteGen={setPipetteGen}
          setPipetteVolume={setPipetteVolume}
          setPipetteType={setPipetteType}
          pipetteGen={pipetteGen}
          pipetteVolume={pipetteVolume}
          pipetteType={pipetteType}
          handleBack={() => {
            openPipetteModal(false)
          }}
          setSelectedPipetteName={setSelectedPipetteName}
        />
      ) : null}
      <HandleEnter onEnter={proceed}>
        <WizardBody
          stepNumber={1}
          subStepNumber={subStepNumber}
          header={t('basics')}
          disabled={isDisabled}
          proceed={() => {
            proceed(1)
          }}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
            >
              <StyledText desktopStyle="headingSmallBold">
                {noPipette ? t('add_your_pipettes') : t('your_pipettes')}
              </StyledText>
              {(pipettesByMount.left.pipetteName == null &&
                pipettesByMount.right.pipetteName == null) ||
              (pipettesByMount.left.tiprackDefURI == null &&
                pipettesByMount.right.tiprackDefURI == null) ? null : (
                <Btn
                  css={LINK_BUTTON_STYLE}
                  onClick={() => {
                    handleSwapMounts()
                  }}
                >
                  <Flex flexDirection={DIRECTION_ROW}>
                    <Icon
                      name="swap-horizontal"
                      size="1rem"
                      transform="rotate(90deg)"
                    />
                    <StyledText desktopStyle="captionSemiBold">
                      {t('swap_pipette_mounts')}
                    </StyledText>
                  </Flex>
                </Btn>
              )}
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
                {pipettesByMount.left.pipetteName != null &&
                pipettesByMount.left.tiprackDefURI != null ? (
                  <PipetteInfoItem
                    mount="left"
                    pipetteName={
                      pipettesByMount.left.pipetteName as PipetteName
                    }
                    tiprackDefURIs={pipettesByMount.left.tiprackDefURI}
                    editClick={() => {
                      setMount('left')
                      openPipetteModal(true)
                    }}
                    cleanForm={() => {
                      setValue(`pipettesByMount.left.pipetteName`, undefined)
                      setValue(`pipettesByMount.left.tiprackDefURI`, undefined)
                      resetPipetteFields()
                    }}
                  />
                ) : null}
                {pipettesByMount.right.pipetteName != null &&
                pipettesByMount.right.tiprackDefURI != null ? (
                  <PipetteInfoItem
                    mount="right"
                    pipetteName={
                      pipettesByMount.right.pipetteName as PipetteName
                    }
                    tiprackDefURIs={pipettesByMount.right.tiprackDefURI}
                    editClick={() => {
                      setMount('right')
                      openPipetteModal(true)
                    }}
                    cleanForm={() => {
                      setValue(`pipettesByMount.right.pipetteName`, undefined)
                      setValue(`pipettesByMount.right.tiprackDefURI`, undefined)
                      resetPipetteFields()
                    }}
                  />
                ) : null}
              </Flex>
              {pipettesByMount.left.pipetteName != null &&
              pipettesByMount.right.pipetteName != null &&
              pipettesByMount.left.tiprackDefURI != null &&
              pipettesByMount.right.tiprackDefURI != null ? null : (
                <Flex width={FLEX_MAX_CONTENT}>
                  <EmptySelectorButton
                    onClick={() => {
                      setMount(targetPipetteMount)
                      openPipetteModal(true)
                      resetPipetteFields()
                    }}
                    text={t('add_pipette')}
                    textAlignment="left"
                    iconName="plus"
                  />
                </Flex>
              )}
            </Flex>
          </Flex>
          {/* empty div for scrolling to bottom on form changes */}
          <div ref={ref} />
        </WizardBody>
      </HandleEnter>
    </>
  )
}
