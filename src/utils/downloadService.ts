// services/downloadService.ts
import apiClient from "../api/apiClient";

export async function downloadSoundFragment(uuid: string, name: string): Promise<void> {
    try {
        const response = await apiClient.get(`/soundfragments/files/${uuid}/${name}`, {
            responseType: 'blob'
        });

        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}
