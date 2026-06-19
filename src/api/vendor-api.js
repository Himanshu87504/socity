import axiosInstance from "./axiosInstance";
export const getVendorForDropDownApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/vendor/ddl?society_identifier=${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getVendorOfCategoryForDropDownApi = async (id, identifier) => {
    try {
        const response = await axiosInstance.get(`/vendor/category-vendors?complaint_category_id=${id}&society_identifier=${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const addNewVendorApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/vendor/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllVendorApi = async () => {
    try {
        const response = await axiosInstance.get(`/vendor/all-vendors`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSocietyVendorsApi = async (societyIdentifier) => {
    try {
        const response = await axiosInstance.get(`/vendor/all-vendors?society_identifier=${societyIdentifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateVendorApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`vendor/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteVendorApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`vendor/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteVendorFromPerticularSocietyApi = async (societyIdentifier, id) => {
    try {
        const response = await axiosInstance.delete(`vendor/society/${societyIdentifier}/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getVendorDetail = async (identifier) => {
    try {
        const response = await axiosInstance.get(`/vendor/${identifier}`);
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