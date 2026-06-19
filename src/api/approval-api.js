import axiosInstance from "./axiosInstance";
export const getApprovalDataApi = async (token) => {
    try {
        const response = await axiosInstance.get(`/application/token/${token}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getComplaintDataApi = async (token) => {
    try {
        const response = await axiosInstance.get(`/complaint/token/${token}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateAppicationStatusApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/application/approve-application`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateVendorStatusApi = async (id, data) => {
    try {
        const response = await axiosInstance.post(`/complaint/${id}/vendor-status-update`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
