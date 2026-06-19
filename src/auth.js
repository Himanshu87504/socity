// ============================================================
//  USER ACCOUNTS & ACCESS CONTROL
// ============================================================

import { adminLoginApi } from './api/authentication-api';

// ── Build a user object from an API response ─────────────────
function buildUserFromApiResponse(apiData, username) {
    // Actual API shape: { status, message, accessToken, refreshToken, permissoin[] }
    // Also handles: { user, admin, data, accessToken, ... }
    const raw = apiData?.data || apiData;
    const userData = raw?.user || raw?.admin || raw?.data || raw;

    const name = userData?.name || userData?.fullName || userData?.full_name || userData?.userName || username;
    const role = userData?.role || userData?.userRole || userData?.designation || 'Admin';
    const avatar = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'AD';

    // Store tokens in localStorage for axiosInstance to use
    const accessToken = raw?.accessToken || raw?.token || raw?.access_token || userData?.token;
    const refreshToken = raw?.refreshToken || raw?.refresh_token;

    // Extract societyIdentifier — check permissoin array (API typo) and all common fields
    const permissoinArr = raw?.permissoin || raw?.permission || raw?.permissions || [];
    const societyFromPerm = Array.isArray(permissoinArr) && permissoinArr.length > 0
        ? (permissoinArr[0]?.societyIdentifier || permissoinArr[0]?.society_identifier
           || permissoinArr[0]?.societyId || permissoinArr[0]?.identifier || '')
        : '';

    const societyIdentifier = societyFromPerm
        || userData?.societyIdentifier
        || userData?.society_identifier
        || userData?.societyId
        || raw?.societyIdentifier
        || '';

    if (accessToken) {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    }
    if (societyIdentifier) {
        localStorage.setItem('society_identifier', societyIdentifier);
        localStorage.setItem('societyId', societyIdentifier);
    }

    // Store full user data for components
    localStorage.setItem('currentUser', JSON.stringify({
        id: userData?.id || userData?._id || username,
        name,
        role,
        avatar,
        username,
        societyIdentifier,
    }));

    return {
        id: userData?.id || userData?._id || username,
        username,
        name,
        role,
        avatar,
        avatarColor: '#00d4aa',
        access: '*', // API-authenticated admin gets full access
        societyIdentifier,
    };
}

// ── Authenticate: API only — no static fallback users ────────
export async function authenticate(username, password) {
    try {
        const response = await adminLoginApi({ userName: username, password });
        if (response?.status === 200 || response?.status === 201) {
            return buildUserFromApiResponse(response.data, username);
        }
        return null;
    } catch (apiError) {
        console.warn('[auth] Login failed:', apiError?.message);
        return null;
    }
}

export function canAccess(user, section) {
    if (!user) return false;
    if (user.access === '*') return true;
    return user.access.includes(section);
}
