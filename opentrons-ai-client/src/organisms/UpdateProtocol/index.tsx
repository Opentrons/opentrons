import styled from 'styled-components'
import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  InputField,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  LargeButton,
  StyledText,
  Link as LinkComponent,
  DropdownMenu,
} from '@opentrons/components'
import type { DropdownOption } from '@opentrons/components'
import { UploadInput } from '../../molecules/UploadInput'
import { HeaderWithMeter } from '../../molecules/HeaderWithMeter'
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FileUpload } from '../../molecules/FileUpload'

const updateOptions: DropdownOption[] = [
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

const HeadingText = styled(StyledText).attrs({
  desktopStyle: 'headingSmallBold',
})``

const BodyText = styled(StyledText).attrs({
  color: COLORS.grey60,
  desktopStyle: 'bodyDefaultRegular',
  paddingBottom: '8px',
  paddingTop: '16px',
})``

const isValidProtocolFileName = (protocolFileName: string): boolean => {
  return protocolFileName.endsWith('.py')
}

export function UpdateProtocol(): JSX.Element {
  const { t }: { t: (key: string) => string } = useTranslation(
    'protocol_generator'
  )
  const [progressPercentage, setProgressPercentage] = useState<number>(0.0)
  const [updateType, setUpdateType] = useState<DropdownOption | null>(null)
  const [detailsValue, setDetailsValue] = useState<string>('')
  const [fileValue, setFile] = useState<File | null>(null)
  const [pythonText, setPythonTextValue] = useState<string>('')
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    let progress = 0.0
    if (updateType !== null) {
      progress += 0.33
    }

    if (detailsValue !== '') {
      progress += 0.33
    }

    if (pythonText !== '' && fileValue !== null && errorText === null) {
      progress += 0.34
    }

    setProgressPercentage(progress)
  }, [updateType, detailsValue, pythonText, errorText, fileValue])

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setDetailsValue(event.target.value)
  }

  const handleFileUpload = async (
    file: File & { name: string }
  ): Promise<void> => {
    if (isValidProtocolFileName(file.name)) {
      const text = await file.text().catch(error => {
        console.error('Error reading file:', error)
        setErrorText(t('python_file_read_error'))
      })

      if (typeof text === 'string' && text !== '') {
        setErrorText(null)
        setPythonTextValue(text)
      } else {
        setErrorText(t('file_length_error'))
      }

      setFile(file)
    } else {
      setErrorText(t('python_file_type_error'))
      setFile(file)
    }
  }

  return (
    <Container>
      <HeaderWithMeter
        progressPercentage={progressPercentage}
      ></HeaderWithMeter>
      <Spacer />
      <ContentBox>
        <HeadingText>{t('update_existing_protocol')}</HeadingText>
        <BodyText>{t('protocol_file')}</BodyText>
        <Flex
          paddingTop={fileValue !== null ? '8px' : '40px'}
          width="auto"
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_CENTER}
        >
          {fileValue !== null ? (
            <Flex width="100%" flexDirection={DIRECTION_COLUMN}>
              <FileUpload
                file={fileValue}
                fileError={errorText}
                handleClick={function (): void {
                  setFile(null)
                  setErrorText(null)
                }}
              ></FileUpload>
            </Flex>
          ) : (
            <UploadInput
              uploadButtonText={t('choose_file')}
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
              onUpload={async function (file: File) {
                try {
                  await handleFileUpload(file)
                } catch (error) {
                  // todo perhaps make this a toast?
                  console.error('Error uploading file:', error)
                }
              }}
            />
          )}
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} width="100%">
          <DropdownMenu
            title={t('type_of_update')}
            width="100%"
            dropdownType="neutral"
            filterOptions={updateOptions}
            currentOption={
              updateType ?? {
                value: '',
                name: 'Select an option',
              }
            }
            onClick={value => {
              const selectedOption = updateOptions.find(v => v.value === value)
              if (selectedOption != null) {
                setUpdateType(selectedOption)
              }
            }}
          />
        </Flex>
        <BodyText>{t('provide_details_of_changes')}</BodyText>
        <InputField
          value={detailsValue}
          onChange={handleInputChange}
          size="medium"
        />
        <Flex
          paddingTop="40px"
          width="auto"
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_END}
        >
          <LargeButton
            disabled={progressPercentage !== 1.0}
            buttonText={t('submit_prompt')}
          />
        </Flex>
      </ContentBox>
    </Container>
  )
}
