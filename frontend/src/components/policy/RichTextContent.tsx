import { sanitizeRichTextHtml } from '../../lib/rich-text';

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className = '' }: RichTextContentProps) {
  const safeHtml = sanitizeRichTextHtml(html || '');

  return (
    <div
      className={`text-sm leading-6 text-gray-800 [&_a]:text-blue-600 [&_a]:underline [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:list-disc ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml || '<p>-</p>' }}
    />
  );
}
