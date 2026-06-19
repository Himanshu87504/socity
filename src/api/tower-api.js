import axiosInstance from "./axiosInstance";
export const getAllTowerApi = async (societyIdentifier) => {
    try {
        const params = {};
        if (societyIdentifier) {
            params.society_identifier = societyIdentifier;
        }
        const response = await axiosInstance.get(`/tower/all`, { params });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSocietyTowersApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`society/${identifier}/towers`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getWingsOfTowerApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`tower/${identifier}/wings`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const addTowerApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/tower/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateTowerApi = async (data, id) => {
    try {
        const dataToUpdate = {
            towerName: data.towerName,
            societyIdentifier: data.societyIdentifier
        };
        const response = await axiosInstance.patch(`/tower/${id}`, dataToUpdate);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteTowerApi = async (identifier) => {
    try {
        const response = await axiosInstance.delete(`/tower/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
