'use client';

import { useEffect } from 'react';
import { useQuill } from 'react-quilljs';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write content...',
  disabled = false,
}: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ header: [2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'list',
    'link',
  ];

  const { quill, quillRef } = useQuill({
    theme: 'snow',
    modules,
    formats,
    placeholder,
  });

  useEffect(() => {
    if (!quill) return;
    quill.enable(!disabled);
  }, [quill, disabled]);

  useEffect(() => {
    if (!quill) return;
    const current = quill.root.innerHTML;
    if ((value || '') !== current) {
      quill.clipboard.dangerouslyPasteHTML(value || '');
    }
  }, [quill, value]);

  useEffect(() => {
    if (!quill) return;

    const handler = () => {
      onChange(quill.root.innerHTML);
    };

    quill.on('text-change', handler);
    return () => {
      quill.off('text-change', handler);
    };
  }, [quill, onChange]);

  return (
    <div className="policy-quill rounded-md border border-gray-300 bg-white [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[220px] [&_.ql-editor]:text-sm [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-editor_a]:text-blue-600 [&_.ql-editor_a]:underline">
      <div ref={quillRef} />
    </div>
  );
}
