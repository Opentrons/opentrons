import * as React from 'react'
import { css } from 'styled-components'
import { Trans, useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  Btn,
  LEGACY_COLORS,
  COLORS,
  TYPOGRAPHY,
  DIRECTION_ROW,
  ALIGN_FLEX_END,
  PrimaryButton,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { CheckPipettesButton } from './CheckPipettesButton'
import { InstructionStep } from './InstructionStep'
import { PipetteSelection } from './PipetteSelection'

import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'
import type { Mount } from '../../redux/pipettes/types'
import type { Direction } from './types'

interface Props {
  robotName: string
  mount: Mount
  wantedPipette: PipetteNameSpecs | null
  actualPipette: PipetteModelSpecs | null
  displayCategory: PipetteDisplayCategory | null
  direction: Direction
  setWantedName: (name: string | null) => void
  back: () => void
  confirm: () => void
  currentStepCount: number
  nextStep: () => void
  prevStep: () => void
  attachedWrong: boolean
}

const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  color: ${LEGACY_COLORS.darkGreyEnabled};

  &:hover {
    opacity: 70%;
  }
`

export function Instructions(props: Props): JSX.Element {
  const {
    robotName,
    displayCategory,
    wantedPipette,
    actualPipette,
    setWantedName,
    direction,
    back,
    mount,
    currentStepCount,
    nextStep,
    prevStep,
    confirm,
  } = props
  const { t } = useTranslation('change_pipette')

  React.useEffect(() => {
    if (direction === 'detach' && currentStepCount === 0) {
      nextStep()
    }
  })

  const channels = actualPipette
    ? actualPipette.channels
    : wantedPipette?.channels || 1

  const stepOne = direction === 'detach' ? 'loosen_the_screws' : 'insert_screws'
  const stepTwo =
    direction === 'detach' ? 'remove_pipette' : 'attach_the_pipette'
  const noPipetteSelected = direction === 'attach' && wantedPipette === null

  //  hide continue button if no pipette is selected
  const continueButton = noPipetteSelected ? null : (
    <PrimaryButton onClick={() => nextStep()}>{t('continue')}</PrimaryButton>
  )

  return (
    <>
      {!actualPipette && !wantedPipette && (
        <Flex
          paddingX={SPACING.spacing32}
          paddingTop={SPACING.spacing32}
          marginBottom="12.8rem"
        >
          {direction === 'attach' &&
          currentStepCount === 0 &&
          wantedPipette === null ? (
            <PipetteSelection
              onPipetteChange={pipetteName => {
                setWantedName(pipetteName)
                nextStep()
              }}
            />
          ) : null}
        </Flex>
      )}
      {currentStepCount < 3 && (
        <>
          {(actualPipette || wantedPipette) && (
            <Flex
              paddingX={SPACING.spacing32}
              paddingTop={SPACING.spacing32}
              height="14.5rem"
            >
              <InstructionStep
                diagram={currentStepCount === 1 ? 'screws' : 'tab'}
                {...{ direction, mount, channels, displayCategory }}
              >
                <Flex flexDirection={DIRECTION_COLUMN}>
                  <Trans
                    t={t}
                    i18nKey={currentStepCount === 1 ? stepOne : stepTwo}
                    components={{
                      h1: (
                        <StyledText
                          css={TYPOGRAPHY.h1Default}
                          marginBottom={SPACING.spacing16}
                        />
                      ),
                      block: <StyledText as="p" />,
                    }}
                  />

                  {direction === 'attach' && currentStepCount === 1 ? (
                    channels === 8 ? (
                      <Flex flexDirection={DIRECTION_ROW}>
                        <Trans
                          t={t}
                          i18nKey="tighten_screws_multi"
                          components={{
                            strong: (
                              <strong
                                style={{
                                  fontWeight: TYPOGRAPHY.fontWeightSemiBold,
                                }}
                              />
                            ),
                            block: (
                              <StyledText
                                as="p"
                                marginTop={SPACING.spacing16}
                              />
                            ),
                          }}
                        />
                      </Flex>
                    ) : (
                      <StyledText marginTop={SPACING.spacing16} as="p">
                        {t('tighten_screws_single')}
                      </StyledText>
                    )
                  ) : null}
                </Flex>
              </InstructionStep>
            </Flex>
          )}
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginBottom={SPACING.spacing32}
            marginX={SPACING.spacing32}
            alignSelf={ALIGN_FLEX_END}
            marginTop="5.9rem"
          >
            <Btn
              onClick={() => {
                if (currentStepCount === 0) {
                  back()
                } else if (currentStepCount === 1) {
                  prevStep()
                  if (wantedPipette != null) setWantedName(null)
                  if (direction === 'detach') back()
                } else {
                  prevStep()
                }
              }}
            >
              <StyledText css={GO_BACK_BUTTON_STYLE}>{t('go_back')}</StyledText>
            </Btn>
            {currentStepCount < 2 ? (
              continueButton
            ) : (
              <CheckPipettesButton
                robotName={robotName}
                direction={direction}
                onDone={() => {
                  confirm()
                  nextStep()
                }}
              />
            )}
          </Flex>
        </>
      )}
    </>
  )
}
