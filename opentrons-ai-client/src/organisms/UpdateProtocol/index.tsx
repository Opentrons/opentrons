import styled from 'styled-components'
import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DropdownField,
  Flex,
  InputField,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  LargeButton,
  StyledText,
  Link as LinkComponent,
} from '@opentrons/components'
import { UploadInput } from '../../molecules/UploadInput'
import { HeaderWithMeter } from '../../molecules/HeaderWithMeter'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'

const updateOptions = [
  {
    name: 'Adapt Python protocol from OT-2 to Flex',
    value: 'adapt_python_protocol',
  },
  { name: 'Change labware', value: 'change_labware' },
  { name: 'Change pipettes', value: 'change_pipettes' },
  { name: 'Other', value: 'other' },
]

const Container = styled(Flex)`
  width: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${JUSTIFY_CENTER};
`

const Spacer = styled(Flex)`
  height: 16px;
`

const ContentBox = styled(Flex)`
  background-color: white;
  border-radius: 16px;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  padding: 32px 24px;
  width: 60%;
`

const ContentFlex = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
`

const HeadingText = styled(StyledText).attrs({
  desktopStyle: 'headingSmallBold',
})``

const BodyText = styled(StyledText).attrs({
  desktopStyle: 'bodyDefaultRegular',
  paddingBottom: '8px',
  paddingTop: '16px',
})``

export function UpdateProtocol(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const [detailsValue, setDetailsValue] = useState<string>('')

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setDetailsValue(event.target.value)
  }

  return (
    <Container>
      <HeaderWithMeter progressPercentage={0.5}></HeaderWithMeter>
      <Spacer />
      <ContentBox>
        <ContentFlex>
          <HeadingText>{t('update_existing_protocol')}</HeadingText>
          <BodyText>{t('protocol_file')}</BodyText>
          <Flex
            paddingTop="40px"
            width="auto"
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_CENTER}
          >
            <UploadInput
              uploadButtonText="Choose file"
              dragAndDropText={
                <StyledText as="p">
                  <Trans
                    t={t}
                    i18nKey={t('drag_and_drop')}
                    components={{
                      a: (
                        <LinkComponent
                          color={COLORS.blue55}
                          role="button"
                          to={''}
                        />
                      ),
                    }}
                  />
                </StyledText>
              }
              onUpload={function (file: File): unknown {
                throw new Error('Function not implemented.')
              }}
            ></UploadInput>
          </Flex>

          <BodyText>{t('type_of_update')}</BodyText>
          <DropdownField
            options={updateOptions}
            onChange={function (event: ChangeEvent<HTMLSelectElement>): void {
              throw new Error('Function not implemented.')
            }}
          />
          <BodyText>{t('provide_details_of_changes')}</BodyText>
          <InputField value={detailsValue} onChange={handleInputChange} />
          <Flex
            paddingTop="40px"
            width="auto"
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_END}
          >
            <LargeButton buttonText={t('submit_prompt')} />
          </Flex>
        </ContentFlex>
      </ContentBox>
    </Container>
  )
}
