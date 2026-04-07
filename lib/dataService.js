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
        name: userData.name,
        photo: userData.photo,
        email: userData.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error syncUserProfile:", error);
      return false;
    }
  },

  getUserProfile: async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getUserProfile:", error);
      return null;
    }
  },

  // Chats & Messaging
  getOrCreateChat: async (user1Id, user2Id, petInfo = null) => {
    try {
      const participants = [user1Id, user2Id].sort();
      const q = query(
        collection(db, "chats"),
        where("participants", "==", participants)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }

      // Crear nuevo chat si no existe
      const chatData = {
        participants,
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        petInfo, // Info opcional sobre la mascota que originó el contacto
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "chats"), chatData);
      return { id: docRef.id, ...chatData };
    } catch (error) {
      console.error("Error getOrCreateChat:", error);
      throw error;
    }
  },

  sendMessage: async (chatId, senderId, text) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      const messagesRef = collection(db, "chats", chatId, "messages");
      
      // 1. Guardar el mensaje en la subcolección
      await addDoc(messagesRef, {
        senderId,
        text,
        createdAt: serverTimestamp()
      });
      
      // 2. Actualizar el último mensaje en la cabecera del chat
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error("Error sendMessage:", error);
      return false;
    }
  },

  listenToMessages: (chatId, callback) => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      callback(messages);
    });
  },

  listenToUserChats: (userId, callback) => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageTime", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(chats);
    });
  },

  // Pets
  savePet: async (userId, petData) => {
    try {
      const docRef = await addDoc(collection(db, "pets"), {
        ...petData,
        userId,
        status: 'safe',
        history: [],
        createdAt: serverTimestamp()
      });
      return { ...petData, id: docRef.id, status: 'safe', history: [] };
    } catch (error) {
      console.error("Error saving pet:", error);
      throw error;
    }
  },

  updatePetStatus: async (petId, status, lostInfo = null) => {
    try {
      const petRef = doc(db, "pets", petId);
      
      // Si estamos marcando como encontrada (safe), archivamos el extravío actual
      if (status === 'safe') {
        const petDoc = await getDoc(petRef);
        const currentData = petDoc.data();
        
        if (currentData.status === 'lost' && currentData.lostInfo) {
          const historyEvent = {
            type: 'lost_found',
            lostDate: currentData.lostInfo.date,
            foundDate: new Date().toISOString().split('T')[0],
            location: currentData.lostInfo.location,
            timestamp: new Date().getTime()
          };
          
          await updateDoc(petRef, { 
            status, 
            lostInfo: null,
            history: arrayUnion(historyEvent)
          });
          return true;
        }
      }

      // De lo contrario, guardamos el estado normal (para cuando se pierde)
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
      // Buscamos el reporte donde user1 reportó mascota de user2, o viceversa
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

      // Devolver las coordenadas del reporte más reciente que las tenga
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
