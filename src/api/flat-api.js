import axiosInstance from './axiosInstance';
export const addFlatApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/flat/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllFlatApi = async () => {
    try {
        const response = await axiosInstance.get(`/flat/all`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateFlatApi = async (data, id) => {
    try {
        const dataToUpdate = {
            flatNumber: data.flatNumber,
            floorNumber: data.floorNumber,
            towerId: data.towerId
        };
        const response = await axiosInstance.patch(`/flat/${id}`, dataToUpdate);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteFlatApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`/flat/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
