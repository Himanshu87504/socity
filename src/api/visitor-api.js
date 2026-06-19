import axiosInstance from "./axiosInstance";
export const addNewVisitorApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                if (key === 'visitorPicture' && data[key]) {
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
        const response = await axiosInstance.post(`/visitor/new-open-visitor`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateVisitorInsideApi = async (visitorId) => {
    try {
        const response = await axiosInstance.patch(`/visitor/${visitorId}/inside`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateVisitorOutsideApi = async (visitorId) => {
    try {
        const response = await axiosInstance.patch(`/visitor/${visitorId}/outside`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllVisitorApi = async (data) => {
    try {
        const sid = data?.society_identifier;
        if (!sid) {
            // Return an empty-data response instead of throwing,
            // so AppContext falls back to mock data gracefully.
            return { data: { data: [] } };
        }
        // Backend expects GET with query param (POST /visitor/all returns 400)
        const response = await axiosInstance.get(`/visitor/all?society_identifier=${sid}`);
        return response;
    }
    catch (error) {
        if (error?.response?.status === 404) {
            return { data: { data: [] } };
        }
        throw error;
    }
};
export const updateVisitorApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                if (key === 'visitorPicture' && data[key]) {
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
        const response = await axiosInstance.patch(`visitor/update-visitor`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteVisitorApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`visitor/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getVisitorDetail = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/visitor/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSocietyDataForVisitorApi = async (identifier, type) => {
    try {
        const response = await axiosInstance.get(`/visitor/get-society-data?indentifier=${identifier}&type=${type}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getVisitorInfoApi = async (token) => {
    try {
        const response = await axiosInstance.get(`/visitor/request/${token}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getGatePassInfoApi = async (token) => {
    try {
        const response = await axiosInstance.get(`/gatepass/request/${token}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
