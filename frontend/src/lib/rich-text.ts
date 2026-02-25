export function sanitizeRichTextHtml(input: string): string {
  if (!input) return '';

  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/javascript:/gi, '');
}

export function richTextHasMeaningfulContent(input: string): boolean {
  if (!input) return false;

  const plainText = sanitizeRichTextHtml(input)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<\/h[1-6]>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText.length > 0;
}
