import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { apiClient } from '../api';
import { secureStorage } from '../storage/secureStorage';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function downloadAndShareExcel(params: {
  endpointPath: string;
  fileName: string;
  title: string;
}) {
  const baseUrl = (apiClient.defaults.baseURL || '').replace(/\/+$/, '');
  const cleanPath = params.endpointPath.startsWith('/')
    ? params.endpointPath
    : `/${params.endpointPath}`;
  const url = `${baseUrl}${cleanPath}`;
  const tokens = await secureStorage.getTokens();
  const safeName = params.fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const destPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${safeName}.xlsx`;

  const res = await ReactNativeBlobUtil.config({
    fileCache: true,
    path: destPath,
  }).fetch('GET', url, {
    ...(tokens?.accessToken
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : {}),
  });

  const status = res.info().status;
  if (status < 200 || status >= 300) {
    throw new Error(`Failed to generate Excel report (HTTP ${status})`);
  }

  await Share.open({
    title: params.title,
    url: `file://${res.path()}`,
    type: XLSX_MIME,
    filename: `${safeName}.xlsx`,
    failOnCancel: false,
  });
}
