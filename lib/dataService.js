"use client";
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
  updateDoc
} from "firebase/firestore";

export const dataService = {
  // Pets
  savePet: async (userId, petData) => {
    try {
      const docRef = await addDoc(collection(db, "pets"), {
        ...petData,
        userId,
        createdAt: serverTimestamp()
      });
      return { ...petData, id: docRef.id };
    } catch (error) {
      console.error("Error saving pet:", error);
      throw error;
    }
  },

  updatePetStatus: async (petId, status, lostInfo = null) => {
    try {
      const petRef = doc(db, "pets", petId);
      await updateDoc(petRef, { 
        status, 
        lostInfo: lostInfo ? { ...lostInfo, date: lostInfo.date } : null 
      });
      return true;
    } catch (error) {
      console.error("Error updating pet status:", error);
      return false;
    }
  },

  getUserPets: async (userId) => {
    try {
      const q = query(collection(db, "pets"), where("userId", "==", userId));
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
      console.error("Error fetching user pets:", error);
      return [];
    }
  },

  getAllLostPets: async () => {
    try {
      const q = query(collection(db, "pets"), where("status", "==", "lost"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching lost pets:", error);
      return [];
    }
  },

  // Spotted Reports
  saveSpottedReport: async (userId, reportData) => {
    try {
      const docRef = await addDoc(collection(db, "spottedPets"), {
        ...reportData,
        userId,
        createdAt: serverTimestamp()
      });
      return { ...reportData, id: docRef.id };
    } catch (error) {
      console.error("Error saving spotted report:", error);
      throw error;
    }
  },

  // Notifications
  getNotifications: async (userId) => {
    try {
      // Optimizamos para Firestore: asumiendo que guardamos el ownerId
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
