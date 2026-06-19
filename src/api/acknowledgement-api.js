import axiosInstance from './axiosInstance';

// const getSocietyIdentifier = () =>
//   localStorage.getItem("society_identifier") ||
//   localStorage.getItem("societyId") || "";

// export async function getAllPaymentAcknowledgements(filters = {}) {
//   const societyIdentifier = getSocietyIdentifier();
//   const { fromDate, toDate, propertyIdentifier, amountInFigures, invoiceNumber } = filters;

//   const requestBody = {};
//   if (fromDate)           requestBody.fromDate           = fromDate;
//   if (toDate)             requestBody.toDate             = toDate;
//   if (propertyIdentifier) requestBody.propertyIdentifier = propertyIdentifier;
//   if (amountInFigures)    requestBody.amountInFigures    = amountInFigures;
//   if (invoiceNumber)      requestBody.invoiceNumber      = invoiceNumber;

//   const response = await axiosInstance.post(
//     `payment/acknowledgement?society_identifier=${societyIdentifier}`,
//     requestBody
//   );
//   return response.data;
// }

export const getAllPaymentAcknowledgements = async (societyIdentifier) => {
    try {
        const params = {};

        if (societyIdentifier) {
            params.society_identifier = societyIdentifier;
        }

        const response = await axiosInstance.post(
            "payment/acknowledgement",
            {}, // body
            { params }
        );

        return response;
    } catch (error) {
        throw error;
    }
};