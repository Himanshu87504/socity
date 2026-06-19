import axiosInstance from "./axiosInstance";
export const getAllHelpersApi = async (societyIdentifier) => {
    try {
        if (!societyIdentifier) throw new Error("No society identifier available");
        const params = { society_identifier: societyIdentifier };
        const response = await axiosInstance.get(`helper/hpr/all`, { params });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getHelperDetailsApi = async (data) => {
    try {
        const response = await axiosInstance.post(`helper/info-with-in-out`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createHelpersApi = async (data) => {
    try {
        const response = await axiosInstance.post(`helper/hpr/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateHelpersApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`helper/hpr/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteHelpersApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`helper/hpr/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
