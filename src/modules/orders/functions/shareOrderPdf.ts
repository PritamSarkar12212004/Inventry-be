import ReactNativeBlobUtil from 'react-native-blob-util';
import Share, { Social } from 'react-native-share';
import { apiClient } from '../../../core/api';
import { secureStorage } from '../../../core/storage/secureStorage';

export async function downloadAndShareOrderPdf(params: {
  orderId: string;
  orderNumber: string;
  customerPhone?: string | null;
  viaWhatsApp?: boolean;
}) {
  const baseUrl = (apiClient.defaults.baseURL || '').replace(/\/+$/, '');
  const pdfUrl = `${baseUrl}/sales-orders/${params.orderId}/pdf`;
  const tokens = await secureStorage.getTokens();
  const safeName = (params.orderNumber || 'Invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
  const destPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${safeName}.pdf`;

  const res = await ReactNativeBlobUtil.config({
    fileCache: true,
    path: destPath,
  }).fetch('GET', pdfUrl, {
    ...(tokens?.accessToken
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : {}),
  });

  const status = res.info().status;
  if (status < 200 || status >= 300) {
    throw new Error(`Failed to generate PDF (HTTP ${status})`);
  }

  const fileUrl = `file://${res.path()}`;

  if (params.viaWhatsApp) {
    try {
      await Share.shareSingle({
        title: `Invoice ${params.orderNumber}`,
        url: fileUrl,
        type: 'application/pdf',
        filename: `${safeName}.pdf`,
        social: Social.Whatsapp,
      });
      return;
    } catch {
      // Fall back to system share sheet if WhatsApp direct intent is unavailable
    }
  }

  await Share.open({
    title: `Invoice ${params.orderNumber}`,
    url: fileUrl,
    type: 'application/pdf',
    filename: `${safeName}.pdf`,
    failOnCancel: false,
  });
}
