// @ts-nocheck
import axiosInstance from "./axiosInstance";

// ── GET all occasions ────────────────────────────────────────
export const getAllOccasionsApi = async (sid) => {
    try {
        const url = sid ? `/occasion/all?society_identifier=${sid}` : `/occasion/all`;
        const response = await axiosInstance.get(url);
        console.log("[OccasionAPI] GET /occasion/all →", response?.data);
        return response;
    } catch (error) {
        if (error?.response?.status === 404) {
            console.warn("[OccasionAPI] /occasion/all not found, returning empty");
            return { data: { data: [] } };
        }
        console.error("[OccasionAPI] GET /occasion/all FAILED →", error?.response?.status, error?.response?.data || error?.message);
        throw error;
    }
};

// ── CREATE occasion ──────────────────────────────────────────
// Body: { occasionName, occasionDescription }
export const createOccasionApi = async (data) => {
    try {
        const payload = {
            occasionName:        data.occasionName,
            occasionDescription: data.occasionDescription,
        };
        console.log("[OccasionAPI] POST /occasion/new →", payload);
        const response = await axiosInstance.post(`/occasion/new`, payload);
        console.log("[OccasionAPI] POST response →", response?.data);
        return response;
    } catch (error) {
        console.error("[OccasionAPI] POST FAILED →", error?.response?.status, error?.response?.data || error?.message);
        throw error;
    }
};

// ── UPDATE occasion ──────────────────────────────────────────
// PATCH /occasion/:id   Body: { occasionName, occasionDescription }
export const updateOccasionApi = async (data, id) => {
    try {
        const payload = {
            occasionName:        data.occasionName,
            occasionDescription: data.occasionDescription,
        };
        console.log(`[OccasionAPI] PATCH /occasion/${id} →`, payload);
        const response = await axiosInstance.patch(`/occasion/${id}`, payload);
        console.log("[OccasionAPI] PATCH response →", response?.data);
        return response;
    } catch (error) {
        console.error(`[OccasionAPI] PATCH FAILED →`, error?.response?.status, error?.response?.data || error?.message);
        throw error;
    }
};

// ── DELETE occasion ──────────────────────────────────────────
export const deleteOccasionApi = async (id) => {
    try {
        console.log(`[OccasionAPI] DELETE /occasion/${id}`);
        const response = await axiosInstance.delete(`/occasion/${id}`);
        console.log("[OccasionAPI] DELETE response →", response?.data);
        return response;
    } catch (error) {
        console.error(`[OccasionAPI] DELETE FAILED →`, error?.response?.status, error?.response?.data || error?.message);
        throw error;
    }
};
