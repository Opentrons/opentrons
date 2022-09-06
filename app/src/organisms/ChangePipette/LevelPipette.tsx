import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_FLEX_END,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'

import type { Mount } from '../../redux/pipettes/types'

interface LevelPipetteProps {
  mount: Mount
  pipetteModelName: string
  back: () => void
  confirm: () => void
}

function LevelingVideo(props: {
  pipetteName: string
  mount: Mount
}): JSX.Element {
  const { pipetteName, mount } = props
  return (
    <video
      css={css`
        width: 100%;
        max-height: 15rem;
        margin-top: ${SPACING.spacing4};
        margin-left: ${SPACING.spacing4};
      `}
      autoPlay={true}
      loop={true}
      controls={true}
    >
      <source
        src={require(`../../assets/videos/pip-leveling/${pipetteName}-${mount}.webm`)}
      />
    </video>
  )
}

export function LevelPipette(props: LevelPipetteProps): JSX.Element {
  const { mount, pipetteModelName, back, confirm } = props

  const { t } = useTranslation('change_pipette')

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingX={SPACING.spacing6}
        paddingTop={SPACING.spacing6}
        height="100%"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Trans
              t={t}
              i18nKey={'level_the_pipette'}
              components={{
                bold: <strong />,
                h1: <StyledText as="h1" marginBottom={SPACING.spacing4} />,
                block: (
                  <StyledText
                    css={css`
                      display: list-item;
                    `}
                    marginLeft={SPACING.spacing6}
                    as="p"
                  />
                ),
              }}
            />
          </Flex>
          <LevelingVideo pipetteName={pipetteModelName} mount={mount} />
        </Flex>
      </Flex>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginBottom={SPACING.spacing6}
        marginX={SPACING.spacing6}
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing6}
      >
        <Btn onClick={back}>
          <StyledText
            css={TYPOGRAPHY.pSemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            color={COLORS.darkGreyEnabled}
          >
            {t('go_back')}
          </StyledText>
        </Btn>
        <PrimaryButton onClick={confirm}>{t('confirm_level')}</PrimaryButton>
      </Flex>
    </>
  )
}
