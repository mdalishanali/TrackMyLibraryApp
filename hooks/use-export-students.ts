import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { api } from '@/lib/api-client';
import { isSharingAvailable, readCsvFilename, shareCsv } from '@/lib/share-csv';
import { showToast } from '@/lib/toast';
import { StudentAudience } from '@/constants/student-export';

/**
 * use-export-students.ts
 *
 * Downloads the roster as a CSV and hands it to the OS share sheet.
 *
 * There is no browser download on a phone: the file is written to the cache
 * directory first, then shared. Cache (not document) because the file is a
 * hand-off artefact — once the owner has sent it to Drive/WhatsApp/Mail the copy
 * has no further use, and the system may reclaim it.
 *
 * Every path here is non-throwing. Exporting is a convenience; a denied share or a
 * native failure must surface a message, never break the screen.
 */

export interface ExportStudentsParams {
    search?: string;
    filter?: string;
    days?: number;
    quickFilter?: string;
    shiftId?: string;
    /** 'all' includes inactive students — used by the take-my-data export. */
    status?: StudentAudience;
    /** Column keys to include. Omitted means every column. */
    columns?: string[];
}

/** The server returns this when the roster exceeds its per-file row cap. */
const ROW_LIMIT_STATUS = 413;

const FALLBACK_FILENAME = 'students.csv';

/**
 * An error response to a text request still arrives as the response body, so the
 * server's message has to be parsed back out before it can be shown.
 */
const readErrorMessage = (data: unknown): string | null => {
    if (typeof data === 'object' && data !== null) {
        const message = (data as { message?: unknown }).message;
        return typeof message === 'string' ? message : null;
    }

    if (typeof data !== 'string') return null;

    try {
        const parsed = JSON.parse(data);
        return typeof parsed?.message === 'string' ? parsed.message : null;
    } catch {
        return null;
    }
};

/**
 * The query the server needs, built once so the count preview and the download
 * can never be derived from different parameters.
 */
const toQueryParams = (params: ExportStudentsParams) => ({
    name: params.search || undefined,
    filter: params.filter || undefined,
    days: params.days || undefined,
    quickFilter: params.quickFilter || undefined,
    shiftId: params.shiftId || undefined,
    status: params.status || undefined,
    columns: params.columns?.length ? params.columns.join(',') : undefined,
});

/**
 * How many students the current choice covers.
 *
 * Served by the export handler itself, from the same match it would download, so
 * the previewed number cannot disagree with the resulting file.
 */
export const fetchExportCount = async (params: ExportStudentsParams): Promise<number> => {
    const { data } = await api.get('/students/export', {
        params: { ...toQueryParams(params), countOnly: 'true' },
    });

    return typeof data?.count === 'number' ? data.count : 0;
};

export const useExportStudents = () => {
    const [isExporting, setIsExporting] = useState(false);

    const exportStudents = useCallback(
        async (params: ExportStudentsParams = {}) => {
            if (isExporting) return;

            try {
                setIsExporting(true);

                const isShareAvailable = await isSharingAvailable();

                // Checked BEFORE the request: downloading a roster the device cannot
                // then hand anywhere would burn the call and leave a file nobody sees.
                if (!isShareAvailable) {
                    showToast('Sharing is not available on this device', 'error');
                    return;
                }

                const response = await api.get('/students/export', {
                    params: toQueryParams(params),
                    // Without this axios parses the CSV as JSON and mangles it.
                    responseType: 'text',
                    transformResponse: (data) => data,
                });

                const csv = typeof response.data === 'string' ? response.data : '';

                if (!csv) {
                    showToast('No student data to export', 'info');
                    return;
                }

                const filename = readCsvFilename(
                    response.headers?.['content-disposition'],
                    FALLBACK_FILENAME
                );

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                await shareCsv(filename, csv, 'Export students');
            } catch (error) {
                console.error('[useExportStudents] Export failed:', error);

                const response = (error as { response?: { status?: number; data?: unknown } })
                    ?.response;
                const serverMessage = readErrorMessage(response?.data);

                if (response?.status === ROW_LIMIT_STATUS && serverMessage) {
                    showToast(serverMessage, 'error');
                } else {
                    showToast('Could not export students', 'error', 'Please try again');
                }
            } finally {
                setIsExporting(false);
            }
        },
        [isExporting]
    );

    return { exportStudents, isExporting };
};
