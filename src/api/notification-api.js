import axiosInstance from './axiosInstance';
export const getNotificationsAPi = async (data) => {
    try {
        const response = await axiosInstance.post(`/admin/notifications`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateNotificationStatus = async (data) => {
    try {
        const response = await axiosInstance.patch(`/admin/notification-status`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
