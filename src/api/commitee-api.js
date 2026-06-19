// @ts-nocheck
import axiosInstance from "./axiosInstance";

// ─── Get All Committee Members ────────────────────────────────────────────────
// GET /committee-member/all
export const getAllCommiteeMembersApi = async () => {
    try {
        const response = await axiosInstance.get(`/committee-member/all`);
        return response;
    } catch (error) {
        throw error;
    }
};

// ─── Get Single Committee Member ──────────────────────────────────────────────
// GET /committee-member/:id
export const getSingleCommiteeMemberApi = async (id) => {
    try {
        const response = await axiosInstance.get(`/committee-member/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// ─── Create Committee Member ──────────────────────────────────────────────────
// POST /committee-member/new
// Body (JSON): { societyIdentifier, towerIdentifier, wingIdentifier,
//               propertyIdentifier, fullName, contactNumber,
//               designation, applicationType[] }
export const addNewCommiteeMemberApi = async (data) => {
    try {
        const sid = data.societyIdentifier ||
            localStorage.getItem("society_identifier") ||
            localStorage.getItem("societyId") || "";

        const payload = {
            societyIdentifier:  sid,
            towerIdentifier:    data.towerIdentifier  || "",
            wingIdentifier:     data.wingIdentifier   || "",
            propertyIdentifier: data.propertyIdentifier || "",
            fullName:           data.fullName,
            contactNumber:      data.contactNumber,
            designation:        data.designation,
            applicationType:    Array.isArray(data.applicationType) ? data.applicationType : [],
        };

        const response = await axiosInstance.post(`/committee-member/new`, payload);
        return response;
    } catch (error) {
        throw error;
    }
};

// ─── Update Committee Member ──────────────────────────────────────────────────
// PATCH /committee-member/:id
// Body (JSON): any subset of the fields above
export const updateCommiteeMemberApi = async (data, id) => {
    try {
        const payload = {};
        if (data.fullName)        payload.fullName        = data.fullName;
        if (data.contactNumber)   payload.contactNumber   = data.contactNumber;
        if (data.designation)     payload.designation     = data.designation;
        if (data.applicationType) payload.applicationType = data.applicationType;
        if (data.societyIdentifier)  payload.societyIdentifier  = data.societyIdentifier;
        if (data.towerIdentifier)    payload.towerIdentifier     = data.towerIdentifier;
        if (data.wingIdentifier)     payload.wingIdentifier      = data.wingIdentifier;
        if (data.propertyIdentifier) payload.propertyIdentifier  = data.propertyIdentifier;

        const response = await axiosInstance.patch(`/committee-member/${id}`, payload);
        return response;
    } catch (error) {
        throw error;
    }
};

// ─── Delete Committee Member ──────────────────────────────────────────────────
// DELETE /committee-member/:id
export const deleteCommiteeMemberApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`/committee-member/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};