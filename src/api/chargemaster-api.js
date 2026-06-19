import axiosInstance from "./axiosInstance";
export const addChargeMasterApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/charge/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllChargeMasterApi = async (societyIdentifier) => {
    try {
        const url = societyIdentifier
            ? `/charge/all?society_identifier=${societyIdentifier}`
            : `/charge/all`;
        const response = await axiosInstance.get(url);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getChargesOfSocietyApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/charge/all?society_identifier=${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getChargesOptionsApi = async (val) => {
    try {
        const response = await axiosInstance.get(`/charge/name/suggestion?query=${val}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getChargesOfPropertyApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/property/${identifier}/charges`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getVehiclesOfPropertyApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/property/${identifier}/vehicles`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getChargeDetailsApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/charge/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateChargeMasterApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`charge/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteChargeMasterApi = async (id, societyIdentifier) => {
    try {
        const url = societyIdentifier
            ? `charge/${id}?society_identifier=${societyIdentifier}`
            : `charge/${id}`;
        const response = await axiosInstance.delete(url);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const bulkUploadChargeMasterApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/bulk-upload/charge-master`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkUploadChargeMasterFormatApi = async (type) => {
    try {
        const response = await axiosInstance.get(`/bulk-upload/charge-master/get-format/${type}`, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};