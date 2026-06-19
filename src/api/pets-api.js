import axiosInstance from "./axiosInstance";

/**
 * Reads the society identifier from every known localStorage location.
 */
const resolveSocietyId = (hint) => {
    if (hint && hint !== "all") return hint;

    const direct =
        localStorage.getItem("society_identifier") ||
        localStorage.getItem("societyId") ||
        localStorage.getItem("selectedSociety");
    if (direct) return direct;

    try {
        const cu = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const fromUser =
            cu?.societyIdentifier ||
            cu?.society_identifier ||
            cu?.societyId ||
            cu?.identifier || "";
        if (fromUser) return fromUser;
    } catch (_) { /* ignore */ }

    try {
        const lr = JSON.parse(localStorage.getItem("loginResponse") || "{}");
        const permArr = lr?.permissoin || lr?.permission || lr?.permissions || [];
        if (Array.isArray(permArr) && permArr.length > 0) {
            const fromPerm =
                permArr[0]?.societyIdentifier ||
                permArr[0]?.society_identifier ||
                permArr[0]?.societyId ||
                permArr[0]?.identifier || "";
            if (fromPerm) return fromPerm;
        }
        return lr?.societyIdentifier || lr?.society_identifier || lr?.societyId || "";
    } catch (_) { return ""; }
};

export const getAllPetsApi = async (societyIdentifier) => {
    try {
        const sid = resolveSocietyId(societyIdentifier);
        // society_identifier is required — always send it if available
        const params = sid ? { society_identifier: sid } : {};
        const response = await axiosInstance.get(`pet/pt/all`, { params });
        return response;
    } catch (error) {
        throw error;
    }
};

export const createPetsApi = async (data) => {
    try {
        const response = await axiosInstance.post(`pet/pt/new`, data);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updatePetsApi = async (data, id) => {
    try {
        // If data is a plain object (no new photo), send as JSON.
        // If it is a FormData instance (new photo attached), let axios set multipart headers.
        const isFormData = data instanceof FormData;
        const config = isFormData
            ? {}   // axios auto-sets multipart/form-data + boundary
            : { headers: { "Content-Type": "application/json" } };
        const response = await axiosInstance.patch(`pet/pt/${id}`, data, config);
        return response;
    } catch (error) {
        throw error;
    }
};

export const deletePetsApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`pet/pt/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};
