import axiosInstance from "./axiosInstance";
export const createNewTermsConditionApi = async (data) => {
    try {
        const response = await axiosInstance.post(`term-condition/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateTermsConditionApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`term-condition/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getTermsConditionBySocietyAndTypeApi = async (societyIdentifier, id) => {
    try {
        const response = await axiosInstance.get(`term-condition/society/${societyIdentifier}/type/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const getAllTermsConditionApi = async () => {
    try {
        const response = await axiosInstance.get(`term-condition/all`);
        return response;
    } catch (error) {
        throw error;
    }
};