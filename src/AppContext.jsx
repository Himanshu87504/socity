// @ts-nocheck
// ============================================================
// AppContext.jsx — Full API-powered data layer
// Fetches all module data from real APIs with mock fallback
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

import { getAllAnnouncementApi }    from "./api/announcement-api";
import { getAllNoticeApi }          from "./api/notice-api";
import {
    getAllInvoicesApi,
    getAllReceiptsApi,
    getAllPaymentLogsApi,
    getAllAnonymousReceiptsApi,
    getAllOnlineSelfPaymentApi,
} from "./api/account-api";
import { getDashboardDataApi }      from "./api/dashboard-api";
import { getAllComplaintsApi }      from "./api/complaint-api";
import { getAllTenantApi }          from "./api/tenant-api";
import { getAllLoansApi }           from "./api/loan-api";
import { getAllNewParkingApi }      from "./api/parking-api";
import { getAllHelpersApi }         from "./api/helpers-api";
import { getAllPetsApi }            from "./api/pets-api";
import { getAllVisitorApi }         from "./api/visitor-api";
import { getAllSocietyApi }         from "./api/society-api";
import { getAllTowerApi }           from "./api/tower-api";
import { getAllWingApi }            from "./api/wing-api";
// import { getAllPropertyApi }        from "./api/property-api";
import { getSocietyMembersApi }     from "./api/member-api";
import { getAllVendorApi }          from "./api/vendor-api";
import { getAllApplicationApi }     from "./api/application-api";
import { getAllParentEntityApi }   from "./api/parentEntity-api";
import { getAllOccasionsApi }        from "./api/occasion-api";
import { getAllChargeMasterApi }     from "./api/chargemaster-api";
import { getAllCommiteeMembersApi }  from "./api/commitee-api";
import { getAllLedgersOfPropertyApi } from "./api/account-api";
import { getAllTermsConditionApi } from "./api/termsCondition-api";

import { getAllPropertyApi }        from "./api/property-api";
// ── Society identifier from localStorage (set after login) ───
const getSocietyIdentifier = () =>
    localStorage.getItem("society_identifier") ||
    localStorage.getItem("societyId") ||
    "";

// ============================================================
// FIELD MAPPERS — normalize API response fields to UI shape
// ============================================================
function mapOccasion(item, i) {
    return {
        occasionId:          item.occasionId          || item.occasion_id  || item.id || item._id || i + 1,
        occasionName:        safeStr(item.occasionName        || item.occasion_name || item.name  || item.title),
        occasionDescription: safeStr(item.occasionDescription || item.occasion_description || item.description || item.content),
    };
}

function mapAnnouncement(item, i) {
    return {
        id: item.announcementIdentifier || item.id || item._id || i + 1,
        announcementIdentifier: item.announcementIdentifier || `ANN-${String(i + 1).padStart(3, "0")}`,
        society: item.society ? (item.society.societyName || item.society.societyIdentifier) : safeStr(item.society),
        name: safeStr(item.announcementName || item.title || item.subject || item.heading),
        type: safeStr(item.type || item.category || item.announcementType) || "General",
        startDate: item.startDate || item.start_date || item.from_date || item.date || item.createdAt || "",
        validDate: item.validDate || item.valid_till || item.end_date || item.expiry || item.expiryDate || "",
        content: safeStr(item.message || item.content || item.description || item.body),
        views: item.views || item.view_count || item.viewCount || 0,

        // ✅ Identifiers for edit form dropdowns
        societyIdentifier: item.society?.societyIdentifier || item.societyIdentifier || "",
        towerIdentifier: item.tower?.towerIdentifier || item.towerIdentifier || "",
        wingIdentifier: item.wing?.wingIdentifier || item.wingIdentifier || "",
        propertyIdentifier: item.property?.propertyIdentifier || item.propertyIdentifier || "",
        tower: item.tower || null,
        wing: item.wing || null,
        property: item.property || null,

        // ✅ ADD THIS — file path for edit form
        announcementFilePath: item.announcementFilePath || item.filePath || item.file_path || "",
    };
}

function mapNotice(item, i) {
    return {
        id:                 item.noticeIdentifier || item.notice_identifier || item.id || item._id || i + 1,
        noticeId:           item.noticeId || item.notice_id || item.noticeIdentifier || `NOT-${String(i + 1).padStart(3, "0")}`,
        society:            safeStr(item.society?.societyName || item.society || item.societyName || item.societyIdentifier),
        societyIdentifier:  safeStr(item.society?.societyIdentifier || item.societyIdentifier || ""),
        title:              safeStr(item.noticeSubject || item.title || item.subject || item.name),
        type:               safeStr(item.noticeType || item.type || item.category) || "General",
        priority:           item.urgency || item.priority || item.priorityLevel || "Normal",
        date:               item.startDate || item.date || item.notice_date || item.createdAt || "",
        expiry:             item.validDate || item.expiry || item.expiry_date || "",
        pinned:             item.pinned || item.is_pinned || item.isPinned || false,
        content:            safeStr(item.message || item.description || item.content || item.body),
        startDate:          item.startDate || "",
        validDate:          item.validDate || "",
        noticeType:         item.noticeType || "",
        message:            item.message || "",
        towerIdentifier:    item.tower?.towerIdentifier || item.towerIdentifier || "",
        wingIdentifier:     item.wing?.wingIdentifier || item.wingIdentifier || "",
        propertyIdentifier: item.property?.propertyIdentifier || item.propertyIdentifier || "",
        color:              item.color || "#00d4aa",
    };
}

// Backend camelCase: invoiceNumber, invoiceType, amountInFigures,
// dueDate, billDate, propertyIdentifier, societyIdentifier, ownerName, flatNo
function mapInvoice(item, i) {
    return {
        id:                 item.id                             || i + 1,
        invId:              safeStr(item.invoiceNumber)         || `INV-${String(i + 1).padStart(4, "0")}`,
        flatNo:             safeStr(item.flatNo                 || item.propertyIdentifier),
        ownerName:          safeStr(item.ownerName              || item.memberName),
        type:               safeStr(item.invoiceType)           || "Maintenance",
        amount:             Number(item.amountInFigures         || item.amount || 0),
        dueDate:            safeStr(item.dueDate),
        issueDate:          safeStr(item.billDate               || item.createdAt),
        status:             mapInvoiceStatus(item.status        || ""),
        society:            safeStr(item.societyIdentifier),
        description:        safeStr(item.description            || item.narration),
        propertyIdentifier: safeStr(item.propertyIdentifier),
    };
}

function mapInvoiceStatus(raw) {
    const s = (raw || "").toLowerCase();
    if (["paid", "completed", "success", "cleared"].includes(s))       return "Paid";
    if (["overdue", "defaulted", "expired", "late"].includes(s))       return "Overdue";
    if (["cancelled", "canceled", "void", "rejected"].includes(s))     return "Cancelled";
    return "Unpaid";
}

function mapCharge(item, i) {
    return {
        id:                 item.id               || item.chargeIdentifier  || item._id          || i + 1,
        chargeNumber:       item.chargeNumber      || item.charge_number    || `CH-${String(i+1).padStart(7,"0")}`,
        chargeName:         safeStr(item.chargeName       || item.charge_name    || item.name),
        chargeMasterType:   safeStr(item.chargeMasterType || item.charge_master_type)             || "Property",
        chargeType:         safeStr(item.chargeType       || item.charge_type)                    || "Maintenance",
        billingType:        safeStr(item.billingType      || item.billing_type)                   || "Lumpsum",
        billingFrequency:   safeStr(item.billingFrequency || item.billing_frequency)              || "Monthly",
        societyIdentifier:  safeStr(item.societyIdentifier || item.society_identifier)            || "",
        towerIdentifier:    safeStr(item.towerIdentifier  || item.tower_identifier)               || "",
        wingIdentifier:     safeStr(item.wingIdentifier   || item.wing_identifier)                || "",
        propertyIdentifier: safeStr(item.propertyIdentifier || item.property_identifier)          || "",
        amount:             Number(item.amount      || 0),
        totalAmount:        Number(item.totalAmount || item.total_amount || 0),
        psfRate:            Number(item.psfRate     || item.psf_rate     || 0),
        dueDate:            item.dueDate            || item.due_date     || "",
        startDate:          item.startDate          || item.start_date   || "",
        endDate:            item.endDate            || item.end_date     || "",
        interestApplicable: item.interestApplicable || item.interest_applicable || false,
        interestStartDate:  item.interestStartDate  || item.interest_start_date || "",
        rateOfInterest:     item.rateOfInterest     || item.rate_of_interest    || "",
        narration:          safeStr(item.narration) || "",
        gst:                Number(item.gst || 0),
        isDeleted:          item.isDeleted          || item.is_deleted   || false,
        createdAt:          item.createdAt          || item.created_at   || "",
    };
}

function mapCommitteeMember(item, i) {
    return {
        id:          item.committeeMemberId         || item.id   || item._id || i + 1,
        memberId:    item.committeeMemberIdentifier || item.committeeMemberId || ("CMR-" + String(i + 1).padStart(3, "0")),
        fullName:    String(item.fullName   || item.full_name  || item.name || "").trim(),
        contact:     String(item.contactNumber || item.contact || item.phone || item.mobile || "").trim(),
        designation: String(item.designation  || item.role    || item.position || "").trim(),
        appTypes:    Array.isArray(item.applicationType) ? item.applicationType : [],
    };
}
function mapComplaint(item, i) {
    // Preserve nested objects as-is so ComplaintsDashboard raw-field helpers work correctly
    // e.g. d?.category?.id, d?.society?.societyIdentifier, d?.property?.propertyIdentifier
    const rawCategory = item.category && typeof item.category === "object" ? item.category : null;
    const rawSociety  = item.society  && typeof item.society  === "object" ? item.society  : null;
    const rawProperty = item.property && typeof item.property === "object" ? item.property : null;

    return {
        id:          item.id          || item._id          || i + 1,
        compId:      safeStr(item.compId || item.complaint_id || item.identifier) || `CMP-${String(i + 1).padStart(3, "0")}`,
        // Nested objects preserved for dashboard field helpers
        property:    rawProperty || item.property    || item.flat_no   || item.unit || item.propertyNumber || "",
        category:    rawCategory || item.category    || item.type      || item.complaintType || "",
        society:     rawSociety  || item.society     || item.society_name || item.societyName || "",
        // Flat fields for backward compat
        propertyIdentifier: safeStr(rawProperty?.propertyIdentifier || item.propertyIdentifier || ""),
        societyIdentifier:  safeStr(rawSociety?.societyIdentifier   || item.societyIdentifier  || ""),
        categoryId:         safeStr(rawCategory?.id                 || item.categoryId         || ""),
        assignTo:    safeStr(item.assignTo    || item.assigned_to || item.assignedTo  || item.vendorName || item.vendor_name),
        createdAt:   safeStr(item.createdAt   || item.dateTime    || item.date_time   || item.created_at || item.date),
        dateTime:    safeStr(item.dateTime    || item.date_time   || item.createdAt   || item.created_at || item.date),
        status:      safeStr(item.status || item.complaint_status) || "pending",
        priority:    safeStr(item.priority || item.urgency) || "medium",
        description: safeStr(item.description || item.content  || item.remarks || item.complaint_description),
        complaintStatusHistory: Array.isArray(item.complaintStatusHistory) ? item.complaintStatusHistory : [],
    };
}

function mapComplaintStatus(raw) {
    const s = (raw || "").toLowerCase();
    if (["resolved", "done", "fixed", "completed"].includes(s)) return "Resolved";
    if (["in progress", "in_progress", "inprogress", "processing", "assigned"].includes(s)) return "In Progress";
    if (["closed", "closed out"].includes(s)) return "Closed";
    return "Open";
}

function mapPriority(raw) {
    const s = (raw || "").toLowerCase();
    if (["critical", "emergency", "very high"].includes(s)) return "Critical";
    if (["high", "important"].includes(s)) return "High";
    if (["medium", "moderate", "normal"].includes(s)) return "Medium";
    return "Low";
}

function mapTenant(item, i) {
    const propertyInfo = item.tenantProperties?.[0] || {};
    const property = item.property || {};
    const vehicle = item.tenantVehicles?.[0] || {};
    console.log("PROPERTY =", item.property);
console.log("TENANT PROPERTY =", item.tenantProperties?.[0]);

    return {
        id: item.id || item.tenantIdentifier || i + 1,

        tenantIdentifier: item.tenantIdentifier || "",

        firstName: item.firstName || "",
        middleName: item.middleName || "",
        lastName: item.lastName || "",

        name: [
            item.firstName,
            item.middleName,
            item.lastName
        ]
            .filter(Boolean)
            .join(" "),

        mobileNumber: item.mobileNumber || "",
        alternateMobileNumber: item.alternateMobileNumber || "",

        phone:
            item.mobileNumber ||
            item.alternateMobileNumber ||
            "",

        email: item.email || "",

        gender: item.gender || "",
        age: item.age || "",

        dateOfBirth: item.dateOfBirth || "",
        anniversary: item.anniversary || "",

        // NEW
        aadharNumber: item.aadharNumber || "",
        country: item.country || "",
        state: item.state || "",
        city: item.city || "",
        pincode: item.pincode || "",
        havePet: item.havePet || false,
        familyMembers: item.familyMembers || "",

        address: item.address || "",

        profilePic: item.profilePicPath || "",

        propertyIdentifier:
            propertyInfo.propertyIdentifier || "",

        propertyName:
            propertyInfo.property?.propertyName || "",

        moveIn:
            propertyInfo.rentAgreementStartDate || "",

        moveOut:
            propertyInfo.rentAgreementEndDate || "",

        rentAgreementStartDate:
            property.rentAgreementStartDate ||
            propertyInfo.rentAgreementStartDate ||
            "",

        rentAgreementEndDate:
            property.rentAgreementEndDate ||
            propertyInfo.rentAgreementEndDate ||
            "",

        // NEW PROPERTY FIELDS
        rentRegistrationId:
            property.rentRegistrationId || "",

        monthlyRent:
            property.monthlyRent || "",

        depositAmount:
            property.depositAmount || "",

        dueAmount:
            property.dueAmount || "",

        // NEW VEHICLE FIELDS
        vehicleType:
            vehicle.vehicleType || "",

        vehicleNumber:
            vehicle.vehicleNumber || "",

        tenantVehicles:
            item.tenantVehicles || [],

        tenantProperties:
            item.tenantProperties || [],

        status:
            propertyInfo.rentAgreementEndDate
                ? new Date(propertyInfo.rentAgreementEndDate) < new Date()
                    ? "Expired"
                    : "Active"
                : "Inactive"
    };
}

// function mapTenantStatus(raw) {
//     const s = (raw || "").toLowerCase();
//     if (["active", "current", "live"].includes(s))      return "Active";
//     if (["expired", "ended", "past"].includes(s))       return "Expired";
//     return "Inactive";
// }
function mapLoan(item, i) {
    return {
        id:         item.loanIdentifier       || item._id         || i + 1,
        loanNumber: item.loanNumber || item.loan_number || item.loanId || item.loan_id || item.loanIdentifier || item.identifier || `LN-${String(i + 1).padStart(7, "0")}`,
        property:   safeStr(item.property || item.propertyIdentifier || item.property_identifier || item.flat_no || item.propertyNumber || item.property_number),
        member:     safeStr(item.memberType || item.fullNamekkj || item.full_name || item.member_name || item.memberName || item.owner_name || item.ownerName),
name: safeStr(item.loan_name || item.loanName || item.name || item.purpose || item.description),
        type:       safeStr(item.type || item.loan_type || item.loanType),
        period:     item.period     || item.tenure      || item.duration        || item.loan_period      || "",
        amount:     Number(item.amount || item.loan_amount || item.loanAmount   || item.principal        || 0),
        emi:        Number(item.emi  || item.monthlyEmi  || item.monthly_emi    || item.emiAmount        || item.emi_amount || item.monthly_payment  || 0),
        status:     mapLoanStatus(item.status || item.loan_status || ""),
        disbursed:  item.disbursed  || item.disbursed_date || item.disbursementDate || item.disbursal_date || item.startDate || item.start_date || "",
        bankName: item.bankName,
        bankAddress:item.bankAddress,
        name:item.fullName,
        startDate: item.startDate,
        endDate:item.endDate
    };
}

function mapLoanStatus(raw) {
    const s = (raw || "").toLowerCase();
    if (["active", "running", "current", "ongoing"].includes(s)) return "Active";
    if (["closed", "repaid", "completed", "settled"].includes(s)) return "Closed";
    return "Pending";
}


function mapParking(item, i) {
    return {
        id:            item.id            || item._id              || i + 1,
        parkingNumber: item.parkingNumber || item.parking_number   || item.parkingId || item.parking_id || item.slot_number || item.slotNumber || `PK-${String(i + 1).padStart(3, "0")}`,
        society:       safeStr(item.society || item.society_name || item.societyName || item.societyIdentifier),
        member:        safeStr(item.member || item.member_name || item.memberName || item.owner_name || item.ownerName) || "—",
        property:      safeStr(item.property || item.flat_no || item.unit || item.propertyNumber) || "—",
        nature:        safeStr(item.nature || item.parking_type || item.parkingType || item.type) || "Open",
        vehicleType:   safeStr(item.vehicleType || item.vehicle_type || item.vehicle) || "—",
        registration:  safeStr(item.registration || item.vehicle_number || item.vehicleNumber || item.reg_number) || "—",
        status:        mapParkingStatus(item.status || item.parking_status || ""),
    };
}

function mapParkingStatus(raw) {
    const s = (raw || "").toLowerCase();
    if (["occupied", "assigned", "allotted", "used"].includes(s)) return "Occupied";
    return "Available";
}

function mapHelper(item, i) {
    return {
        id:           item.id           || item._id          || i + 1,
        helperId:     item.helperId     || item.helper_id    || item.identifier || `HLP-${String(i + 1).padStart(3, "0")}`,
        name:         safeStr(item.name || item.full_name || item.fullName || item.helper_name),
        category:     safeStr(item.category || item.type || item.helperType || item.role) || "Other",
        phone:        safeStr(item.phone || item.mobile || item.contact || item.mobile_number),
        email:        item.email        || item.email_id     || "",
        society:      safeStr(item.society || item.society_name || item.societyName || item.societyIdentifier),
        experience:   item.experience   || item.exp          || item.years_experience || "",
        rating:       Number(item.rating || item.avg_rating  || item.averageRating || 0),
        jobs:         Number(item.jobs   || item.total_jobs  || item.jobCount || item.completed_jobs || 0),
        availability: mapHelperAvailability(item.availability || item.status || ""),
        address:      item.address      || item.current_address || "",
    };
}

function mapHelperAvailability(raw) {
    const s = (raw || "").toLowerCase();
    if (["on duty", "on_duty", "busy", "working", "engaged"].includes(s)) return "On Duty";
    if (["off duty", "off_duty", "offline"].includes(s))                   return "Off Duty";
    if (["leave", "on leave", "absent"].includes(s))                       return "Leave";
    return "Available";
}

function mapPet(item, i) {
    return {
        id:                 item.id                 || item._id || i + 1,
        petType:            safeStr(item.petType    || item.type || item.pet_type || item.species) || "Other",
        petName:            safeStr(item.petName    || item.pet_name || item.name),
        age:                item.age                ?? item.pet_age ?? "",
        isVaccinated:       item.isVaccinated       ?? item.vaccinated ?? item.is_vaccinated ?? false,
        petPhotoFilePath:   item.petPhotoFilePath   || item.photoPath || item.photo || "",
        propertyIdentifier: safeStr(item.propertyIdentifier || item.flatNo || item.flat_no || item.propertyNumber),
        userIdentifier:     safeStr(item.userIdentifier || item.ownerName || item.owner_name || item.memberName),
        createdAt:          item.createdAt          || item.registeredOn || item.created_at || "",
        isDeleted:          item.isDeleted          || false,
        // legacy fields kept for compatibility
        petId:              item.petId || item.identifier || `PET-${String(i + 1).padStart(3, "0")}`,
        ownerName:          safeStr(item.userIdentifier || item.ownerName || item.owner_name),
        flatNo:             safeStr(item.propertyIdentifier || item.flatNo || item.flat_no),
        vaccinated:         item.isVaccinated ?? item.vaccinated ?? false,
        type:               safeStr(item.petType || item.type) || "Other",
    };
}

function mapPetStatus(raw) {
    const s = (raw || "").toLowerCase();
    if (["registered", "approved", "active"].includes(s)) return "Registered";
    if (["expired", "lapsed"].includes(s))                 return "Expired";
    return "Pending";
}

function mapVisitor(item, i) {
    return {
        id:          item.id          || item._id           || i + 1,
        visitId:     item.visitId     || item.visitor_id    || item.visitorId || item.identifier || `VIS-${String(i + 1).padStart(3, "0")}`,
        visitorName: safeStr(item.visitorName || item.visitor_name || item.name || item.full_name),
        hostFlat:    safeStr(item.hostFlat || item.host_flat || item.flat_no || item.propertyNumber || item.unit),
        hostName:    safeStr(item.hostName || item.host_name || item.resident_name || item.residentName),
        type:        safeStr(item.type || item.visit_type || item.visitorType || item.purpose_type) || "Guest",
        checkIn:     item.checkIn     || item.check_in      || item.in_time       || item.entry_time   || "",
        checkOut:    item.checkOut    || item.check_out     || item.out_time      || item.exit_time    || "",
        purpose:     safeStr(item.purpose || item.reason || item.visit_purpose),
        status:      mapVisitorStatus(item.status || item.visit_status || ""),
        society:     safeStr(item.society || item.society_name || item.societyName || item.societyIdentifier),
    };
}

function mapVisitorStatus(raw) {
    const s = (raw || "").toLowerCase();
    if (["checked in", "checked_in", "inside", "active", "entered"].includes(s))     return "Checked In";
    if (["checked out", "checked_out", "outside", "exited", "left"].includes(s))     return "Checked Out";
    if (["cancelled", "canceled", "rejected", "denied"].includes(s))                 return "Cancelled";
    return "Expected";
}

// ── Safe string extractor — handles object values from API ───
function safeStr(val) {
    if (val == null) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    if (typeof val === "object") {
        // property objects: {propertyIdentifier, propertyName}
        if (val.propertyName) return val.propertyName;
        if (val.propertyIdentifier) return val.propertyIdentifier;
        // category/type objects: {id, name}
        if (val.name) return val.name;
        // society objects
        if (val.societyName) return val.societyName;
        if (val.society_name) return val.society_name;
        // generic label/title/value
        if (val.label) return val.label;
        if (val.title) return val.title;
        if (val.value) return String(val.value);
        // last resort
        if (val.id) return String(val.id);
        return "";
    }
    return String(val);
}


function mapSociety(item, i) {
    const identifier = safeStr(item.identifier || item.societyIdentifier || item.society_identifier || item.id);
    const name = safeStr(item.name || item.societyName || item.society_name || item.identifier);
    return {
        id: item.id || item._id || i + 1,
        name,
        address: safeStr(item.address || item.full_address || item.location),
        units: Number(item.units || item.totalUnits || item.total_units || item.propertyCount || 0),
        contact: safeStr(item.contact || item.phone || item.mobile || item.contactNumber),
        email: safeStr(item.email || item.emailId || item.email_id),
        status: ["active", "live", "running"].includes((item.status || "").toLowerCase()) ? "Active" : "Active",
        identifier,
        // ✅ Aliases used by global society selector & InvoiceTab/AccountsDashboard
        societyIdentifier: identifier,
        societyName: name,
    };
}

function mapTower(item, i) {
    return {
        id:      item.id    || item._id   || i + 1,
        name:    safeStr(item.name || item.towerName || item.tower_name),
        floors:  Number(item.floors || item.totalFloors || item.floorCount || 0),
        units:   Number(item.units  || item.totalUnits  || item.unitCount  || 0),
        society: safeStr(item.society || item.societyName || item.society_name || item.societyIdentifier),
        status:  ["active","live"].includes((item.status||"").toLowerCase()) ? "Active" : "Inactive",
        identifier: safeStr(item.identifier || item.towerIdentifier || item.id),
    };
}

function mapWing(item, i) {
    return {
        id:           item.id    || item._id   || i + 1,
        name:         safeStr(item.name || item.wingName || item.wing_name),
        tower:        safeStr(item.tower || item.towerName || item.tower_name || item.towerIdentifier),
        floors:       Number(item.floors || item.totalFloors || 0),
        flatsPerFloor:Number(item.flatsPerFloor || item.flats_per_floor || item.unitsPerFloor || 0),
        status:       ["active","live"].includes((item.status||"").toLowerCase()) ? "Active" : "Inactive",
        identifier:   safeStr(item.identifier || item.wingIdentifier || item.id),
    };
}

function mapProperty(item, i) {
  const primaryMember = item.propertyMembers?.find(m => m.isPrimary)?.member || item.propertyMembers?.[0]?.member;
  return {
    id:                       item.propertyIdentifier || item.id || item._id || i + 1,
    identifier:               item.propertyIdentifier || "",
    propertyIdentifier:       item.propertyIdentifier || "",
    propertyName:             item.propertyName       || "",
    flatNumber:               item.flatNumber         || "",
    floorNumber:              item.floorNumber        || "",
    narration:                item.narration          || "",
    area:                     item.area               || "",
    status:                   item.status             || "Vacant",
    dealType:                 item.dealType           || "",
    flatRegistrationNumber:   item.flatRegistrationNumber || "",
    intercomNumber:           item.intercomNumber     || "",
    electricityNumber:        item.electricityNumber  || "",
    gasConnectionNumber:      item.gasConnectionNumber|| "",
    openingPrincipalAmount:   item.openingPrincipalAmount || "",
    openingInterestAmount:    item.openingInterestAmount  || "",
    dateOfOpeningBalance:     item.dateOfOpeningBalance   || "",
    dateOfRegistration:       item.dateOfRegistration     || "",
    dateOfAgreement:          item.dateOfAgreement        || "",
    monthlyMaintenance:       item.monthlyMaintenance     || "",
    monthlyMaintenanceUpto:   item.monthlyMaintenanceUpto || "",
    monthlyPaidArrears:       item.monthlyPaidArrears     || "",
    monthlyPaidArrearsUpto:   item.monthlyPaidArrearsUpto || "",
    societyIdentifier:        item.societyIdentifier      || item.society?.societyIdentifier || "",
    societyName:              item.society?.societyName   || "",
    wingIdentifier:           item.wing?.wingIdentifier   || "",
    wingName:                 item.wing?.wingName         || "",
    ownerName:                primaryMember
                                ? [primaryMember.firstName, primaryMember.lastName].filter(Boolean).join(" ")
                                : "",
    ownerMobile:              primaryMember?.mobileNumber || "",
    ownerIdentifier:          primaryMember?.identifier   || "",
    propertyMembers:          item.propertyMembers        || [],
  };
}

function mapMember(item, i) {
    return {
        id:     item.id   || item._id   || i + 1,
        name:   safeStr(item.name || item.fullName || item.full_name || item.memberName),
        unit:   safeStr(item.unit || item.flatNo   || item.flat_no   || item.propertyNumber),
        role:   safeStr(item.role || item.memberType || item.member_type || item.designation) || "Owner",
        phone:  safeStr(item.phone || item.mobile || item.contact || item.mobileNumber),
        email:  safeStr(item.email || item.emailId || item.email_id),
        status: ["active","live"].includes((item.status||"").toLowerCase()) ? "Active" : "Inactive",
        identifier: safeStr(item.identifier || item.memberIdentifier || item.id),
    };
}
function mapParentEntity(item, i) {
    // Build a clean address from parts, skip empties
    const addressParts = [
        item.address,
        item.city,
        item.state,
        item.country,
        item.pincode,
    ].filter(Boolean);

    // Deduplicate children by societyIdentifier for accurate count
    const children = Array.isArray(item.children) ? item.children : [];
    const uniqueChildIds = new Set(children.map(c => c.societyIdentifier).filter(Boolean));
    const societyCount = uniqueChildIds.size || children.length;

    const committeeMembers = Array.isArray(item.committeeMembers) ? item.committeeMembers : [];

    return {
        // Core identifiers
        id:                        item.parentSocietyId          || i + 1,
        parentSocietyIdentifier:   item.parentSocietyIdentifier  || "",

        // Display fields
        name:                      item.parentSocietyName         || "",
        address:                   item.address                   || "",   // raw street address only
        addressDisplay:            addressParts.join(", "),                // full combined string for display
        city:                      item.city                      || "",
        state:                     item.state                     || "",
        pincode:                   item.pincode                   || "",
        contact:                   item.parentContactNumber       || "",
        email:                     item.email                     || "",
        status:                    "Active",

        // Stats
        societies:                 societyCount,
        totalUnits:                committeeMembers.length,

        // Detail / view modal fields
        managerName:               item.managerName               || "",
        registrationNumber:        item.registrationNumber        || "",
        tanNumber:                 item.tanNumber                 || "",
        panNumber:                 item.panNumber                 || "",
        signatory:                 item.signatory                 || "",
        hsnCode:                   item.hsnCode                   || "",
        gstin:                     item.gstin                     || "",
        societyBankName:           item.societyBankName           || "",
        accountNumber:             item.accountNumber             || "",
        branchName:                item.branchName                || "",
        ifscCode:                  item.ifscCode                  || "",
        chequeFavourable:          item.chequeFavourable          || "",
        billingFrequency:          item.billingFrequency          || "",
        annualRateOfInterest:      item.annualRateOfInterest      || "",
        interestCalculationType:   item.interestCalculationType   || "",
        interestCalculationStartDate: item.interestCalculationStartDate || "",
        societyPaymentQrCode:      item.societyPaymentQrCode      || "",

        // Raw nested arrays (for expanded views)
        children:                  children,
        committeeMembers:          committeeMembers,
    };
}


// 
function mapVendor(item, i) {
    return {
        id: item.vendorIdentifier || i + 1,
        vendorIdentifier: item.vendorIdentifier || "-",
        vendorName: item.vendorName || "-",
        vendorAddress: item.vendorAddress || "-",
        gstin: item.gstin || "-",
        aadharNumber: item.aadharNumber || "-",
        pan: item.pan || "-",
        complaintCategoryId: item.complaintCategoryId || "-",
        serviceType: item.serviceType || "-",
        frequency: item.frequency || "-",
        contractStartDate: item.contractStartDate || "-",
        contractEndDate: item.contractEndDate || "-",
        totalPeriodCalculation: item.totalPeriodCalculation || "-",
        contactPersonName: item.contactPersonName || "-",
        contactPersonNumber: item.contactPersonNumber || "-",
        contactValue: item.contactValue || "-",
        bankName: item.bankName || "-",
        branchName: item.branchName || "-",
        ifsc: item.ifsc || "-",
        accountNumber: item.accountNumber || "-",
        complaintCategory: item.complaintCategory || {},
        categoryName: item.complaintCategory?.name || "-",
    };
}

// ── Payment status helper ────────────────────────────────────────────────────
function mapReceiptStatus(raw) {
    const s = (raw || "").toLowerCase();
    if (["confirmed","success","paid","completed","cleared","verified"].includes(s)) return "Confirmed";
    if (["failed","failure","rejected","bounced","cancelled"].includes(s))           return "Failed";
    return "Pending";
}

// ── Anonymous Receipt (Expenses tab) — POST /anonymous-receipt/society/:id ──
// Backend fields: id, receiptDate, description, amount, societyIdentifier, category, vendor
function mapAnonymousReceipt(item, i) {
    return {
        id:          item.id                                     || i + 1,
        receiptId:   safeStr(item.receiptId || item.anonymousReceiptId) || `ANR-${String(i+1).padStart(3,"0")}`,
        description: safeStr(item.description || item.title),
        amount:      Number(item.amount || 0),
        mode:        safeStr(item.paymentMode || item.mode)      || "Cash",
        date:        safeStr(item.receiptDate || item.createdAt),
        society:     safeStr(item.societyIdentifier),
        status:      mapReceiptStatus(item.status                || ""),
        category:    safeStr(item.category),
        vendor:      safeStr(item.vendor),
        receivedFrom:safeStr(item.receivedFrom),
        receivedBy:  safeStr(item.receivedBy),
        txnId:       safeStr(item.transactionId || item.txnId),
    };
}

// ── Receipt mapper — POST /payment/receipt/all?society_identifier=x ─────────
// Backend fields: receiptNumber, invoiceNumber, amountInFigures, propertyIdentifier,
// paymentMode, transactionId, receiptDate, status, mobile, bankName, chequeNumber
function mapReceipt(item, i) {
    return {
        id:                 item.id                                          || i + 1,
        receiptId:          safeStr(item.receiptNumber)                      || `RCP-${String(i+1).padStart(3,"0")}`,
        invoiceRef:         safeStr(item.invoiceNumber),
        amount:             Number(item.amountInFigures || item.amount       || 0),
        mode:               safeStr(item.paymentMode)                        || "UPI",
        txnId:              safeStr(item.transactionId),
        date:               safeStr(item.receiptDate    || item.createdAt),
        status:             mapReceiptStatus(item.status                     || ""),
        propertyIdentifier: safeStr(item.propertyIdentifier),
        property:           safeStr(item.propertyIdentifier                  || item.flatNo),
        mobile:             safeStr(item.mobile),
        bankName:           safeStr(item.bankName),
        chequeNo:           safeStr(item.chequeNumber),
        societyIdentifier:  safeStr(item.societyIdentifier),
        resident:           safeStr(item.ownerName      || item.memberName),
    };
}

// ── Payment-log mapper — POST /payment/payment-log/all?society_identifier=x ─
// Backend fields: transactionId, invoiceNumber, amountInFigures, propertyIdentifier,
// paymentMode (Cheque/Cash), receiptDate, status, bankName, chequeNumber, mobile
function mapPaymentLog(item, i) {
    const mode = safeStr(item.paymentMode || item.type || "");
    const type = mode.toLowerCase().includes("cheque") ? "Cheque" : "Cash";
    const statusRaw = (item.status || "").toLowerCase();
    const status = statusRaw === "deposited" ? "Deposited"
                 : ["cleared","paid","confirmed","success"].includes(statusRaw) ? "Cleared"
                 : ["bounced","failed","rejected"].includes(statusRaw) ? "Bounced"
                 : "Pending";
    return {
        id:          item.id                                 || i + 1,
        logId:       safeStr(item.transactionId)             || `CC-${String(i+1).padStart(3,"0")}`,
        type,
        invoiceRef:  safeStr(item.invoiceNumber),
        amount:      Number(item.amountInFigures || item.amount || 0),
        date:        safeStr(item.receiptDate    || item.createdAt),
        status,
        propertyIdentifier: safeStr(item.propertyIdentifier),
        property:    safeStr(item.propertyIdentifier || item.flatNo),
        mobile:      safeStr(item.mobile),
        bankName:    safeStr(item.bankName),
        chequeNo:    safeStr(item.chequeNumber),
        description: safeStr(item.description    || item.narration),
        receivedBy:  safeStr(item.receivedBy),
        societyIdentifier: safeStr(item.societyIdentifier),
    };
}
// ─ Online self-payment mapper — POST /payment/online-self/all?society_identifier=x ─
// Backend fields: transactionId, invoiceNumber, amountInFigures, propertyIdentifier,
// paymentMode, dateOfPayment, status, bankName, onlineSelfStatus, paymentFile
function mapOnlineSelf(item, i) {
    return {
        id:          item.id                                     || i + 1,
        txnId:       safeStr(item.transactionId)                 || `TXN-${String(i+1).padStart(4,"0")}`,
        invoiceRef:  safeStr(item.invoiceNumber),
        amount:      Number(item.amountInFigures || item.amount  || 0),
        mode:        safeStr(item.paymentMode)                   || "UPI",
        date:        safeStr(item.dateOfPayment  || item.createdAt),
        status:      mapReceiptStatus(item.onlineSelfStatus || item.status || ""),
        propertyIdentifier: safeStr(item.propertyIdentifier),
        property:    safeStr(item.propertyIdentifier || item.flatNo),
        bankName:    safeStr(item.bankName),
        remarks:     safeStr(item.remarks),
        paymentFile: safeStr(item.paymentFile),
        resident:    safeStr(item.ownerName  || item.memberName),
        societyIdentifier: safeStr(item.societyIdentifier),
        // gateway field for OnlineSelfTab UI
        gateway:     safeStr(item.paymentMode || "Online"),
        txnRef:      safeStr(item.transactionId),
    };
}
function mapTermsCondition(item, i) {
    return {
        id: item.termConditionId || item.id || item._id || i + 1,
        termConditionId: item.termConditionId || item.identifier
            || `TC-${String(i + 1).padStart(3, "0")}`,
        societyIdentifier: safeStr(item.societyIdentifier
            || item.society?.societyIdentifier || ""),
        societyName: safeStr(item.society?.societyName
            || item.societyName || item.society || ""),
        applicationType: safeStr(item.applicationType
            || item.application_type || item.type || "General"),
        termCondition: safeStr(item.termCondition
            || item.term_condition || item.content
            || item.description || ""),
    };
}

function mapLedger(item, i) {
    return {
        id:                 item.id || i + 1,
        invoiceNumber:      safeStr(item.invoiceNumber || item.invoice_number),
        propertyIdentifier: safeStr(item.propertyIdentifier),
        societyIdentifier:  safeStr(item.societyIdentifier),
        amount:             Number(item.amount || item.amountInFigures || 0),
        balance:            Number(item.balance || 0),
        transactionType:    safeStr(item.transactionType || item.type) || "Credit",
        date:               safeStr(item.date || item.createdAt || item.billDate),
        narration:          safeStr(item.narration || item.description || item.remarks),
        ownerName:          safeStr(item.ownerName || item.memberName),
        status:             safeStr(item.status) || "Unpaid",
    };
}

function mapApplication(item, i) {
    return {
        id:           item.id       || item._id       || i + 1,
        appId:        safeStr(item.appId || item.application_id || item.identifier) || `CP-${String(i+1).padStart(4,"0")}`,
        property:     safeStr(item.property || item.flat_no || item.propertyNumber || item.unit),
        society:      safeStr(item.society  || item.societyName || item.society_name || item.societyIdentifier),
        category:     safeStr(item.category || item.type || item.applicationType || item.application_type),
        status:       safeStr(item.status   || item.applicationStatus) || "Pending",
        parentStatus: safeStr(item.parentStatus || item.parent_status) || "Pending",
        dateTime:     safeStr(item.dateTime || item.date_time || item.createdAt || item.created_at || item.date),
    };
}

// ── Safe array extractor from various API response shapes ────
function extractArray(response) {
    if (!response) return [];
    const d = response?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data))    return d.data;
    if (Array.isArray(d?.results)) return d.results;
    if (Array.isArray(d?.items))   return d.items;
    if (Array.isArray(d?.list))    return d.list;
    if (Array.isArray(d?.records)) return d.records;
    // Some endpoints wrap in a named key — try first array value
    if (d && typeof d === "object") {
        const firstArr = Object.values(d).find(v => Array.isArray(v));
        if (firstArr) return firstArr;
    }
    return [];
}

// ============================================================
// MOCK DATA — Shown until API responds
// ============================================================
const MOCK_ANNOUNCEMENTS = [
    { id: 1, annId: "ANN-001", society: "Green Valley CHS", name: "Water Supply Shutdown", type: "Urgent", startDate: "2024-05-15", validDate: "2024-05-16", content: "Water supply will be shut down from 10 AM to 4 PM for pipeline maintenance.", views: 248 },
    { id: 2, annId: "ANN-002", society: "All Societies", name: "Annual General Meeting", type: "Event", startDate: "2024-05-20", validDate: "2024-05-20", content: "The AGM is scheduled at 6 PM in the community hall.", views: 132 },
    { id: 3, annId: "ANN-003", society: "Blue Ridge Society", name: "Maintenance Fee Reminder", type: "Finance", startDate: "2024-05-01", validDate: "2024-05-10", content: "Reminder to pay your monthly maintenance fee.", views: 89 },
];

const MOCK_NOTICES = [
    { id: 1, noticeId: "NOT-001", society: "Green Valley CHS", title: "AGM Notice – May 2024", type: "Meeting", priority: "Important", date: "2024-05-20", expiry: "2024-05-20", pinned: true, content: "Annual General Meeting on 20th May 2024 at 6:00 PM.", color: "#6c63ff" },
    { id: 2, noticeId: "NOT-002", society: "All Societies", title: "Fire Safety Drill", type: "Safety", priority: "Urgent", date: "2024-05-12", expiry: "2024-05-12", pinned: true, content: "Mandatory fire safety drill on 12th May 2024 at 10:00 AM.", color: "#ff6b6b" },
    { id: 3, noticeId: "NOT-003", society: "Blue Ridge Society", title: "Maintenance Charges Revision", type: "Financial", priority: "Important", date: "2024-06-01", expiry: "2024-06-01", pinned: false, content: "Maintenance charges will be revised from June 2024.", color: "#00d4aa" },
];

const MOCK_INVOICES = [
    { id: 1, invId: "INV-0001", flatNo: "A-101", ownerName: "Ravi Sharma", type: "Maintenance", amount: 4500, dueDate: "2024-05-31", issueDate: "2024-05-01", status: "Paid", society: "Green Valley CHS", description: "Monthly maintenance charges May 2024" },
    { id: 2, invId: "INV-0002", flatNo: "B-202", ownerName: "Priya Singh", type: "Water", amount: 800, dueDate: "2024-05-31", issueDate: "2024-05-01", status: "Unpaid", society: "Blue Ridge Society", description: "Water charges May 2024" },
    { id: 3, invId: "INV-0003", flatNo: "C-301", ownerName: "Mohan Patel", type: "Parking", amount: 1200, dueDate: "2024-04-30", issueDate: "2024-04-01", status: "Overdue", society: "Sunrise Heights", description: "Parking slot charges April 2024" },
    { id: 4, invId: "INV-0004", flatNo: "D-405", ownerName: "Anita Das", type: "Amenity", amount: 2000, dueDate: "2024-05-15", issueDate: "2024-05-01", status: "Paid", society: "Emerald Towers", description: "Clubhouse & gym access May 2024" },
];

const MOCK_COMPLAINTS = [
    { id: 1, compId: "CMP-001", property: "A-101", category: "Electrical", assignTo: "John Kumar", dateTime: "2024-05-10 09:30 AM", status: "Resolved", priority: "High", society: "Green Valley CHS", description: "Frequent power cuts in kitchen area." },
    { id: 2, compId: "CMP-002", property: "B-202", category: "Plumbing", assignTo: "Priya Singh", dateTime: "2024-05-11 11:00 AM", status: "In Progress", priority: "Medium", society: "Blue Ridge Society", description: "Leaking pipe under bathroom sink." },
    { id: 3, compId: "CMP-003", property: "C-301", category: "Security", assignTo: "Ravi Sharma", dateTime: "2024-05-12 02:15 PM", status: "Open", priority: "Critical", society: "Sunrise Heights", description: "CCTV camera not working in corridor." },
];

const MOCK_TENANTS = [
    { id: 1, number: "TEN-001", name: "Arjun Mehta", phone: "9876500011", email: "arjun.mehta@email.com", address: "A-101, Green Valley CHS, Noida", society: "Green Valley CHS", property: "A-101", moveIn: "2023-01-15", moveOut: "2024-01-14", status: "Active" },
    { id: 2, number: "TEN-002", name: "Kavita Reddy", phone: "9876500012", email: "kavita.r@email.com", address: "B-202, Blue Ridge Society, Gurugram", society: "Blue Ridge Society", property: "B-202", moveIn: "2022-06-01", moveOut: "2024-05-31", status: "Active" },
    { id: 3, number: "TEN-003", name: "Suresh Iyengar", phone: "9876500013", email: "suresh.i@email.com", address: "C-301, Sunrise Heights, Pune", society: "Sunrise Heights", property: "C-301", moveIn: "2021-09-10", moveOut: "2023-09-09", status: "Expired" },
];

// const MOCK_LOANS = [
//     { id: 1, loanNumber: "LN-2024-001", property: "A-101", member: "Ramesh Gupta", name: "Home Renovation", type: "Home Improvement", period: "24 months", amount: 250000, emi: 11500, status: "Active", disbursed: "2024-01-15" },
//     { id: 2, loanNumber: "LN-2024-002", property: "B-202", member: "Priya Singh", name: "Emergency Medical", type: "Emergency", period: "12 months", amount: 100000, emi: 9200, status: "Active", disbursed: "2024-02-10" },
//     { id: 3, loanNumber: "LN-2024-003", property: "C-301", member: "Vijay Kumar", name: "Festival Advance", type: "Festival Advance", period: "6 months", amount: 50000, emi: 8800, status: "Closed", disbursed: "2023-10-01" },
// ];

const MOCK_PARKING = [
    { id: 1, parkingNumber: "PK-001", society: "Green Valley CHS", member: "Ramesh Gupta", property: "A-101", nature: "Covered", vehicleType: "Car", registration: "UP32AH4521", status: "Occupied" },
    { id: 2, parkingNumber: "PK-002", society: "Green Valley CHS", member: "Sunita Sharma", property: "A-102", nature: "Covered", vehicleType: "Bike", registration: "UP32BK7890", status: "Occupied" },
    { id: 3, parkingNumber: "PK-003", society: "Blue Ridge Society", member: "—", property: "—", nature: "Open", vehicleType: "—", registration: "—", status: "Available" },
];

const MOCK_HELPERS = [
    { id: 1, helperId: "HLP-001", name: "Manoj Kumar", category: "Plumber", phone: "9876511001", email: "manoj@helpers.com", society: "Green Valley CHS", experience: "8 years", rating: 4.8, jobs: 124, availability: "Available", address: "Near Gate 2, Green Valley" },
    { id: 2, helperId: "HLP-002", name: "Suresh Yadav", category: "Electrician", phone: "9876511002", email: "suresh@helpers.com", society: "Blue Ridge Society", experience: "12 years", rating: 4.6, jobs: 210, availability: "On Duty", address: "Staff Quarters, Block A" },
    { id: 3, helperId: "HLP-003", name: "Geeta Bai", category: "Housekeeping", phone: "9876511004", email: "geeta@helpers.com", society: "Green Valley CHS", experience: "3 years", rating: 4.9, jobs: 320, availability: "On Duty", address: "Tower B, Staff Room" },
];

const MOCK_PETS = [
    { id: 1, petId: "PET-001", ownerName: "Ravi Sharma", flatNo: "A-101", petName: "Bruno", type: "Dog", breed: "Labrador", age: 3, vaccinated: true, status: "Registered", society: "Green Valley CHS", registeredOn: "2024-01-15" },
    { id: 2, petId: "PET-002", ownerName: "Priya Singh", flatNo: "B-202", petName: "Whiskers", type: "Cat", breed: "Persian", age: 2, vaccinated: true, status: "Registered", society: "Blue Ridge Society", registeredOn: "2024-02-10" },
    { id: 3, petId: "PET-003", ownerName: "Mohan Patel", flatNo: "C-301", petName: "Tweety", type: "Bird", breed: "Parakeet", age: 1, vaccinated: false, status: "Pending", society: "Sunrise Heights", registeredOn: "2024-03-05" },
];

const MOCK_VISITORS = [
    { id: 1, visitId: "VIS-001", visitorName: "Amit Verma", hostFlat: "A-101", hostName: "Ravi Sharma", type: "Guest", checkIn: "2024-05-10 10:00 AM", checkOut: "2024-05-10 12:00 PM", purpose: "Family visit", status: "Checked Out", society: "Green Valley CHS" },
    { id: 2, visitId: "VIS-002", visitorName: "Flipkart Delivery", hostFlat: "B-202", hostName: "Priya Singh", type: "Delivery", checkIn: "2024-05-11 02:00 PM", checkOut: "", purpose: "Package delivery", status: "Checked In", society: "Blue Ridge Society" },
    { id: 3, visitId: "VIS-003", visitorName: "AC Repair Tech", hostFlat: "C-301", hostName: "Mohan Patel", type: "Service", checkIn: "", checkOut: "", purpose: "AC servicing", status: "Expected", society: "Sunrise Heights" },
];


const MOCK_SOCIETIES = [
    { id: 1, name: "Green Valley CHS", address: "Sector 12, Noida", units: 120, contact: "9876543210", email: "gv@chs.in", status: "Active", identifier: "GV001" },
    { id: 2, name: "Blue Ridge Society", address: "Block A, Gurugram", units: 200, contact: "9876543211", email: "br@chs.in", status: "Active", identifier: "BR002" },
    { id: 3, name: "Sunrise Heights", address: "Phase 2, Pune", units: 85, contact: "9876543212", email: "sh@chs.in", status: "Active", identifier: "SH003" },
    { id: 4, name: "Palm Grove Residency", address: "Main Road, Mumbai", units: 60, contact: "9876543213", email: "pg@chs.in", status: "Inactive", identifier: "PG004" },
    { id: 5, name: "Emerald Towers", address: "Ring Road, Delhi", units: 150, contact: "9876543214", email: "et@chs.in", status: "Active", identifier: "ET005" },
];
const MOCK_TOWERS = [
    { id: 1, name: "Tower Alpha", floors: 12, units: 48, society: "Green Valley CHS", status: "Active", identifier: "TA001" },
    { id: 2, name: "Tower Beta",  floors: 10, units: 40, society: "Green Valley CHS", status: "Active", identifier: "TB002" },
    { id: 3, name: "Tower Gamma", floors: 15, units: 60, society: "Blue Ridge Society", status: "Inactive", identifier: "TG003" },
    { id: 4, name: "Tower Delta", floors: 8,  units: 32, society: "Sunrise Heights", status: "Active", identifier: "TD004" },
];
const MOCK_WINGS = [
    { id: 1, name: "Wing A", tower: "Tower Alpha", floors: 12, flatsPerFloor: 4, status: "Active", identifier: "WA001" },
    { id: 2, name: "Wing B", tower: "Tower Alpha", floors: 12, flatsPerFloor: 4, status: "Active", identifier: "WB002" },
    { id: 3, name: "Wing C", tower: "Tower Beta",  floors: 10, flatsPerFloor: 4, status: "Active", identifier: "WC003" },
    { id: 4, name: "Wing D", tower: "Tower Gamma", floors: 15, flatsPerFloor: 4, status: "Inactive", identifier: "WD004" },
];
const MOCK_PROPERTIES = [
    { id: 1, unit: "A-101", wing: "Wing A", type: "2BHK", area: "1050 sqft", owner: "Ramesh Gupta", status: "Occupied", identifier: "P001" },
    { id: 2, unit: "A-102", wing: "Wing A", type: "3BHK", area: "1400 sqft", owner: "Sunita Sharma", status: "Occupied", identifier: "P002" },
    { id: 3, unit: "A-201", wing: "Wing A", type: "1BHK", area: "650 sqft",  owner: "—", status: "Vacant", identifier: "P003" },
    { id: 4, unit: "B-101", wing: "Wing B", type: "2BHK", area: "1050 sqft", owner: "Amit Patel", status: "Occupied", identifier: "P004" },
    { id: 5, unit: "B-202", wing: "Wing B", type: "3BHK", area: "1400 sqft", owner: "Priya Singh", status: "Occupied", identifier: "P005" },
    { id: 6, unit: "C-301", wing: "Wing C", type: "2BHK", area: "1050 sqft", owner: "Vijay Kumar", status: "Occupied", identifier: "P006" },
];
const MOCK_MEMBERS = [
    { id: 1, name: "Ramesh Gupta",  unit: "A-101", role: "Owner",  phone: "9876500001", email: "ramesh@email.com", status: "Active" },
    { id: 2, name: "Sunita Sharma", unit: "A-102", role: "Owner",  phone: "9876500002", email: "sunita@email.com", status: "Active" },
    { id: 3, name: "Amit Patel",    unit: "B-101", role: "Tenant", phone: "9876500003", email: "amit@email.com",   status: "Active" },
    { id: 4, name: "Priya Singh",   unit: "B-202", role: "Owner",  phone: "9876500004", email: "priya@email.com",  status: "Active" },
    { id: 5, name: "Vijay Kumar",   unit: "C-301", role: "Owner",  phone: "9876500005", email: "vijay@email.com",  status: "Inactive" },
];
const MOCK_VENDORS = [
    { id: 1, name: "CleanCity Services",  category: "Housekeeping", contact: "9988776601", email: "clean@city.com",   rating: 4.5, status: "Active" },
    { id: 2, name: "ElectroFix Pvt Ltd",  category: "Electrical",   contact: "9988776602", email: "fix@electro.com",  rating: 4.2, status: "Active" },
    { id: 3, name: "AquaPlumb Solutions", category: "Plumbing",     contact: "9988776603", email: "aqua@plumb.com",   rating: 4.0, status: "Active" },
    { id: 4, name: "GreenGuard Security", category: "Security",     contact: "9988776604", email: "gg@security.com",  rating: 4.7, status: "Active" },
    { id: 5, name: "SwiftLift Elevators", category: "Lifts",        contact: "9988776605", email: "swift@lift.com",   rating: 3.8, status: "Inactive" },
];
const MOCK_APPLICATIONS = [
    { id: 1, appId: "CP-0001", property: "A-101", society: "Green Valley CHS", category: "Renovation", status: "Pending",  parentStatus: "Pending",  dateTime: "2024-05-10 10:00 AM" },
    { id: 2, appId: "CP-0002", property: "B-202", society: "Blue Ridge Society", category: "Move-In",  status: "Approved", parentStatus: "Approved", dateTime: "2024-05-11 11:30 AM" },
    { id: 3, appId: "CP-0003", property: "C-301", society: "Sunrise Heights",   category: "Move-Out",  status: "Pending",  parentStatus: "Pending",  dateTime: "2024-05-12 02:00 PM" },
];
const MOCK_OCCASIONS = [
    { occasionId: 1, occasionName: "Marriage",     occasionDescription: "Marriage ceremony or wedding event" },
    { occasionId: 2, occasionName: "Birthday",     occasionDescription: "Birthday celebration" },
    { occasionId: 3, occasionName: "Graduation",   occasionDescription: "Graduation ceremony for academic achievement" },
    { occasionId: 4, occasionName: "Anniversary",  occasionDescription: "Wedding anniversary celebration" },
    { occasionId: 6, occasionName: "Engagement",   occasionDescription: "Engagement ceremony" },
    { occasionId: 7, occasionName: "Housewarming", occasionDescription: "Celebration for new house" },
    { occasionId: 5, occasionName: "Baby Shower",  occasionDescription: "Celebration before the birth of a baby" },
];
const MOCK_ANON_RECEIPTS = [
    { id:1, receiptId:"ANR-001", title:"Water Bill Payment",    category:"Utility",      description:"Monthly water bill",    amount:3200,  vendor:"MCGM",            date:"2024-05-04", status:"Confirmed", approvedBy:"Admin" },
    { id:2, receiptId:"ANR-002", title:"Security Guard Salary", category:"Security",     description:"May salary",            amount:12000, vendor:"SecurePro Agency", date:"2024-05-05", status:"Confirmed", approvedBy:"Admin" },
    { id:3, receiptId:"ANR-003", title:"Lift Maintenance",      category:"Maintenance",  description:"AMC quarterly payment", amount:8500,  vendor:"OtisLift Co.",     date:"2024-05-10", status:"Pending",   approvedBy:"Admin" },
    { id:4, receiptId:"ANR-004", title:"Garden Cleaning",       category:"Housekeeping", description:"Monthly garden work",   amount:2000,  vendor:"GreenThumb",       date:"2024-05-12", status:"Confirmed", approvedBy:"Admin" },
];

// Mock parent entities aligned with actual API shape
const MOCK_PARENT_ENTITIES = [
    {
        id: 1,
        parentSocietyIdentifier: "PS-00001",
        name: "Mohan Nano Estates Pvt Ltd",
        address: "F to K Block, Sector 18, Noida, UP - 201301",
        contact: "9876543210",
        email: "info@mohannano.com",
        status: "Active",
        societies: 5,
        totalUnits: 3,
        managerName: "", registrationNumber: "", tanNumber: "", panNumber: "",
        signatory: "", hsnCode: "", gstin: "", societyBankName: "",
        accountNumber: "", branchName: "", ifscCode: "", chequeFavourable: "",
        billingFrequency: "Monthly", annualRateOfInterest: "",
        interestCalculationType: "", interestCalculationStartDate: "",
        societyPaymentQrCode: "", children: [], committeeMembers: [],
    },
];


// ============================================================
// AppContext
// ============================================================
const AppContext = createContext(null);

export function AppProvider({ children }) {
    // Module states — initial = mock so UI never breaks
    const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
    const [notices,       setNotices]       = useState(MOCK_NOTICES);
    const [invoices,      setInvoices]      = useState(MOCK_INVOICES);
    const [complaints,    setComplaints]    = useState(MOCK_COMPLAINTS);
    const [tenants,       setTenants]       = useState(MOCK_TENANTS);
    const [loans,         setLoans]         = useState([]);
    const [parking,       setParking]       = useState(MOCK_PARKING);
    const [helpers,       setHelpers]       = useState(MOCK_HELPERS);
    const [pets,          setPets]          = useState(MOCK_PETS);
    const [visitors,      setVisitors]      = useState(MOCK_VISITORS);

    const [societies,    setSocieties]    = useState(MOCK_SOCIETIES);
    const [towers,       setTowers]       = useState(MOCK_TOWERS);
    const [wings,        setWings]        = useState(MOCK_WINGS);
    const [properties,   setProperties]   = useState(MOCK_PROPERTIES);
    const [members,      setMembers]      = useState(MOCK_MEMBERS);
    const [vendors,      setVendors]      = useState(MOCK_VENDORS);
    const [applications, setApplications] = useState(MOCK_APPLICATIONS);
const [parentEntities, setParentEntities] = useState(MOCK_PARENT_ENTITIES);
 const [occasions,         setOccasions]         = useState(MOCK_OCCASIONS);
 const [anonymousReceipts, setAnonymousReceipts] = useState(MOCK_ANON_RECEIPTS);
 const [charges,           setCharges]           = useState([]);
 const [committeeMembers, setCommitteeMembers] = useState([]);
 const [termsConditions, setTermsConditions] = useState([]);

    // ── Accounts: fetched per-request, no mock fallback needed ───────────
    const [receipts,    setReceipts]    = useState([]);
    const [paymentLogs, setPaymentLogs] = useState([]);
    const [onlineSelf,  setOnlineSelf]  = useState([]);
    const [ledger,      setLedger]      = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [apiError,  setApiError]  = useState(null);
    const [usingMock, setUsingMock] = useState(true);

    // ── Global Society Filter — persisted across dashboards ─────────────────
    //  null = "All Societies", otherwise { societyIdentifier, societyName }
    const [selectedSociety, setSelectedSociety] = useState(() => {
        try {
            const saved = localStorage.getItem("globalSelectedSociety");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // ── Persist selectedSociety to localStorage whenever it changes ───────────
    useEffect(() => {
        if (selectedSociety) {
            localStorage.setItem("globalSelectedSociety", JSON.stringify(selectedSociety));
        } else {
            localStorage.removeItem("globalSelectedSociety");
        }
    }, [selectedSociety]);

    // ── Helper: apply data only if non-empty array returned ─
    function applyIfData(result, setter, mapper) {
        if (result.status !== "fulfilled") return false;
        const arr = extractArray(result.value);
        if (arr.length > 0) {
            setter(arr.map(mapper));
            return true;
        }
        return false;
    }

    const fetchAllData = useCallback(async () => {
        const sid = getSocietyIdentifier();
        setLoading(true);
        setApiError(null);

        try {
            const results = await Promise.allSettled([
                getAllAnnouncementApi(sid),                        // 0
                getAllNoticeApi(sid),                              // 1
                getAllInvoicesApi({}, sid),                        // 2
                getAllComplaintsApi({ society_identifier: sid }),  // 3
                getAllTenantApi(sid),                              // 4
                getAllLoansApi(sid),                               // 5
                getAllNewParkingApi(sid),                          // 6
                getAllHelpersApi(sid),                             // 7
                getAllPetsApi(sid),                                // 8
                getAllVisitorApi({ society_identifier: sid }),     // 9
                getAllSocietyApi(),                                // 10 — no filter: fetch ALL societies for dropdown
                getAllTowerApi(sid),                               // 11
                getAllWingApi(sid),                                // 12
                getAllPropertyApi(null, sid),                      // 13
                getSocietyMembersApi(sid),                        // 14
                getAllVendorApi(),                                 // 15
                getAllApplicationApi(sid),                         // 16
                getAllParentEntityApi(),                           // 17
                getAllOccasionsApi(sid),                           // 18
                getAllChargeMasterApi(sid),                           // 19
                getAllAnonymousReceiptsApi(sid),                    // 20
                getAllReceiptsApi(sid, {}),                         // 21
                getAllPaymentLogsApi(sid, {}),                      // 22
                getAllOnlineSelfPaymentApi(sid, {}),                // 23
                getAllLedgersOfPropertyApi({ societyIdentifier: sid }),                          // 24
                getAllCommiteeMembersApi(),                          // 25
                getAllTermsConditionApi(),                           // 26
            ]);

            let successCount = 0;
            if (applyIfData(results[0],  setAnnouncements,  mapAnnouncement))  successCount++;
            if (applyIfData(results[1],  setNotices,        mapNotice))        successCount++;
            if (applyIfData(results[2],  setInvoices,       mapInvoice))       successCount++;
            if (applyIfData(results[3],  setComplaints,     mapComplaint))     successCount++;
            if (applyIfData(results[4],  setTenants,        mapTenant))        successCount++;
            if (applyIfData(results[5],  setLoans,          mapLoan))          successCount++;
            if (applyIfData(results[6],  setParking,        mapParking))       successCount++;
            if (applyIfData(results[7],  setHelpers,        mapHelper))        successCount++;
            if (applyIfData(results[8],  setPets,           mapPet))           successCount++;
            if (applyIfData(results[9],  setVisitors,       mapVisitor))       successCount++;
            if (applyIfData(results[10], setSocieties,      mapSociety))       successCount++;
            if (applyIfData(results[11], setTowers,         mapTower))         successCount++;
            if (applyIfData(results[12], setWings,          mapWing))          successCount++;
            if (applyIfData(results[13], setProperties,     mapProperty))      successCount++;
            if (applyIfData(results[14], setMembers,        mapMember))        successCount++;
            if (applyIfData(results[15], setVendors,        mapVendor))        successCount++;
            if (applyIfData(results[16], setApplications,   mapApplication))   successCount++;
            if (applyIfData(results[17], setParentEntities, mapParentEntity))  successCount++;
            if (applyIfData(results[18], setOccasions,      mapOccasion))      successCount++;
            if (applyIfData(results[19], setCharges,        mapCharge))        successCount++;
            if (applyIfData(results[20], setAnonymousReceipts, mapAnonymousReceipt)) successCount++;
            if (applyIfData(results[21], setReceipts,         mapReceipt))          successCount++;
            if (applyIfData(results[22], setPaymentLogs,      mapPaymentLog))       successCount++;
            if (applyIfData(results[23], setOnlineSelf,       mapOnlineSelf))       successCount++;
            if (applyIfData(results[24], setLedger,           mapLedger))           successCount++;
            if (applyIfData(results[25], setCommitteeMembers, mapCommitteeMember)) successCount++;
            if (applyIfData(results[26], setTermsConditions,  mapTermsCondition))  successCount++;
            setUsingMock(successCount === 0);
        } catch (err) {
            console.warn("[AppContext] Fetch failed, using mock data:", err?.message);
            setApiError(err?.message || "API connection failed");
            setUsingMock(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    return (
        <AppContext.Provider value={{
            // All module data
            announcements, setAnnouncements,
            notices,       setNotices,
            invoices,      setInvoices,
            complaints,    setComplaints,
            tenants,       setTenants,
            loans,         setLoans,
            parking,       setParking,
            helpers,       setHelpers,
            pets,          setPets,
            visitors,      setVisitors,
            societies,     setSocieties,
            towers,        setTowers,
            wings,         setWings,
            properties,    setProperties,
            members,       setMembers,
            vendors,       setVendors,
            applications,  setApplications,
            parentEntities, setParentEntities,
            occasions,     setOccasions,
            charges,       setCharges,
            anonymousReceipts, setAnonymousReceipts,
            committeeMembers,  setCommitteeMembers,
            termsConditions,   setTermsConditions,
            // Accounts
            receipts,    setReceipts,
            paymentLogs, setPaymentLogs,
            onlineSelf,  setOnlineSelf,
            ledger,      setLedger,
            // Meta
            loading,
            apiError,
            usingMock,
            refetch: fetchAllData,
            societyId: getSocietyIdentifier,
            // Global society filter
            selectedSociety, setSelectedSociety,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used within AppProvider");
    return ctx;
}