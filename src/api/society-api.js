import axiosInstance from './axiosInstance';
export const addSocietyApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/society/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllSocietyApi = async (societyIdentifier) => {
    try {
        const params = {};
        if (societyIdentifier) {
            params.society_identifier = societyIdentifier;
        }
        const response = await axiosInstance.get(`/society/all`, { params });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSocietyBulkUploadFileApi = async () => {
    try {
        const response = await axiosInstance.get(`/bulk-upload/society/get-format`, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getPropertyAndMemberBulkUploadApi = async () => {
    try {
        const response = await axiosInstance.get(`/bulk-upload/property-and-member/get-format`, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const addSocietyBulkUploadFileApi = async (data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    try {
        const response = await axiosInstance.post(`/bulk-upload/society`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSocietyDetailsApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/society/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSocietyInterestDateApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/society/${identifier}/interest-date`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSocietyOwnerApi = async (societyIdentifier) => {
    try {
        const response = await axiosInstance.get(`/society/${societyIdentifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateSocietyApi = async (data, identifier) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') { // Check if value is present
                if (key === 'paymentQrFile' && data[key]) {
                    formData.append(key, data[key]);
                }
                else if (typeof data[key] === 'object') {
                    formData.append(key, JSON.stringify(data[key]));
                }
                else {
                    formData.append(key, data[key]);
                }
            }
        }
        const response = await axiosInstance.patch(`/society/sy/${identifier}`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateSocietyBankDetailsApi = async (data, identifier) => {
    try {
        // const formData = new FormData();
        // for (const key in data) {
        //     if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        //         if (key === 'paymentQrFile' && data[key]) {
        //             formData.append(key, data[key]);
        //         } else if (typeof data[key] === 'object') {
        //             formData.append(key, JSON.stringify(data[key]));
        //         } else {
        //             formData.append(key, data[key]);
        //         }
        //     }
        // }
        const response = await axiosInstance.patch(`/society/sy/${identifier}/account-details`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteSocietyApi = async (identifier) => {
    try {
        const response = await axiosInstance.delete(`/society/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteSocietyBankApi = async (identifier, accountId) => {
    try {
        const response = await axiosInstance.delete(`/society/sy/${identifier}/account-details/${accountId}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getTowersOfSocietyApi = async (id) => {
    try {
        const response = await axiosInstance.get(`/society/${id}/towers`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getWingsOfSocietyApi = async (id) => {
    try {
        const response = await axiosInstance.get(`/society/${id}/wings`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getPropertiesOfSocietyApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/society/${identifier}/ddl/properties`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAnnouncementsOfSocietyApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/society/${identifier}/announcements`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getNoticesOfSocietyApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/society/${identifier}/notices`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
