import axiosInstance from "./axiosInstance";
export const getAllNewParkingApi = async (societyIdentifier) => {
    try {
        if (!societyIdentifier) {
            // Return a fake empty-success response instead of throwing,
            // so the UI shows an empty list rather than an error banner.
            return { data: { status: 1, message: "No society identifier", data: [] } };
        }
        const response = await axiosInstance.get(`/parking/all/${societyIdentifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSingleParkingApi = async (id) => {
    try {
        const response = await axiosInstance.get(`/parking/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createNewParkingApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/parking/new`, data, {
            headers: { "Content-Type": "application/json" },
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateParkingApi = async (id, data) => {
    try {
        const response = await axiosInstance.patch(`/parking/${id}`, data, {
            headers: { "Content-Type": "application/json" },
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteParkingApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`/parking/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
