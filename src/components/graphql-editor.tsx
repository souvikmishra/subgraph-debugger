'use client';

import { useRef } from 'react';
import { useTheme } from 'next-themes';
import Editor from '@monaco-editor/react';

interface GraphQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function GraphQLEditor({
  value,
  onChange,
  className = '',
}: GraphQLEditorProps) {
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className={className}>
      <Editor
        height="200px"
        defaultLanguage="graphql"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
          },
          automaticLayout: true,
          wordWrap: 'on',
          theme: theme === 'dark' ? 'vs-dark' : 'vs-light',
        }}
      />
    </div>
  );
}
