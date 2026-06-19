import axiosInstance from './axiosInstance';
export const addTenantApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/tenant/tt/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllTenantApi = async (societyIdentifier) => {
    try {
        const params = {};
        if (societyIdentifier) {
            params.society_identifier = societyIdentifier;
        }
        const response = await axiosInstance.get(`/tenant/all`, { params });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getTenantApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/tenant/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateTenantApi = async (data, identifier) => {
    try {
        const response = await axiosInstance.patch(`/tenant/tt/${identifier}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteTenantApi = async (identifier) => {
    try {
        const response = await axiosInstance.delete(`/tenant/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateVehicleApi = async (data, identifier) => {
    try {
        const response = await axiosInstance.patch(`/tenant/tt/vehicle/${identifier}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteVehicleApi = async (identifier, id) => {
    try {
        const response = await axiosInstance.delete(`/tenant/${identifier}/vehicle/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getTenantDetailsApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/tenant/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
