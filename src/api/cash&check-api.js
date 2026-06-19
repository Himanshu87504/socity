import axiosInstance from "./axiosInstance";

export const getAllPaymentLogsApi = async (societyIdentifier) => {
    try {
        const response = await axiosInstance.post(
            `payment/payment-log/all?society_identifier=${societyIdentifier}`
        );
        return response;
    } catch (error) {
        throw error;
    }
};

// Create Cheque Payment
export const createChequePaymentApi = async (payload) => {
    try {
        const response = await axiosInstance.post(
            "payment/cheque",
            payload
        );
        return response;
    } catch (error) {
        throw error;
    }
};

// Create Cash Payment
export const createCashPaymentApi = async (payload) => {
    try {
        const response = await axiosInstance.post(
            "payment/cash",
            payload
        );
        return response;
    } catch (error) {
        throw error;
    }
};