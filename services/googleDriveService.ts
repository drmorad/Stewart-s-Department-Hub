
/**
 * Google Drive Storage Service
 * Handles cloud persistence for the app state.
 */

// Fix: Declaring global types for Google API client and Identity Services to resolve TypeScript errors
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

declare var gapi: any;
declare var google: any;

const CLIENT_ID = '947083049533-p66cl8u2qf46rpeuep5k2be98m3p0be7.apps.googleusercontent.com'; // Placeholder - ideally from env
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const BACKUP_FILENAME = 'steward_backup.json';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

/**
 * Initialize GAPI and GIS
 */
export const initGoogleDrive = (): Promise<void> => {
    return new Promise((resolve) => {
        const checkReady = () => {
            if (window.gapi && window.google) {
                gapi.load('client', async () => {
                    await gapi.client.init({
                        discoveryDocs: DISCOVERY_DOCS,
                    });
                    gapiInited = true;
                    maybeEnableButtons();
                });

                tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: '', // defined at request time
                });
                gisInited = true;
                maybeEnableButtons();
            } else {
                setTimeout(checkReady, 100);
            }
        };

        const maybeEnableButtons = () => {
            if (gapiInited && gisInited) resolve();
        };

        checkReady();
    });
};

/**
 * Request permission from user
 */
export const authenticateDrive = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        tokenClient.callback = async (resp: any) => {
            if (resp.error !== undefined) {
                reject(resp);
            }
            // Successfully authenticated
            const user = await fetchUserInfo(resp.access_token);
            resolve({ token: resp, user });
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
};

const fetchUserInfo = async (token: string) => {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return await response.json();
    } catch (e) {
        return null;
    }
};

/**
 * Find or create the backup file in Drive
 */
export const syncToCloud = async (data: any): Promise<string> => {
    try {
        // 1. Search for existing file
        const response = await gapi.client.drive.files.list({
            q: `name = '${BACKUP_FILENAME}' and trashed = false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        const files = response.result.files;
        const fileContent = JSON.stringify(data);
        const fileMetadata = {
            name: BACKUP_FILENAME,
            mimeType: 'application/json',
        };

        if (files && files.length > 0) {
            // Update existing
            const fileId = files[0].id;
            await gapi.client.request({
                path: `/upload/drive/v3/files/${fileId}`,
                method: 'PATCH',
                params: { uploadType: 'media' },
                body: fileContent,
            });
            return 'updated';
        } else {
            // Create new
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(fileMetadata) +
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                fileContent +
                close_delim;

            await gapi.client.request({
                path: '/upload/drive/v3/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                headers: {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"',
                },
                body: multipartRequestBody,
            });
            return 'created';
        }
    } catch (err) {
        console.error('Cloud Sync Error:', err);
        throw err;
    }
};

/**
 * Load data from cloud
 */
export const loadFromCloud = async (): Promise<any | null> => {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name = '${BACKUP_FILENAME}' and trashed = false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            const fileId = files[0].id;
            const contentResponse = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media',
            });
            return contentResponse.result;
        }
        return null;
    } catch (err) {
        console.error('Cloud Load Error:', err);
        return null;
    }
};
