import axiosInstance from "./axiosInstance";
export const createCashPaymentApi = async (amountInFigures, invoiceNumber, propertyIdentifier, notesDetails, mobile, receiptDate, discount) => {
    try {
        const response = await axiosInstance.post(`payment/cash`, {
            amountInFigures,
            invoiceNumber,
            propertyIdentifier,
            notesDetails,
            paidDate: new Date(),
            mobile,
            receiptDate,
            discount
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createChequePaymentApi = async (invoiceNumber, bankName, chequeDate, receiptDate, chequeReceivedDate, branchName, amountInFigures, amountInWords, propertyIdentifier, chequeNumber, mobile) => {
    try {
        const response = await axiosInstance.post(`payment/cheque`, {
            invoiceNumber,
            bankName,
            chequeDate,
            receiptDate,
            chequeReceivedDate,
            branchName,
            amountInFigures,
            amountInWords,
            propertyIdentifier,
            chequeNumber,
            mobile
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const createNewOnlineSelfPaymentApi = async (data) => {
    try {
        const formdata = new FormData();
        for (const key in data) {
            formdata.append(key, data[key]);
        }
        const response = await axiosInstance.post(`/payment/online-self`, formdata);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const updateOnlineSelfPaymentApi = async (data, id) => {
    try {
        const formdata = new FormData();
        for (const key in data) {
            formdata.append(key, data[key]);
        }
        const response = await axiosInstance.patch(`/payment/online-self/${id}`, formdata);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const verifyPaymentApi = async (invoiceNumber, amountInFigures, paidDate, propertyIdentifier, transactionId, mobileNumber, otp, discount) => {
    try {
        const response = await axiosInstance.patch(`payment/verify`, {
            invoiceNumber,
            amountInFigures,
            paidDate,
            propertyIdentifier,
            transactionId,
            mobileNumber,
            otp,
            discount
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getInvoicePaymentOutstandingApi = async (invoiceNumber) => {
    try {
        const response = await axiosInstance.get(`payment/get-invoice-outstanding/${invoiceNumber}`);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const sendOTPApi = async (mobileNumber, invoiceNumber, propertyIdentifier, chequeNumber, amountInFigures, paymentMethod) => {
    try {
        const response = await axiosInstance.post(`payment/resend-otp`, {
            mobileNumber,
            invoiceNumber,
            propertyIdentifier,
            chequeNumber,
            amountInFigures,
            paymentMethod
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const onlinePaymentApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/payment/create-order`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkInvoiceApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/payment/download-bulk/invoice`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkTallyDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/payment/download-excel/invoice`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkReceiptApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/payment/download-bulk/receipt`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkLedgerApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/payment/download/property-ledger`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const downloadBulkLedgerPdfApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/payment/download/property-ledger-pdf`, data, {
            responseType: 'blob',
        });
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getLatestInvoiceDate = async (data) => {
    try {
        const response = await axiosInstance.post(`/payment/get-latest-invoice-date`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const getPropertyLatestInvoiceDate = async (data) => {
    try {
        const response = await axiosInstance.post(`/payment/get-property-latest-invoice-date`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const deleteReceiptApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/payment/unprocess-receipt`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const sendBulkSmsApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/sms/already-generated-invoices`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const sendBulkReminderSmsApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/sms/send-payment-reminder`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const sendReceiptSmsApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/sms/send-receipt-sms`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};
export const settlePaymentApi = async (data) => {
    try {
        const response = await axiosInstance.post(`/anonymous-receipt/settle-additional-receipt`, data);
        return response;
    }
    catch (error) {
        throw error;
    }
};


export const getAllOnlineSelfPaymentApi = async () => {
    try {
        const response = await axiosInstance.post(`/payment/online-self/all`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const deleteOnlineSelfPaymentApi = async (p_txnId) => {
    try {
        const response = await axiosInstance.delete(`/payment/online-self/${p_txnId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updateOnlineSelfPaymentStatusApi = async (p_txnId, paymentStatus, clearanceDate) => {
    try {
        const formattedStatus = paymentStatus
            ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).toLowerCase()
            : paymentStatus;

        const payload = {
            transactionId: p_txnId,
            onlineSelfStatus: formattedStatus,
        };

        if (clearanceDate) {
            payload.clearanceDate = clearanceDate;
        }

        const response = await axiosInstance.patch(`/payment/online-self/update-status`, payload);
        return response;
    } catch (error) {
        throw error;
    }
};