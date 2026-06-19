
// import axiosInstance from "./axiosInstance";

// export const getAllNoticeApi = async (societyIdentifier) => {
//     try {
//         const params = {};
//         if (societyIdentifier) params.society_identifier = societyIdentifier;
//         const response = await axiosInstance.get(`notice/all`, { params });
//         return response;
//     } catch (error) {
//         throw error;
//     }
// };

// export const createNoticeApi = async (data) => {
//     try {
//         const formData = new FormData();
//         formData.append("societyIdentifier", data.society_identifier || "");
//         formData.append("noticeSubject",     data.title || "");
//         formData.append("message",           data.description || "");
//         formData.append("startDate",         data.notice_date || "");
//         formData.append("validDate",         data.expiry_date || "");
//         formData.append("noticeType",        (data.category || "general").toLowerCase());
//         formData.append("towerIdentifier",    data.towerIdentifier    || "trbdab98");
// formData.append("wingIdentifier",     data.wingIdentifier     || "e7kvlhut");
// formData.append("propertyIdentifier", data.propertyIdentifier || "py8fa1b4");
//         const response = await axiosInstance.post(`notice/n/new`, formData);
//         return response;
//     } catch (error) {
//         throw error;
//     }
// };

// export const updateNoticeApi = async (data, id) => {
//     try {
//         const formData = new FormData();
//         formData.append("societyIdentifier", data.society_identifier || "");
//         formData.append("noticeSubject",     data.title || "");
//         formData.append("message",           data.description || "");
//         formData.append("startDate",         data.notice_date || "");
//         formData.append("validDate",         data.expiry_date || "");
//         formData.append("noticeType",        (data.category || "general").toLowerCase());
//         const response = await axiosInstance.patch(`notice/n/${id}`, formData);
//         return response;
//     } catch (error) {
//         throw error;
//     }
// };

// export const deleteNoticeApi = async (id) => {
//     try {
//         const response = await axiosInstance.delete(`notice/${id}`);
//         return response;
//     } catch (error) {
//         throw error;
//     }
// };


import axiosInstance from "./axiosInstance";
export const getAllNoticeApi = async (societyIdentifier) => {
    try {
        const params = {};
        if (societyIdentifier) {
            params.society_identifier = societyIdentifier;
        }
        const response = await axiosInstance.get(`notice/all`, { params });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createNoticeApi = async (data) => {
    try {
        const formData = data instanceof FormData ? data : new FormData();

        if (!(data instanceof FormData)) {
            Object.entries(data || {}).forEach(([key, value]) => {
                if (value === "" || value === null || value === undefined) return;
                if (value instanceof File || value instanceof Blob) {
                    formData.append(key, value);
                } else {
                    formData.append(key, String(value));
                }
            });
        }

        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }

        const response = await axiosInstance.post(`/notice/n/new`, formData);
        return response;
    } catch (error) {
        throw error;
    }
};
export const updateNoticeApi = async (data, id) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            if (data[key] !== "") {
                formData.append(key, data[key]);
            }
        }
        const response = await axiosInstance.patch(`notice/n/${id}`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteNoticeApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`notice/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};