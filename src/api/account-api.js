import axiosInstance from './axiosInstance';

// ─────────────────────────────────────────────────────────────
// INVOICE APIs
// ─────────────────────────────────────────────────────────────

/** GET /payment/invoice/:id — single invoice by ID */
export const getInvoicesDetailApi = async (invoiceId) => {
    try {
        const response = await axiosInstance.get(`payment/invoice/${invoiceId}`);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/invoice/all — all invoices for a society */
export const getAllInvoicesApi = async (filters = {}, societyIdentifier) => {
    try {
        const response = await axiosInstance.post(
            `payment/invoice/all?society_identifier=${societyIdentifier}`,
            filters
        );
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/generate-invoice — generate new invoice
 *  Required keys: society_identifier, property_identifier, amount
 *  Optional keys: invoice_type, due_date, invoice_date, description, member_name, email
 */
export const generateInvoiceApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/generate-invoice`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/unprocess-invoice — reverse / delete an invoice
 *  Required keys: society_identifier, invoice_number  (+ id if available)
 */
export const unprocessInvoiceApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/unprocess-invoice`, data);
        return response;
    } catch (error) { throw error; }
};

/** GET /payment/is-invoice-processing/:societyIdentifier */
export const getIsInvoiceProcessingApi = async (societyIdentifier) => {
    try {
        const response = await axiosInstance.get(`payment/is-invoice-processing/${societyIdentifier}`);
        return response;
    } catch (error) { throw error; }
};

/** GET /payment/get-invoice-outstanding/:invoiceId */
export const getInvoiceOutstandingApi = async (invoiceId) => {
    try {
        const response = await axiosInstance.get(`payment/get-invoice-outstanding/${invoiceId}`);
        return response;
    } catch (error) { throw error; }
};

/** GET /payment/invoice-history/:id */
export const getInvoiceHistoryApi = async (id) => {
    try {
        const response = await axiosInstance.get(`payment/invoice-history/${id}`);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/get-latest-invoice-date */
export const getLatestInvoiceDateApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/get-latest-invoice-date`, data);
        return response;
    } catch (error) { throw error; }
};

/** GET /payment/get-property-outstanding/:propertyId */
export const getPropertyOutstandingApi = async (propertyId) => {
    try {
        const response = await axiosInstance.get(`payment/get-property-outstanding/${propertyId}`);
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// RECEIPT APIs
// ─────────────────────────────────────────────────────────────

/** POST /payment/receipt/all — all receipts for a society */
export const getAllReceiptsApi = async (societyIdentifier, filters = {}) => {
    try {
        const response = await axiosInstance.post(
            `payment/receipt/all?society_identifier=${societyIdentifier}`,
            filters
        );
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/unprocess-receipt — reverse / delete a receipt */
export const unprocessReceiptApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/unprocess-receipt`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/add-bulk-receipt — bulk receipts via JSON */
export const addBulkReceiptApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/add-bulk-receipt`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/add-bulk-receipt — bulk receipts via Excel file */
export const addReceiptBulkUploadFileApi = async (data) => {
    const formData = new FormData();
    for (const key in data) { formData.append(key, data[key]); }
    try {
        const response = await axiosInstance.post(`payment/add-bulk-receipt`, formData);
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// CASH / CHEQUE PAYMENT APIs
// ─────────────────────────────────────────────────────────────

/** POST /payment/cash — submit a cash payment
 *  Keys: amountInFigures, invoiceNumber, propertyIdentifier,
 *        notesDetails, mobile, receiptDate, discount
 */
export const createCashPaymentApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/cash`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/cheque — submit a cheque payment
 *  Keys: invoiceNumber, bankName, chequeDate, receiptDate,
 *        chequeReceivedDate, branchName, amountInFigures,
 *        amountInWords, propertyIdentifier, chequeNumber, mobile
 */
export const createChequePaymentApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/cheque`, data);
        return response;
    } catch (error) { throw error; }
};

/** PATCH /payment/cheque/update-status — update cheque status */
export const updateChequeStatusApi = async (data) => {
    try {
        const response = await axiosInstance.patch(`payment/cheque/update-status`, data);
        return response;
    } catch (error) { throw error; }
};

/** DELETE /payment/cash/:id */
export const deleteCashLogApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`payment/cash/${id}`);
        return response;
    } catch (error) { throw error; }
};

/** DELETE /payment/cheque/:id */
export const deleteChequeLogApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`payment/cheque/${id}`);
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// VERIFY / OTP APIs
// ─────────────────────────────────────────────────────────────

/** PATCH /payment/verify — verify a payment
 *  Keys: invoiceNumber, amountInFigures, paidDate,
 *        propertyIdentifier, transactionId, mobileNumber, otp, discount
 */
export const verifyPaymentApi = async (data) => {
    try {
        const response = await axiosInstance.patch(`payment/verify`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/send-otp */
export const sendOtpApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/send-otp`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/verify-otp */
export const verifyOtpApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/verify-otp`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/resend-otp
 *  Keys: mobileNumber, invoiceNumber, propertyIdentifier,
 *        chequeNumber, amountInFigures, paymentMethod
 */
export const resendOtpApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/resend-otp`, data);
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// DISCOUNT API
// ─────────────────────────────────────────────────────────────

/** POST /payment/discount */
export const applyDiscountApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/discount`, data);
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// ONLINE SELF PAYMENT APIs
// ─────────────────────────────────────────────────────────────

/** POST /payment/create-order — create a Razorpay / gateway order */
export const createPaymentOrderApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/create-order`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/online-self/all — all online self payments */
export const getAllOnlineSelfPaymentApi = async (societyIdentifier, filters = {}) => {
    try {
        const response = await axiosInstance.post(
            `payment/online-self/all?society_identifier=${societyIdentifier}`,
            filters
        );
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/online-self — create a new online self payment */
export const createNewOnlineSelfPaymentApi = async (data) => {
    try {
        const formData = new FormData();
        for (const key in data) { formData.append(key, data[key]); }
        const response = await axiosInstance.post(`payment/online-self`, formData);
        return response;
    } catch (error) { throw error; }
};

/** PATCH /payment/online-self/update-status — update online self payment status */
export const updateOnlineSelfStatusApi = async (data) => {
    try {
        const response = await axiosInstance.patch(`payment/online-self/update-status`, data);
        return response;
    } catch (error) { throw error; }
};

/** DELETE /payment/online-self/:id */
export const deleteOnlineSelfApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`payment/online-self/${id}`);
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// PAYMENT LOGS API
// ─────────────────────────────────────────────────────────────

/** POST /payment/payment-log/all */
/** POST /payment/payment-log/all
 *  Optional body: fromDate, toDate, propertyIdentifier, amountInFigures, invoiceNumber
 *  Note: Postman shows no society_identifier query param for this endpoint
 */
export const getAllPaymentLogsApi = async (societyIdentifier, filters = {}) => {
    try {
        const response = await axiosInstance.post(
            `payment/payment-log/all?society_identifier=${societyIdentifier}`,
            filters
        );
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// ACKNOWLEDGEMENT API
// ─────────────────────────────────────────────────────────────

/** POST /payment/acknowledgement */
export const getAllAcknowledgementsApi = async (societyIdentifier) => {
    try {
        const response = await axiosInstance.post(
            `payment/acknowledgement?society_identifier=${societyIdentifier}`
        );
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// ANONYMOUS RECEIPT APIs
// ─────────────────────────────────────────────────────────────

/** POST /anonymous-receipt/society/:societyIdentifier */
export const getAllAnonymousReceiptsApi = async (societyIdentifier, filters = {}) => {
    try {
        const response = await axiosInstance.post(
            `anonymous-receipt/society/${societyIdentifier}`,
            filters
        );
        return response;
    } catch (error) { throw error; }
};

/** POST /anonymous-receipt/new-anonymous-receipt */
export const addReceiptApi = async (data) => {
    try {
        const response = await axiosInstance.post(`anonymous-receipt/new-anonymous-receipt`, data);
        return response;
    } catch (error) { throw error; }
};

/** PUT /anonymous-receipt/update-anonymous-receipt/:id */
export const updateAnonymousReceiptApi = async (data, id) => {
    try {
        const response = await axiosInstance.put(
            `anonymous-receipt/update-anonymous-receipt/${id}`,
            data
        );
        return response;
    } catch (error) { throw error; }
};

/** DELETE /anonymous-receipt/:id */
export const deleteAnonymousReceiptApi = async (id) => {
    try {
        const response = await axiosInstance.delete(`anonymous-receipt/${id}`);
        return response;
    } catch (error) { throw error; }
};

/** POST /anonymous-receipt/additional-receipt-ddl — for settlement dropdown */
export const getAllReceiptsForSettlementApi = async (data) => {
    try {
        const response = await axiosInstance.post(`anonymous-receipt/additional-receipt-ddl`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /anonymous-receipt/settle-additional-receipt */
export const settlePaymentApi = async (data) => {
    try {
        const response = await axiosInstance.post(`anonymous-receipt/settle-additional-receipt`, data);
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// LEDGER / PROPERTY ACCOUNT APIs
// ─────────────────────────────────────────────────────────────

/** POST /property/property-account — ledger for a property */
export const getAllLedgersOfPropertyApi = async (filters) => {
    try {
        const response = await axiosInstance.post(`property/property-account`, filters);
        return response;
    } catch (error) { throw error; }
};

/** POST /property/property-total */
export const getPropertyTotalLedgerAmount = async (data) => {
    try {
        const response = await axiosInstance.post(`property/property-total`, data);
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// BANK APIs
// ─────────────────────────────────────────────────────────────

/** GET /society/:societyIdentifier/ddl/banks */
export const getAllBanksApi = async (societyIdentifier) => {
    try {
        const response = await axiosInstance.get(`society/${societyIdentifier}/ddl/banks`);
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// DOWNLOAD APIs
// ─────────────────────────────────────────────────────────────

/** POST /payment/download/invoice — download single invoice PDF */
export const downloadInvoiceApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/download/invoice`, data, {
            responseType: 'blob',
        });
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/download-bulk/invoice — bulk invoice PDF download */
export const downloadBulkInvoiceApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/download-bulk/invoice`, data, {
            responseType: 'blob',
        });
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/download-bulk/receipt — bulk receipt PDF download */
export const downloadBulkReceiptApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/download-bulk/receipt`, data, {
            responseType: 'blob',
        });
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/download-excel/invoice — Tally / Excel download */
export const downloadBulkTallyDataApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/download-excel/invoice`, data, {
            responseType: 'blob',
        });
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/download/property-ledger — property ledger PDF */
export const downloadBulkLedgerApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/download/property-ledger`, data, {
            responseType: 'blob',
        });
        return response;
    } catch (error) { throw error; }
};

/** POST /payment/download/property-ledger-pdf */
export const downloadBulkLedgerPdfApi = async (data) => {
    try {
        const response = await axiosInstance.post(`payment/download/property-ledger-pdf`, data, {
            responseType: 'blob',
        });
        return response;
    } catch (error) { throw error; }
};

// ─────────────────────────────────────────────────────────────
// SMS APIs
// ─────────────────────────────────────────────────────────────

/** POST /sms/already-generated-invoices */
export const sendBulkSmsApi = async (data) => {
    try {
        const response = await axiosInstance.post(`sms/already-generated-invoices`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /sms/send-payment-reminder */
export const sendBulkReminderSmsApi = async (data) => {
    try {
        const response = await axiosInstance.post(`sms/send-payment-reminder`, data);
        return response;
    } catch (error) { throw error; }
};

/** POST /sms/send-receipt-sms */
export const sendReceiptSmsApi = async (data) => {
    try {
        const response = await axiosInstance.post(`sms/send-receipt-sms`, data);
        return response;
    } catch (error) { throw error; }
};