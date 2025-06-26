import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CSSTransition } from 'react-transition-group'
import { useAtom } from 'jotai'
import styled from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DropdownMenu,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  LargeButton,
  Link as LinkComponent,
  StyledText,
} from '@opentrons/components'

import { TextAreaField } from '../../atoms/TextAreaField'
import { FileUpload } from '../../molecules/FileUpload'
import { UploadInput } from '../../molecules/UploadInput'
import {
  chatDataAtom,
  chatHistoryAtom,
  createProtocolChatAtom,
  headerWithMeterAtom,
  updateProtocolChatAtom,
} from '../../resources/atoms'
import { useTrackEvent } from '../../resources/hooks/useTrackEvent'

import type { ChangeEvent } from 'react'
import type { DropdownOption } from '@opentrons/components'
import type { UpdateOptions } from '../../resources/types'

interface UpdateOptionsDropdown extends DropdownOption {
  value: UpdateOptions
}

const FadeWrapper = styled.div`
  &.fade-enter {
    opacity: 0;
  }
  &.fade-enter-active {
    opacity: 1;
    transition: opacity 1000ms;
  }
  &.fade-exit {
    height: 100%;
    opacity: 1;
  }
  &.fade-exit-active {
    opacity: 0;
    height: 0%;
    transition: opacity 1000ms;
  }
`

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
  const navigate = useNavigate()
  const trackEvent = useTrackEvent()
  const { t } = useTranslation('protocol_generator')
  const [headerState, setHeaderWithMeterAtom] = useAtom(headerWithMeterAtom)
  const [updateType, setUpdateType] = useState<DropdownOption | null>(null)
  const [detailsValue, setDetailsValue] = useState<string>('')
  const [, setUpdateProtocolChatAtom] = useAtom(updateProtocolChatAtom)
  const [, setCreateProtocolChatAtom] = useAtom(createProtocolChatAtom)
  const [, setChatHistoryAtom] = useAtom(chatHistoryAtom)
  const [, setChatData] = useAtom(chatDataAtom)
  const [fileValue, setFile] = useState<File | null>(null)
  const [pythonText, setPythonTextValue] = useState<string>('')
  const [errorText, setErrorText] = useState<string | null>(null)
  const progressIncrement = 1 / 3

  const updateOptions: UpdateOptionsDropdown[] = [
    {
      name: t('update_option_adapt_python_protocol'),
      value: 'adapt_python_protocol',
    },
    {
      name: t('update_option_add_runtime_parameters'),
      value: 'add_runtime_parameters',
    },
    { name: t('update_option_change_labware'), value: 'change_labware' },
    { name: t('update_option_change_pipettes'), value: 'change_pipettes' },
    { name: t('update_option_other'), value: 'other' },
  ]
  // Reset the chat data atom and protocol atoms when navigating to the update protocol page
  useEffect(() => {
    setCreateProtocolChatAtom({
      prompt: '',
      regenerate: false,
      scientific_application_type: '',
      description: '',
      robots: 'opentrons_flex',
      mounts: [],
      flexGripper: false,
      modules: [],
      labware: [],
      liquids: [],
      steps: [],
      fake: false,
    })
    setUpdateProtocolChatAtom({
      prompt: '',
      protocol_text: '',
      regenerate: false,
      update_type: 'adapt_python_protocol',
      update_details: '',
      fake: false,
    })
    setChatHistoryAtom([])
    setChatData([])
  }, [
    setCreateProtocolChatAtom,
    setUpdateProtocolChatAtom,
    setChatHistoryAtom,
    setChatData,
  ])

  useEffect(() => {
    let progress = 0.0
    if (updateType !== null) {
      progress += progressIncrement
    }

    if (detailsValue !== '') {
      progress += progressIncrement
    }

    // File upload is required for all update options
    if (pythonText !== '' && fileValue !== null && errorText === null) {
      progress += progressIncrement
    }

    setHeaderWithMeterAtom({
      displayHeaderWithMeter: true,
      progress,
    })
  }, [
    updateType,
    detailsValue,
    pythonText,
    errorText,
    fileValue,
    setHeaderWithMeterAtom,
    progressIncrement,
  ])

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setDetailsValue(event.target.value)
  }

  const handleFileUpload = async (
    file: File & { name: string }
  ): Promise<void> => {
    if (isValidProtocolFileName(file.name)) {
      const text = await file.text().catch((error: unknown) => {
        console.error('Error reading file:', error)
        setErrorText(String(t('python_file_read_error')))
        return undefined
      })

      if (typeof text === 'string' && text !== '') {
        setErrorText(null)
        setPythonTextValue(text)
      } else {
        setErrorText(String(t('file_length_error')))
      }

      setFile(file)
    } else {
      setErrorText(String(t('python_file_type_error')))
      setFile(file)
    }
  }

  function handleUpdateTypeSelect(value: string): void {
    const selectedOption = updateOptions.find(option => option.value === value)
    if (selectedOption != null) {
      setUpdateType(selectedOption)
    }
  }

  function processDataAndNavigateToChat(): void {
    // Format the prompt for all update types
    const originalCodeText =
      pythonText !== ''
        ? t('modify_python_code') +
          `\`\`\`python\n` +
          pythonText +
          `\n\`\`\`\n\n`
        : ''
    const updateTypeText = `${t('modify_type_of_update')}${
      updateType?.name
    }\n\n`
    const detailsText = `${t('modify_details_of_change')}${detailsValue}\n`
    const chatPrompt = `${originalCodeText}${updateTypeText}${detailsText}`

    setUpdateProtocolChatAtom({
      prompt: chatPrompt,
      protocol_text: pythonText,
      regenerate: false,
      update_type: (updateType?.value ?? 'other') as UpdateOptions,
      update_details: detailsValue,
      fake: false,
    })

    trackEvent({
      name: 'submit-prompt',
      properties: {
        isCreateOrUpdate: 'update',
        prompt: chatPrompt,
      },
    })

    navigate('/chat')
  }

  return (
    <Container>
      <Spacer />
      <ContentBox>
        <HeadingText>{t('update_existing_protocol')}</HeadingText>
        <BodyText>{t('protocol_file')}</BodyText>
        <Flex
          paddingTop={fileValue !== null ? '8px' : '40px'}
          width="auto"
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_CENTER}
        >
          <CSSTransition
            in={fileValue !== null}
            timeout={1000}
            classNames="fade"
            unmountOnExit
          >
            <FadeWrapper>
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
              ) : null}
            </FadeWrapper>
          </CSSTransition>

          <CSSTransition
            in={fileValue == null}
            timeout={300}
            classNames="fade"
            unmountOnExit
          >
            <FadeWrapper>
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
                            to=""
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
            </FadeWrapper>
          </CSSTransition>
        </Flex>
        <Flex height="1rem"></Flex>
        <Flex flexDirection={DIRECTION_COLUMN} width="100%">
          <DropdownMenu
            title={t('type_of_update')}
            width="100%"
            dropdownType="neutral"
            filterOptions={updateOptions}
            currentOption={
              updateType ?? {
                value: '',
                name: t('update_option_select'),
              }
            }
            onClick={handleUpdateTypeSelect}
          />
        </Flex>
        <BodyText>{t('provide_details_of_changes')}</BodyText>
        <TextAreaField
          value={detailsValue}
          onChange={handleInputChange}
          height="160px"
        />
        <Flex
          paddingTop="40px"
          width="auto"
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_END}
        >
          <LargeButton
            // TODO: fix this disabled increment logic
            disabled={headerState.progress !== 1.0}
            buttonText={t('submit_prompt')}
            onClick={processDataAndNavigateToChat}
          />
        </Flex>
      </ContentBox>
    </Container>
  )
}
