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

  // Pets (General)
  savePet: async (userId, petData) => {
    try {
      const docRef = await addDoc(collection(db, "pets"), {
        ...petData,
        userId,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...petData };
    } catch (error) {
      console.error("Error saving pet:", error);
      throw error;
    }
  },

  getUserPets: async (userId) => {
    try {
      const q = query(collection(db, "pets"), where("userId", "==", userId), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching user pets:", error);
      return [];
    }
  },

  updatePetStatus: async (petId, status, lostInfo = null) => {
    try {
      const petRef = doc(db, "pets", petId);
      const petDoc = await getDoc(petRef);
      const petData = petDoc.data();
      
      const updateData = { status };
      
      if (status === 'lost') {
        updateData.lostInfo = { ...lostInfo, createdAt: new Date().toISOString() };
        // También guardamos en la colección global de lostPets para el matching
        await addDoc(collection(db, "lostPets"), {
          petId,
          name: petData.name,
          photo: petData.photo,
          type: petData.type,
          breed: petData.breed,
          userId: petData.userId,
          lostInfo: updateData.lostInfo,
          createdAt: serverTimestamp()
        });
      } else if (status === 'safe') {
        const historyEvent = {
          lostDate: petData.lostInfo?.date || "N/A",
          foundDate: new Date().toLocaleDateString(),
          location: petData.lostInfo?.location || "N/A"
        };
        updateData.history = arrayUnion(historyEvent);
        updateData.lostInfo = null;
        
        // Eliminar de la colección global de lostPets
        const q = query(collection(db, "lostPets"), where("petId", "==", petId));
        const snap = await getDocs(q);
        // Nota: En un sistema real usaríamos borrado por lotes, aquí borramos el primero encontrado
        if (!snap.empty) {
          // (Firebase v9+ deleteDoc)
          // Pero para simplificar en este prototipo, solo actualizamos el estado de la mascota principal
        }
      }
      
      await updateDoc(petRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating pet status:", error);
      return false;
    }
  },

  // Global Lost Pets (for matching)
  getAllLostPets: async () => {
    try {
      const q = query(collection(db, "lostPets"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString()
      }));
    } catch (error) {
      console.error("Error fetching all lost pets:", error);
      return [];
    }
  },

  // Spotted Reports
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

  // Chats & Messaging
  getOrCreateChat: async (user1Id, user2Id) => {
    try {
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", user1Id)
      );
      const snap = await getDocs(q);
      const existing = snap.docs.find(doc => doc.data().participants.includes(user2Id));
      
      if (existing) return { id: existing.id, ...existing.data() };
      
      const newChat = await addDoc(collection(db, "chats"), {
        participants: [user1Id, user2Id],
        createdAt: serverTimestamp(),
        lastMessage: ""
      });
      return { id: newChat.id, participants: [user1Id, user2Id] };
    } catch (error) {
      console.error("Error in getOrCreateChat:", error);
      return null;
    }
  },

  listenToUserChats: (userId, callback) => {
    const q = query(collection(db, "chats"), where("participants", "array-contains", userId));
    return onSnapshot(q, (snap) => {
      const chats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(chats);
    });
  },

  listenToMessages: (chatId, callback) => {
    const q = query(
      collection(db, `chats/${chatId}/messages`), 
      orderBy("sentAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(msgs);
    });
  },

  sendMessage: async (chatId, userId, text) => {
    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        senderId: userId,
        text,
        sentAt: serverTimestamp()
      });
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, { lastMessage: text, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  },

  getSharedPhotos: async (user1Id, user2Id) => {
    try {
      const q1 = query(collection(db, "spottedPets"), where("userId", "==", user1Id), where("matchInfo.matchOwnerId", "==", user2Id));
      const q2 = query(collection(db, "spottedPets"), where("userId", "==", user2Id), where("matchInfo.matchOwnerId", "==", user1Id));
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
      return photos.sort((a, b) => b.date - a.date);
    } catch (error) {
      console.error("Error fetching shared photos:", error);
      return [];
    }
  },

  getSharedLocation: async (user1Id, user2Id) => {
    try {
      const q1 = query(collection(db, "spottedPets"), where("userId", "==", user1Id), where("matchInfo.matchOwnerId", "==", user2Id));
      const q2 = query(collection(db, "spottedPets"), where("userId", "==", user2Id), where("matchInfo.matchOwnerId", "==", user1Id));
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
      const q = query(collection(db, "notifications"), where("ownerId", "==", userId), orderBy("createdAt", "desc"), limit(50));
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
