import apiClient from '../api/apiClient';

export const downloadSoundFragment = async (
    entityId: string,
    fileId: string,
    fileName?: string, 
    onProgress?: (percentage: number) => void
) => {
    try {
        const response = await apiClient.get(`/soundfragments/files/${entityId}/${fileId}`, {
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentage);
                }
            }
        });


        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (fileNameMatch && fileNameMatch[1]) {
                fileName = fileNameMatch[1].replace(/['"]/g, '');
            }
        }

        if (!fileName?.includes('.')) {
            const contentType = response.headers['content-type'];
            if (contentType) {
                if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) {
                    fileName += '.mp3';
                } else if (contentType.includes('audio/wav')) {
                    fileName += '.wav';
                } else if (contentType.includes('audio/ogg')) {
                    fileName += '.ogg';
                } else if (contentType.includes('audio/flac')) {
                    fileName += '.flac';
                }
            }
        }

        const blob = new Blob([response.data], {
            type: response.headers['content-type'] || 'audio/mpeg'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'download.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        throw error;
    }
};