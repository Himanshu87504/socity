import axiosInstance from './axiosInstance';

export const getDashboardDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/admin/dashboard`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const getMaintenanceAdditionalDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/admin/dashboard/maintenance-additional-billing`, data && Object.keys(data).length > 0 ? data : undefined);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const getSocietyMaintenanceAndReceiptDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/admin/dashboard/location-based-billing`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
