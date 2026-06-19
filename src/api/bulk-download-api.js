import axiosInstance from "./axiosInstance";
export const downloadBulkTenantDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/bulk-download/tenant`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkComplaintDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/bulk-download/complaints`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkApplicationDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/bulk-download/applications`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkVendorDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/bulk-download/vendors`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkOnlineSelfDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/bulk-download/online-self`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkCashAndChequeDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/bulk-download/cash-and-cheque`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getReceiptBulkUploadApi = async () => {
    try {
        const response = await axiosInstance.get(`/bulk-upload/receipt/get-format`, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
