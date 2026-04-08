import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot
} from "firebase/firestore";

export const dataService = {
  // User Profiles
  syncUserProfile: async (userId, userData) => {
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        ...userData,
        lastLogin: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error syncing user profile:", error);
    }
  },

  getUserProfile: async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  updateUserProfile: async (userId, data) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, data);
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  },

  // Lost Pets
  saveLostPet: async (userId, petData) => {
    try {
      const docRef = await addDoc(collection(db, "lostPets"), {
        ...petData,
        userId,
        status: "lost",
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...petData };
    } catch (error) {
      console.error("Error saving lost pet:", error);
      throw error;
    }
  },

  getAllLostPets: async () => {
    try {
      const q = query(collection(db, "lostPets"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert to string for easier JS handling
        createdAt: doc.data().createdAt?.toDate()?.toISOString()
      }));
    } catch (error) {
      console.error("Error fetching lost pets:", error);
      return [];
    }
  },

  getUserLostPets: async (userId) => {
    try {
      const q = query(
        collection(db, "lostPets"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString()
      }));
    } catch (error) {
      console.error("Error fetching user lost pets:", error);
      return [];
    }
  },

  // Spotted Pets
  saveSpottedReport: async (userId, spottedData) => {
    try {
      const docRef = await addDoc(collection(db, "spottedPets"), {
        ...spottedData,
        userId,
        createdAt: serverTimestamp(),
        analyzed: false
      });
      return { id: docRef.id, ...spottedData };
    } catch (error) {
      console.error("Error saving spotted report:", error);
      throw error;
    }
  },

  getUserSpottedReports: async (userId) => {
    try {
      const q = query(
        collection(db, "spottedPets"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString()
        };
      });
    } catch (error) {
      console.error("Error fetching spotted reports:", error);
      return [];
    }
  },

  updateSpottedReportMatch: async (spottedId, matchInfo) => {
    try {
      const docRef = doc(db, "spottedPets", spottedId);
      await updateDoc(docRef, { matchInfo });
      return true;
    } catch (error) {
      console.error("Error updating spotted report match:", error);
      return false;
    }
  },

  markSpottedReportAnalyzed: async (spottedId) => {
    try {
      const docRef = doc(db, "spottedPets", spottedId);
      await updateDoc(docRef, { analyzed: true });
      return true;
    } catch (error) {
      console.error("Error marking report as analyzed:", error);
      return false;
    }
  },

  getSharedPhotos: async (user1Id, user2Id) => {
    try {
      // Búsqueda 1: user1 reportó la mascota de user2
      const q1 = query(
        collection(db, "spottedPets"), 
        where("userId", "==", user1Id), 
        where("matchInfo.matchOwnerId", "==", user2Id)
      );
      // Búsqueda 2: user2 reportó la mascota de user1
      const q2 = query(
        collection(db, "spottedPets"), 
        where("userId", "==", user2Id), 
        where("matchInfo.matchOwnerId", "==", user1Id)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      const photos = [];
      snap1.forEach(doc => {
        const data = doc.data();
        if (data.photo) photos.push({ id: doc.id, url: data.photo, date: data.createdAt?.toDate() });
      });
      snap2.forEach(doc => {
        const data = doc.data();
        if (data.photo) photos.push({ id: doc.id, url: data.photo, date: data.createdAt?.toDate() });
      });
      
      // Ordenar de más reciente a más antigua
      return photos.sort((a, b) => b.date - a.date);
    } catch (error) {
      console.error("Error fetching shared photos:", error);
      return [];
    }
  },

  getSharedLocation: async (user1Id, user2Id) => {
    try {
      const q1 = query(
        collection(db, "spottedPets"),
        where("userId", "==", user1Id),
        where("matchInfo.matchOwnerId", "==", user2Id)
      );
      const q2 = query(
        collection(db, "spottedPets"),
        where("userId", "==", user2Id),
        where("matchInfo.matchOwnerId", "==", user1Id)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const allDocs = [];
      snap1.forEach(doc => allDocs.push({ ...doc.data(), id: doc.id }));
      snap2.forEach(doc => allDocs.push({ ...doc.data(), id: doc.id }));

      const withCoords = allDocs
        .filter(d => d.coords?.lat && d.coords?.lng)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      return withCoords.length > 0 ? withCoords[0].coords : null;
    } catch (error) {
      console.error("Error fetching shared location:", error);
      return null;
    }
  },

  // Notifications
  getNotifications: async (userId) => {
    try {
      const q = query(
        collection(db, "notifications"), 
        where("ownerId", "==", userId), 
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  },

  saveNotification: async (notification) => {
    try {
      await addDoc(collection(db, "notifications"), {
        ...notification,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const docRef = doc(db, "notifications", notificationId);
      await updateDoc(docRef, { read: true });
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }
};
