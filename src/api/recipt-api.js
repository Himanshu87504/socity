import axiosInstance from './axiosInstance';

export const getAllPaymentReceiptsApi = async (societyIdentifier) => {
    try {
        return await axiosInstance.post(`/payment/receipt/all?society_identifier=${societyIdentifier}`);
    } catch (error) {
        throw error;
    }
};