// Мок для file-type модуля
export async function fileTypeFromBuffer(buffer: Buffer): Promise<{ mime: string } | undefined> {
  // Простая логика определения типа по magic numbers
  if (buffer.length === 0) {
    return undefined;
  }

  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mime: 'image/png' };
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg' };
  }

  // PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { mime: 'application/pdf' };
  }

  // TXT (текстовые файлы обычно не имеют magic numbers)
  // Возвращаем undefined для текстовых файлов
  return undefined;
}
