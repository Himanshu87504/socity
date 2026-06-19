import axiosInstance from './axiosInstance';

export const addUserApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            const value = data[key];
            if (value instanceof File || value instanceof Blob) {
                formData.append(key, value);
            }
            else if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            }
            else if (typeof value === 'object' && value !== null) {
                formData.append(key, JSON.stringify(value));
            }
            else if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        }
        const response = await axiosInstance.post(`/member/mr/new`, formData);
        return response;
    }
    catch (error) {
        console.error("API error:", error);
        throw error;
    }
};

export const getAllUserApi = async () => {
    try {
        const response = await axiosInstance.get(`/admin/user/all`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const updateUserApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`/admin/user/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const deleteUserApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`/admin/user/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const getUserApi = async (username) => {
    try {
        const response = await axiosInstance.get(`/admin/user/${username}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const addUserPropertyApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/admin/user/property/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const getAllUserPropertyApi = async () => {
    try {
        const response = await axiosInstance.get(`/admin/user/property/all`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const addUserLoanApi = async (data) => {
    try {
        const formData = new FormData();
        if (Array.isArray(data)) {
            for (const loan of data) {
                for (const key in loan) {
                    if (key === 'loanFile' && loan[key]) {
                        formData.append(key, loan[key]);
                    }
                    else if (typeof loan[key] === 'object' && loan[key] !== null) {
                        formData.append(key, JSON.stringify(loan[key]));
                    }
                    else {
                        formData.append(key, loan[key]);
                    }
                }
            }
        }
        else {
            for (const key in data) {
                if (key === 'loanFile' && data[key]) {
                    formData.append(key, data[key]);
                }
                else if (typeof data[key] === 'object' && data[key] !== null) {
                    formData.append(key, JSON.stringify(data[key]));
                }
                else {
                    formData.append(key, data[key]);
                }
            }
        }
        const response = await axiosInstance.post(`/admin/user/loan/new`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error in addUserLoanApi:', error);
        throw error;
    }
};

export const getAllUserLoanApi = async () => {
    try {
        const response = await axiosInstance.get(`/admin/user/loan/all`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const deleteUserLoanApi = async (username, id) => {
    try {
        const response = await axiosInstance.delete(`/admin/user/${username}/loan/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const getAllMemberOrTenantsApi = async () => {
    try {
        const response = await axiosInstance.get(`/member/all`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const getMemberForDropDownApi = async () => {
    try {
        const response = await axiosInstance.get(`/member/ddl`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const getUserModulePermissionApi = async () => {
    try {
        const response = await axiosInstance.get(`/admin/module-permission`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
