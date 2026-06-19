import axios from 'axios';
import axiosInstance from './axiosInstance';
import baseUrl from './base-url';
export const adminLoginApi = async (data) => {
    try {
        const response = await axios.post(`${baseUrl}/admin/login`, data, {
            withCredentials: true
        });
        console.log(response);
        
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const adminLogoutApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/admin/logout`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const adminRefreshAccessToken = async () => {
    try {
        const response = await axiosInstance.post(`/admin/refresh-token`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
