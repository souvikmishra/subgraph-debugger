'use client';

import { useRef, useEffect } from 'react';
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
  const { resolvedTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  // Update editor theme when theme changes
  useEffect(() => {
    if (editorRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const monaco = (window as any).monaco;
      if (monaco) {
        const newTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light';
        monaco.editor.setTheme(newTheme);
      }
    }
  }, [resolvedTheme]);

  const editorTheme =
    resolvedTheme === 'dark'
      ? 'vs-dark'
      : resolvedTheme === 'light'
      ? 'vs-light'
      : 'vs-dark';

  return (
    <div className={className}>
      <Editor
        height="200px"
        defaultLanguage="graphql"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={editorTheme}
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
        }}
      />
    </div>
  );
}
