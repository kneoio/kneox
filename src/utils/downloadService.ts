import apiClient from '../api/apiClient';

export const downloadSoundFragmentWithProgress = async (
    entityId: string,
    fileId: string,
    fileName?: string, // Add fileName parameter
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

        // Get filename from response headers or use provided fileName
        let downloadFileName = fileName || fileId;

        // Try to get filename from Content-Disposition header
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (fileNameMatch && fileNameMatch[1]) {
                downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
            }
        }

        // If no extension and we can determine from content-type
        if (!downloadFileName.includes('.')) {
            const contentType = response.headers['content-type'];
            if (contentType) {
                if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) {
                    downloadFileName += '.mp3';
                } else if (contentType.includes('audio/wav')) {
                    downloadFileName += '.wav';
                } else if (contentType.includes('audio/ogg')) {
                    downloadFileName += '.ogg';
                } else if (contentType.includes('audio/flac')) {
                    downloadFileName += '.flac';
                }
            }
        }

        const blob = new Blob([response.data], {
            type: response.headers['content-type'] || 'audio/mpeg'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFileName; // Use the proper filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        throw error;
    }
};