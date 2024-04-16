import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
  Flex,
  SPACING,
  StyledText,
  DeckConfigurator,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import { ChildNavigation } from '../ChildNavigation'

interface CreateNewTransferProps {
  onNext: () => void
  exitButtonProps: React.ComponentProps<typeof SmallButton>
}

export function CreateNewTransfer(props: CreateNewTransferProps): JSX.Element {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const deckConfig = useDeckConfigurationQuery().data ?? []
  return (
    <Flex>
      <ChildNavigation
        header={t('create_new_transfer')}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickButton={props.onNext}
        secondaryButtonProps={props.exitButtonProps}
        top={SPACING.spacing8}
      />
      <Flex
        marginTop={SPACING.spacing80}
        flexDirection={DIRECTION_COLUMN}
        padding={`0 ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
      >
        <Flex gridGap={SPACING.spacing16}>
          <Flex
            width="50%"
            paddingTop={SPACING.spacing32}
            marginTop={SPACING.spacing32}
            flexDirection={DIRECTION_COLUMN}
          >
            <Trans
              t={t}
              i18nKey="use_deck_slots"
              components={{
                block: (
                  <StyledText
                    css={TYPOGRAPHY.level4HeaderRegular}
                    marginBottom={SPACING.spacing16}
                  />
                ),
              }}
            />
          </Flex>
          <Flex width="50%">
            <DeckConfigurator
              deckConfig={deckConfig}
              readOnly
              handleClickAdd={() => {}}
              handleClickRemove={() => {}}
              additionalStaticFixtures={[
                { location: 'cutoutB2', label: t('tip_rack') },
                { location: 'cutoutC2', label: t('labware') },
                { location: 'cutoutD2', label: t('labware') },
              ]}
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
