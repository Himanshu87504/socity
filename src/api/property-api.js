import axiosInstance from './axiosInstance';
export const addPropertyApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        const response = await axiosInstance.post(`/property/p/new`, formData);
        return response;
    }
    catch (error) {
        console.log(error);
        throw error;
    }
};
export const getAllPropertyApi = async (wingIdentifier, societyIdentifier) => {
    try {
        const params = {};
        if (wingIdentifier) {
            params.wing_identifier = wingIdentifier;
        }
        if (societyIdentifier) {
            params.society_identifier = societyIdentifier;
        }
        const response = await axiosInstance.get(`/property/all`, { params });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getWingPropertiesApi = async (identifier) => {
    try {
        const response = await axiosInstance.get(`wing/${identifier}/properties`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSinglePropertyDetailsApi = async (propertyId) => {
    try {
        const response = await axiosInstance.get(`/property/${propertyId}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getPropertyDocumentsApi = async (propertyId) => {
    try {
        const response = await axiosInstance.get(`/property-document/history/${propertyId}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getPropertyDocumentForLatestApi = async (propertyId) => {
    try {
        const response = await axiosInstance.get(`/property-document/${propertyId}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const addPropertyAndMemberBulkUploadFileApi = async (data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    try {
        const response = await axiosInstance.post(`/bulk-upload/property-and-member`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getNarrationAndAreaOfProperty = async (id, data) => {
    try {
        const response = await axiosInstance.post(`/charge/get-narration-area/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const addPropertyDocumentApi = async (data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    try {
        const response = await axiosInstance.post(`/property-document/new-property-document`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updatePropertyDocumentApi = async (propertyId, data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    try {
        const response = await axiosInstance.patch(`/property-document/update-property-document/${propertyId}`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getPropertyOutstandingAmountApi = async (propertyId) => {
    try {
        const response = await axiosInstance.get(`/property/${propertyId}/payment-outstanding`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getTenantsOfPropertyApi = async (propertyIdentifier) => {
    try {
        const response = await axiosInstance.get(`/property/${propertyIdentifier}/tenants`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getTenantOptions = async () => {
    try {
        const response = await axiosInstance.get(`/tenant/ddl`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getMembersOfPropertyApi = async (propertyIdentifier) => {
    try {
        const response = await axiosInstance.get(`/property/${propertyIdentifier}/members`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getPropertyOwnerApi = async (propertyId) => {
    try {
        const response = await axiosInstance.get(`/property/${propertyId}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getPropertComplaintsApi = async (propertyId) => {
    try {
        const response = await axiosInstance.get(`/property/${propertyId}/complaints`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getPropertLoansApi = async (propertyId) => {
    try {
        const response = await axiosInstance.get(`/property/${propertyId}/loans`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updatePropertyApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`/property/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deletePropertyApi = async (identifier) => {
    try {
        const response = await axiosInstance.delete(`/property/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};