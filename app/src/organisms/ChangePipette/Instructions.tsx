import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { shouldLevel } from '@opentrons/shared-data'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  Btn,
  COLORS,
  TYPOGRAPHY,
  DIRECTION_ROW,
  ALIGN_FLEX_END,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'
import { CheckPipettesButton } from './CheckPipettesButton'
import { InstructionStep } from './InstructionStep'
import { PipetteSelection } from './PipetteSelection'
import { LevelPipette } from './LevelPipette'

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
  stepPage: number
  setStepPage: React.Dispatch<React.SetStateAction<number>>
}

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
    stepPage,
    setStepPage,
    confirm,
  } = props
  const { t } = useTranslation('change_pipette')

  const channels = actualPipette
    ? actualPipette.channels
    : wantedPipette?.channels || 1

  const stepOne = direction === 'detach' ? 'loosen_the_screws' : 'insert_screws'
  const stepTwo =
    direction === 'detach' ? 'remove_pipette' : 'attach_the_pipette'
  const noPipetteSelected = direction === 'attach' && wantedPipette === null

  //  hide continue button if no pipette is selected
  const continueButton = noPipetteSelected ? null : (
    <PrimaryButton onClick={() => setStepPage(1)}>
      {t('continue')}
    </PrimaryButton>
  )

  return (
    <>
      {!actualPipette && !wantedPipette && (
        <Flex
          paddingX={SPACING.spacing6}
          paddingTop={SPACING.spacing6}
          marginBottom="12.9rem"
        >
          {direction === 'attach' ? (
            <PipetteSelection onPipetteChange={setWantedName} />
          ) : null}
        </Flex>
      )}
      {stepPage < 2 ? (
        <>
          {(actualPipette || wantedPipette) && (
            <Flex
              paddingX={SPACING.spacing6}
              paddingTop={SPACING.spacing6}
              height="100%"
            >
              <InstructionStep
                diagram={stepPage === 0 ? 'screws' : 'tab'}
                {...{ direction, mount, channels, displayCategory }}
              >
                <Flex flexDirection={DIRECTION_COLUMN}>
                  <Trans
                    t={t}
                    i18nKey={stepPage === 0 ? stepOne : stepTwo}
                    components={{
                      h1: (
                        <StyledText as="h1" marginBottom={SPACING.spacing4} />
                      ),
                      block: <StyledText as="p" />,
                    }}
                  />
                  {direction === 'attach' && stepPage === 0 ? (
                    channels === 8 ? (
                      <Flex flexDirection={DIRECTION_ROW}>
                        <Trans
                          t={t}
                          i18nKey="tighten_screws_multi"
                          components={{
                            strong: <strong />,
                            block: (
                              <StyledText as="p" marginTop={SPACING.spacing4} />
                            ),
                          }}
                        />
                      </Flex>
                    ) : (
                      <StyledText marginTop={SPACING.spacing4} as="p">
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
            marginBottom={SPACING.spacing6}
            marginX={SPACING.spacing6}
            alignSelf={ALIGN_FLEX_END}
            //  spacing changes to keep buttons at same height across pages
            marginTop={stepPage === 0 ? SPACING.spacingSS : '8rem'}
          >
            <Btn
              onClick={stepPage === 0 ? back : () => setStepPage(stepPage - 1)}
            >
              <StyledText
                css={TYPOGRAPHY.pSemiBold}
                textTransform={TYPOGRAPHY.textTransformCapitalize}
                color={COLORS.darkGreyEnabled}
              >
                {t('go_back')}
              </StyledText>
            </Btn>
            {stepPage === 0 ? (
              continueButton
            ) : (
              <CheckPipettesButton
                robotName={robotName}
                onDone={
                  wantedPipette != null &&
                  actualPipette != null &&
                  shouldLevel(wantedPipette)
                    ? () => setStepPage(2)
                    : confirm
                }
              >
                {actualPipette
                  ? t('confirm_detachment')
                  : t('confirm_attachment')}
              </CheckPipettesButton>
            )}
          </Flex>
        </>
      ) : (
        <LevelPipette
          mount={mount}
          pipetteModelName={actualPipette ? actualPipette.name : ''}
          confirm={confirm}
          back={back}
        />
      )}
    </>
  )
}
