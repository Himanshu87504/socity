import axiosInstance from "./axiosInstance";


export const getAllMembersApi = async () => {
  try {
    const response = await axiosInstance.get(`/member/all`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getSocietyMembersApi = async (societyIdentifier) => {
    try {
        const response = await axiosInstance.get(`/member/society/${societyIdentifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const addMemberApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        const response = await axiosInstance.post(`/member/mr/new`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getMemberSearhApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/member/search`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteMemberApi = async (identifier) => {
    try {
        const response = await axiosInstance.delete(`/member/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteMemberFromPerticularSocietyApi = async (societyIdentifier, identifier) => {
    try {
        const response = await axiosInstance.delete(`/member/society/${societyIdentifier}/${identifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getMemberDetailApi = async (identifier) => {
    try {
        // Try /member/mr/:identifier first (matches the update endpoint pattern)
        const response = await axiosInstance.patch(
  `/member/mr/${identifier}`
);
return response.data;
    }
    catch (error) {
        // Fallback to /member/:identifier if /member/mr/ returns 404
        if (error?.response?.status === 404) {
            const fallback = await axiosInstance.get(`/member/${identifier}`);
            return fallback;
        }
        throw error;
    }
};
export const updateMemberApi = async (data, identifier) => {
    try {
        // Send as JSON — backend expects application/json for this endpoint.
        // FormData was causing 500 errors due to content-type mismatch.
        const response = await axiosInstance.patch(`/member/mr/${identifier}`, data, {
            headers: { "Content-Type": "application/json" }
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
