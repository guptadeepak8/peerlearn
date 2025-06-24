"use client";
import MonacoEditor from "react-monaco-editor";
import * as monacoEditor from "monaco-editor";


export function RoomEditor({
  code,
  onCodeChange,
  editorRef,
}: {
  code: string;
  onCodeChange: (code: string) => void;
  editorRef: React.RefObject<monacoEditor.editor.IStandaloneCodeEditor | null>;
}) {
  return (
    
      <MonacoEditor
        language="javascript"
        theme="vs-dark"
        value={code}
        onChange={onCodeChange}
        editorDidMount={(editor) => {
          editorRef.current = editor;
        }}
      />

  );
}
