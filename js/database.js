// js/database.js
import { db } from './firebase.js';
import { collection, query, where, getDocs, Timestamp, addDoc, updateDoc, doc, writeBatch, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showNotification } from './utils.js';
// CORRECTED IMPORT: Changed 'showUserDashboard' to 'renderUserDashboard'
import { renderUserDashboard, renderAuthorizedUsersList, renderAllowedLocationsList } from './render.js';
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- GEO-FENCED ACCESS LOGIC ---

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth’s radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};

export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Geolocation not supported"));
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            }),
            (error) => reject(new Error("Location permission denied or unavailable.")),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
        );
    });
};

export const validateUserID = async (db, userID) => {
    const q = query(collection(db, "authorizedUsers"), where("userId", "==", userID), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
};

const getAllowedLocations = async (db) => {
    const q = query(collection(db, "allowedLocations"), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const checkLocationAccess = async (userLocation, allowedLocations) => {
    for (const location of allowedLocations) {
        const distance = calculateDistance(userLocation.latitude, userLocation.longitude, location.latitude, location.longitude);
        if (distance <= location.radiusMeters) {
            return { allowed: true, locationName: location.name, distance: Math.round(distance) };
        }
    }
    return { allowed: false, reason: "You are not within an authorized location" };
};

const logAccessAttempt = async (db, userID, accessGranted, reason, locationData = {}) => {
    await addDoc(collection(db, "accessLogs"), {
        userId: userID,
        accessGranted,
        reason,
        locationName: locationData.locationName || null,
        timestamp: Timestamp.now(),
        userAgent: navigator.userAgent
    });
};

const updateLastUsed = async (db, authorizedUserId) => {
    await updateDoc(doc(db, "authorizedUsers", authorizedUserId), { lastUsed: Timestamp.now() });
};

export const handleSecureUserLogin = async (enteredUserID) => {
    const locationStatus = document.getElementById('location-status');
    const locationHelp = document.getElementById('location-help');

    try {
        if (locationHelp) locationHelp.classList.remove('hidden');
        showNotification("Validating User ID...", "info");
        const authorizedUser = await validateUserID(db, enteredUserID);
        if (!authorizedUser) {
            await logAccessAttempt(db, enteredUserID, false, "Invalid User ID");
            throw new Error("Invalid User ID. Please check and try again.");
        }

        if (locationStatus) locationStatus.classList.remove('hidden');
        showNotification("Checking your location...", "info");
        const userLocation = await getCurrentLocation();
        
        const allowedLocations = await getAllowedLocations(db);
        if (allowedLocations.length === 0) {
            await logAccessAttempt(db, enteredUserID, false, "No allowed locations configured", { userLocation });
            throw new Error("System configuration error. Please contact administrator.");
        }
        
        const locationCheck = await checkLocationAccess(userLocation, allowedLocations);
        if (!locationCheck.allowed) {
            await logAccessAttempt(db, enteredUserID, false, locationCheck.reason, { userLocation });
            throw new Error(locationCheck.reason);
        }

        await logAccessAttempt(db, enteredUserID, true, `Access granted from ${locationCheck.locationName}`, { userLocation, locationName: locationCheck.locationName });
        await updateLastUsed(db, authorizedUser.id);
        
        const auth = getAuth();
        if (!auth.currentUser || auth.currentUser.isAnonymous === false) {
             await signInAnonymously(auth);
        }
        
        sessionStorage.setItem('isDashboardLogin', 'true');
        sessionStorage.setItem('currentUserID', enteredUserID);
        sessionStorage.setItem('accessLocation', locationCheck.locationName);
        showNotification(`Welcome! Access granted from ${locationCheck.locationName}`, "success");
        
        // CORRECTED FUNCTION CALL
        renderUserDashboard(auth.currentUser);
        
    } catch (error) {
        console.error("Secure login error:", error);
        showNotification(error.message, "error");
        if (locationStatus) locationStatus.classList.add('hidden');
        if (locationHelp) locationHelp.classList.add('hidden');
    }
};

export const addLocation = async (db, data) => {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    const radius = parseInt(data.radiusMeters);
    if (!data.locationName || isNaN(lat) || isNaN(lng) || isNaN(radius) || radius < 10) {
        throw new Error("Please fill all fields with valid values.");
    }
    await addDoc(collection(db, "allowedLocations"), {
        name: data.locationName, latitude: lat, longitude: lng, radiusMeters: radius,
        isActive: true, createdAt: Timestamp.now()
    });
};


// --- DATABASE MANAGEMENT ---

export const findCurrentVehicleStatus = async (db, vehicleNumber) => {
    const now = new Date();
    try {
        const clearanceQuery = query(collection(db, "vehicleClearances"), where("vehicleNumber", "==", vehicleNumber));
        const clearanceSnap = await getDocs(clearanceQuery);
        const allClearances = clearanceSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        const activeClearance = allClearances.find(c => {
            const expiry = c.expiryDate.toDate();
            expiry.setHours(23, 59, 59, 999);
            return expiry >= now;
        });
        if (activeClearance) return { ...activeClearance, status: "active" };

        const requestQuery = query(collection(db, "clearanceRequests"), where("vehicleNumber", "==", vehicleNumber), orderBy("createdAt", "desc"));
        const requestSnap = await getDocs(requestQuery);
        const allRequests = requestSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentRequest = allRequests.find(r => r.status !== 'rejected' || r.createdAt.toDate() >= sevenDaysAgo);
        if (recentRequest) return recentRequest;
        
        if (allClearances.length > 0) return { ...allClearances[0], status: "expired" };

        return null;
    } catch (error) {
        console.error("Error in tracking:", error);
        throw error;
    }
};

export const performSecureLogout = async (signOut, auth) => {
    try {
        const currentUserID = sessionStorage.getItem('currentUserID');
        if (currentUserID) {
            await logAccessAttempt(db, currentUserID, true, "User logged out");
        }
        await signOut(auth);
        sessionStorage.clear();
        showNotification("Logged out successfully");
    } catch (error) {
        console.error("Logout error:", error);
        sessionStorage.clear(); // Ensure cleanup even on error
    }
};

export const clearAllDatabaseData = async (button, db) => {
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<div class="spinner w-4 h-4"></div> Wiping...';
    try {
        const collectionsToWipe = ['vehicleClearances', 'clearanceRequests'];
        for (const collectionName of collectionsToWipe) {
            const snapshot = await getDocs(collection(db, collectionName));
            if (snapshot.size > 0) {
                const batch = writeBatch(db);
                snapshot.docs.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }
        }
        showNotification(`Cleanup complete!`, "success");
        updateDatabaseStats(db);
    } catch (error) {
        showNotification(`Error clearing database: ${error.message}`, "error");
    } finally {
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
};

export const resetToDefaultState = async (button, db) => {
    // Similar to clearAllDatabaseData, for now
    await clearAllDatabaseData(button, db);
};


export const exportDatabaseData = async (button, db) => {
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<div class="spinner w-4 h-4"></div> Exporting...';
    try {
        const exportData = { exportDate: new Date().toISOString(), collections: {} };
        const collectionsToExport = ['vehicleClearances', 'clearanceRequests', 'vvips', 'admins', 'publicConfig', 'authorizedUsers', 'allowedLocations', 'accessLogs'];
        for (const collectionName of collectionsToExport) {
            const snapshot = await getDocs(collection(db, collectionName));
            exportData.collections[collectionName] = snapshot.docs.map(doc => {
                 const data = doc.data();
                 Object.keys(data).forEach(key => { if (data[key]?.toDate) data[key] = data[key].toDate().toISOString(); });
                 return { id: doc.id, ...data };
            });
        }
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
        showNotification("Database exported successfully!", "success");
    } catch (error) {
        showNotification(`Export failed: ${error.message}`, "error");
    } finally {
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
};

export const updateDatabaseStats = async (db) => {
    const statsContainer = document.getElementById('db-stats');
    if (!statsContainer) return;
    statsContainer.innerHTML = 'Loading...';
    try {
        const collectionsToCount = ['vehicleClearances', 'clearanceRequests', 'vvips', 'admins', 'authorizedUsers', 'allowedLocations'];
        const statsPromises = collectionsToCount.map(name => getDocs(collection(db, name)).then(snap => ({ name, size: snap.size })));
        const statsResults = await Promise.all(statsPromises);
        const stats = statsResults.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.size }), {});
        statsContainer.innerHTML = `
            <div>Active Clearances: <strong class="text-blue-500">${stats.vehicleClearances}</strong></div>
            <div>Pending Requests: <strong class="text-yellow-500">${stats.clearanceRequests}</strong></div>
            <div>VVIPs: <strong class="text-indigo-500">${stats.vvips}</strong></div>
            <div>Admins: <strong class="text-green-500">${stats.admins}</strong></div>
            <div>Users: <strong class="text-blue-500">${stats.authorizedUsers}</strong></div>
            <div>Locations: <strong class="text-green-500">${stats.allowedLocations}</strong></div>
        `;
    } catch (error) {
        statsContainer.innerHTML = 'Error loading stats.';
    }
};

export const toggleDocStatus = async (id, collectionName, currentStatus, docName, renderCallback) => {
    try {
        await updateDoc(doc(db, collectionName, id), { isActive: !currentStatus });
        showNotification(`${docName} ${!currentStatus ? 'activated' : 'deactivated'}`);
        renderCallback(db);
    } catch (error) {
        showNotification(`Failed to update ${docName} status`, "error");
    }
};

export const deleteDocById = async (id, collectionName, docName, renderCallback) => {
    try {
        await deleteDoc(doc(db, collectionName, id));
        showNotification(`${docName} removed successfully`);
        renderCallback(db);
    } catch (error) {
        showNotification(`Failed to delete ${docName}`, "error");
    }
};
