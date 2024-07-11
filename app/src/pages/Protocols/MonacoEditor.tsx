import React, { useRef, useState } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

interface MonacoEditorProps {
  initialValue: string
  language: string
  theme?: string
  onChange?: (value: string | undefined) => void
}

function MonacoEditor({
  initialValue,
  language,
  theme = 'vs-dark',
  onChange,
}: MonacoEditorProps): JSX.Element {
  const editorRef = useRef<any>(null)
  const [editorValue, setEditorValue] = useState<string>(initialValue)

  const handleEditorDidMount: OnMount = editor => {
    editorRef.current = editor
  }

  const handleEditorChange = (value: string | undefined) => {
    setEditorValue(value || '')
    if (onChange) {
      onChange(value)
    }
  }

  return (
    <Editor
      height="90vh"
      defaultLanguage={language}
      defaultValue={initialValue}
      theme={theme}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
    />
  )
}

export default MonacoEditor
