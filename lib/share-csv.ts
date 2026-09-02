import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * share-csv.ts
 *
 * Hands a CSV to the OS share sheet. There is no browser download on a phone:
 * the file is written to the cache directory first, then shared. Cache (not
 * document) because the file is a hand-off artefact — once the owner has sent
 * it to Drive/WhatsApp/Mail the copy has no further use, and the system may
 * reclaim it.
 */

const CSV_MIME_TYPE = 'text/csv';

/** iOS needs a uniform type identifier for the share sheet to offer the right apps. */
const CSV_UTI = 'public.comma-separated-values-text';

export const isSharingAvailable = (): Promise<boolean> => Sharing.isAvailableAsync();

/**
 * The server names files after the library and period. Reuse that name so what
 * lands in the owner's Drive matches what the web export produces.
 */
export const readCsvFilename = (disposition: unknown, fallback: string): string => {
    if (typeof disposition !== 'string') return fallback;

    const match = disposition.match(/filename="?([^"]+)"?/);

    return match?.[1] || fallback;
};

/**
 * Write the CSV into the cache directory (replacing any file left by a
 * previous export so repeats do not accumulate) and open the share sheet.
 */
export const shareCsv = async (
    filename: string,
    csv: string,
    dialogTitle: string
): Promise<void> => {
    const file = new File(Paths.cache, filename);

    file.create({ overwrite: true });
    file.write(csv);

    await Sharing.shareAsync(file.uri, {
        mimeType: CSV_MIME_TYPE,
        UTI: CSV_UTI,
        dialogTitle,
    });
};
