import apiClient from "../../apiClient";

export const fetchEmpl = async (page: number, pageSize: number): Promise<any> => {
    const response = await apiClient.get(`/employees?page=${page}&size=${pageSize}`);
    if (response.data) {
        return response.data;
    } else {
        throw new Error('Invalid API response structure');
    }
};
