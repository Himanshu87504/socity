import axiosInstance from "./axiosInstance";
export const getAllAnnouncementApi = async (societyIdentifier) => {
    try {
        const params = {};
        if (societyIdentifier) {
            params.society_identifier = societyIdentifier;
        }
        const response = await axiosInstance.get(`announcement/all`, { params });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createAnnouncementApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            if (data[key] !== "") {
                formData.append(key, data[key]);
            }
        }
        const response = await axiosInstance.post(`announcement/at/new`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateAnnouncementApi = async (data, id) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            if (data[key] !== "") {
                formData.append(key, data[key]);
            }
        }
        const response = await axiosInstance.patch(`announcement/at/${id}`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteAnnouncementApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`announcement/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
