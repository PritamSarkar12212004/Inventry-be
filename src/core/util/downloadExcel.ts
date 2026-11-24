import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { getApiOrigin } from '../api';
import { secureStorage } from '../storage/secureStorage';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function downloadAndShareExcel(params: {
  endpointPath: string;
  fileName: string;
  title: string;
}) {
  const origin = getApiOrigin().replace(/\/+$/, '');
  const cleanPath = params.endpointPath.startsWith('/')
    ? params.endpointPath
    : `/${params.endpointPath}`;
  const tokens = await secureStorage.getTokens();
  const safeName = params.fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const destPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${safeName}.xlsx`;
  const headers = tokens?.accessToken
    ? { Authorization: `Bearer ${tokens.accessToken}` }
    : undefined;

  const fetchFromOrigin = (targetOrigin: string) =>
    ReactNativeBlobUtil.config({
      fileCache: true,
      path: destPath,
    }).fetch('GET', `${targetOrigin}/api/v1${cleanPath}`, headers);

  let res;
  try {
    res = await fetchFromOrigin(origin);
  } catch (err) {
    if (Platform.OS === 'android' && origin.includes('localhost')) {
      const fallbackOrigin = origin.replace('localhost', '10.0.2.2');
      res = await fetchFromOrigin(fallbackOrigin);
    } else {
      throw err;
    }
  }

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
