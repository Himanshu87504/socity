import axiosInstance from "./axiosInstance";
export const createNewGatePassApi = async (gatePassData) => {
    try {
        const response = await axiosInstance.post(`gatepass/new`, gatePassData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateGatePassApi = async (gatePassData, id) => {
    try {
        const response = await axiosInstance.patch(`gatepass/${id}`, gatePassData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteGatePassApi = async (applicationIdentifier) => {
    try {
        const response = await axiosInstance.delete(`gatepass/${applicationIdentifier}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createNewEventApi = async (eventData) => {
    try {
        const response = await axiosInstance.post(`event/new`, eventData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateEventApi = async (eventData, id) => {
    try {
        const response = await axiosInstance.patch(`event/${id}`, eventData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createNewEnquiryApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        const response = await axiosInstance.post(`other-enquiry/new-other-enquiry`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateEnquiryApi = async (data, id) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        const response = await axiosInstance.patch(`other-enquiry/update-other-enquiry/${id}`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllEnquiryApi = async () => {
    try {
        const response = await axiosInstance.get(`other-enquiry/`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteEnquiryApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`other-enquiry/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createNewDocumentSubmissionApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        const response = await axiosInstance.post(`other-document/new-other-document`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateDocumentSubmissionApi = async (data, id) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        const response = await axiosInstance.patch(`other-document/update-other-document/${id}`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllDocumentSubmissionApi = async () => {
    try {
        const response = await axiosInstance.get(`other-document/get-all-other-documents`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteDocumentSubmissionApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`other-document/delete-other-document/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createNewOtherApplicationApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        const response = await axiosInstance.post(`other-other/new-other-other`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllFlatResaleApi = async () => {
  try {
    const response = await axiosInstance.get(`flat-resale/all`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getFlatResaleByIdApi = async (applicationIdentifier) => {
  try {
    const response = await axiosInstance.get(`flat-resale/${applicationIdentifier}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createNewFlatResaleApi = async (data) => {
  try {
    const formData = new FormData();
    for (const key in data) {
      const value = data[key];
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    }
    const response = await axiosInstance.post(`flat-resale/new-resale-application`, formData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateFlatResaleApi = async (data, applicationIdentifier) => {
  try {
    const formData = new FormData();
    for (const key in data) {
      const value = data[key];
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    }
    const response = await axiosInstance.patch(
      `flat-resale/update-resale-application/${applicationIdentifier}`,
      formData
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteFlatResaleApi = async (applicationIdentifier) => {
  try {
    const response = await axiosInstance.delete(
      `flat-resale/${applicationIdentifier}`
    );
    return response;
  } catch (error) {
    throw error;
  }
};
export const createInteriorWorkApi = async (data) => {
  try {
    const response = await axiosInstance.post(`interior/new`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateInteriorWorkApi = async (data, id) => {
  try {
    const response = await axiosInstance.patch(`interior/${id}`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllInteriorWorkApi = async () => {
  try {
    const response = await axiosInstance.get(`interior/all`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteInteriorWorkApi = async (id) => {
  try {
    const response = await axiosInstance.delete(`interior/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};
export const createTurfAreaApi = async (data) => {
    try {
        const response = await axiosInstance.post(`turf-area/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateTurfAreaApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`turf-area/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createTheaterApi = async (data) => {
    try {
        const response = await axiosInstance.post(`theater/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateTheaterApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`theater/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createNominationApi = async (data) => {
    try {
        const response = await axiosInstance.post(`nomination/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateNominationApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`nomination/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createBadmintonCourtApi = async (data) => {
    try {
        const response = await axiosInstance.post(`badminton-court/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateBadmintonCourtApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`badminton-court/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createShareCertificateApi = async (data) => {
    try {
        const response = await axiosInstance.post(`share-certificate/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateShareCertificateApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`share-certificate/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createRentAgreementApi = async (data) => {
    try {
        const response = await axiosInstance.post(`rent-agreement/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateRentAgreementApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`rent-agreement/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const getAllChangeInNameApi = async () => {
    try {
        const response = await axiosInstance.get(`name-change/all`);
        return response;
    } catch (error) {
        throw error;
    }
};
export const createChangeInNameApi = async (data) => {
    try {
        const response = await axiosInstance.post(`name-change/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateChangeInNameApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`name-change/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteChangeInNameApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`name-change/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};
// export const getAllContactUpdateApi = async () => {
//     try {
//         const response = await axiosInstance.get(`contact-update`);
//         return response;
//     } catch (error) {
//         throw error;
//     }
// };
// export const createContactUpdateApi = async (data) => {
//     try {
//         const response = await axiosInstance.post(`contact-update/new`, data);
//         return response;
//     }
//     catch (error) {
//         throw error;
//     }
// };
// export const updateContactUpdateApi = async (data, id) => {
//     try {
//         const response = await axiosInstance.patch(`contact-update/${id}`, data);
//         return response;
//     }
//     catch (error) {
//         throw error;
//     }
// };
// export const deleteContactUpdateApi = async (id) => {
//     try {
//         const response = await axiosInstance.delete(`contact-update/${id}`);
//         return response;
//     } catch (error) {
//         throw error;
//     }
// };

export const getAllContactUpdateApi = async () => {
    try {
        const response = await axiosInstance.get(`contact-update/all`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const createContactUpdateApi = async (data) => {
    try {
        const response = await axiosInstance.post(`contact-update/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const updateContactUpdateApi = async (data, contactUpdateId) => {
    try {
        const response = await axiosInstance.patch(`contact-update/${contactUpdateId}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const deleteContactUpdateApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`contact-update/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
};
export const createSwimmingPoolApi = async (data) => {
    try {
        const response = await axiosInstance.post(`swiming-pool/new`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateSwimmingPoolApi = async (data, id) => {
    try {
        const response = await axiosInstance.patch(`swiming-pool/${id}`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllSwimmingPoolApi = async () => {
    try {
        const response = await axiosInstance.get(`swiming-pool/all`);
        return response;
    }
    catch (error) {
        throw error;
    }
};

export const deleteSwimmingPoolApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`swiming-pool/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateOtherApplicationApi = async (data, id) => {
    try {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        const response = await axiosInstance.patch(`other-other/update-other-other/${id}`, formData);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllGatePassApi = async () => {
    try {
        const response = await axiosInstance.get(`gatepass/all`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllVenueApi = async () => {
    try {
        const response = await axiosInstance.get(`venue/all`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getApprovedEventsApi = async (societyIdentifier, venueId) => {
    const params = {
        societyIdentifier
    };
    if (venueId) {
        params.venueId = venueId;
    }
    try {
        const response = await axiosInstance.get(`event/all-approved`, { params });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getAllApplicationApi = async (societyIdentifier, propertyIdentifier) => {
    try {
        const params = {};
        if (societyIdentifier) {
            params.society_identifier = societyIdentifier;
        }
        if (propertyIdentifier) {
            params.property_identifier = propertyIdentifier;
        }
        const response = await axiosInstance.get(`event/applications/all`, { params });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getSocietyVenueApi = async (id) => {
    try {
        const response = await axiosInstance.get(`venue/society/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getApplicationDetailsApi = async (id) => {
    try {
        const response = await axiosInstance.get(`event/applications/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteApplicationApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`/event/applications/${id}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const sendApproverSmsApi = async (data) => {
    try {
        const response = await axiosInstance.post(`sms/application/approver`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const fetchApproversDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`society/committe-members`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
