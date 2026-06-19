import axiosInstance from "./axiosInstance";
export const getAllComplaintsApi = async (filters) => {
    try {
        const response = await axiosInstance.post(`/complaint/all`, filters);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllComplainCategoriesApi = async () => {
    try {
        const response = await axiosInstance.get(`/complaint/categories`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllPropertiesForDropdownApi = async (societyIdentifier) => {
    try {
        const response = await axiosInstance.get(`/property/ddl?society_identifier=${societyIdentifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const addNewComplaintApi = async (formData) => {
    return axiosInstance.post(
        "/complaint/ct/new",
        formData
    );
};
export const updateComplaintApi = async (data, id) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            if (data[key] !== "") {
                formData.append(key, data[key]);
            }
        }
        const response = await axiosInstance.patch(`complaint/ct/${id}`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateComplaintStatusApi = async (data, id) => {
    try {
        const response = await axiosInstance.post(`complaint/${id}/status`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteComplaintApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`complaint/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const assignComplaintToVendorApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/complaint/assign`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const sendNotificationTokenApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/user/register-fcm`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const sendSmsToVendorApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/sms/complaint/vendor`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};



export const getComplaintCategoriesApi = async () => {
    try {
        const response = await axiosInstance.get("complaint/categories");
        return response;
    } catch (error) {
        throw error;
    }
};