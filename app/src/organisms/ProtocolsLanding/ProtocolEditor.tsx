import React, { useState, useCallback } from 'react'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { LegacyModal } from '../../molecules/LegacyModal'
import MonacoEditor from '../../pages/Protocols/MonacoEditor'

export function ProtocolEditor(): JSX.Element {
  const [fileContent, setFileContent] = useState<string>(
    '# Your Python code here'
  )

  const handleFileChange = useCallback((content: string | undefined) => {
    if (content !== undefined) {
      setFileContent(content)
    }
  }, [])

  const handleSave = useCallback(() => {
    // Here you would implement the logic to save the file
    console.log('Saving file:', fileContent)
    // You might want to use Electron's IPC here to communicate with the main process
    // and actually save the file to the filesystem
  }, [fileContent])

  const handleLoad = useCallback(() => {
    // Here you would implement the logic to load a file
    // For now, we'll just simulate loading a file
    const loadedContent =
      '# This is a loaded Python file\n\nprint("Hello, World!")'
    setFileContent(loadedContent)
    // In a real application, you'd use Electron's IPC to load the file from the filesystem
  }, [])

  return (
    <LegacyModal
      // fullPage={true}
      title={'Edit Protocol'}
      width={'100%'}
      height="50rem"
    >
      <Flex width="100%" height="100%" flexDirection={DIRECTION_COLUMN}>
        <Flex gridGap={SPACING.spacing16}>
          <button onClick={handleLoad}>Load File</button>
          <button onClick={handleSave}>Save File</button>
        </Flex>
        <MonacoEditor
          initialValue={fileContent}
          language="python"
          onChange={handleFileChange}
        />
      </Flex>
    </LegacyModal>
  )
}
