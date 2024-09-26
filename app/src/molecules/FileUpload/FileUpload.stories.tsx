import type * as React from 'react'
import testFile from './__tests__/test-file.png'
import { FileUpload } from '.'

import type { StoryFn, Meta } from '@storybook/react'

const file = new File([testFile], 'a-file-to-test.png')
const handleClick = (): void => {
  console.log('clicked the file')
}

export default {
  title: 'App/Molecules/FileUpload',
  component: FileUpload,
} as Meta

const FileUploadTemplate: StoryFn<
  React.ComponentProps<typeof FileUpload>
> = args => <FileUpload {...args} />

export const FileUploadComponent = FileUploadTemplate.bind({})
FileUploadComponent.args = {
  file,
  fileError: null,
  handleClick,
}

export const FileUploadError = FileUploadTemplate.bind({})
FileUploadError.args = {
  file,
  fileError: 'a terrible file',
  handleClick,
}
