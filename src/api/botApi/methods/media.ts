import { ApiMediaFormat } from '../../types';

import { fetchBotFileBlob, getBotFileIdFromUrl, isBotFileUrl } from '../client';

export async function downloadBotMedia({
  url,
  mediaFormat,
}: {
  url: string;
  mediaFormat: ApiMediaFormat;
}) {
  if (!isBotFileUrl(url)) {
    return undefined;
  }

  const fileId = getBotFileIdFromUrl(url);
  const blob = await fetchBotFileBlob(fileId);
  if (!blob) {
    return undefined;
  }

  if (mediaFormat === ApiMediaFormat.BlobUrl) {
    return {
      dataBlob: blob,
      mimeType: blob.type,
      fullSize: blob.size,
    };
  }

  if (mediaFormat === ApiMediaFormat.Text) {
    return {
      dataBlob: await blob.text(),
      mimeType: blob.type,
      fullSize: blob.size,
    };
  }

  return {
    dataBlob: blob,
    mimeType: blob.type,
    fullSize: blob.size,
  };
}
