"use client";

const getStorage = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const setStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const dataService = {
  // Pets
  savePet: (userId, petData) => {
    const pets = getStorage("pets");
    const newPet = { ...petData, id: Date.now().toString(), userId, createdAt: new Date().toISOString() };
    pets.push(newPet);
    setStorage("pets", pets);
    return newPet;
  },

  getUserPets: (userId) => {
    const pets = getStorage("pets");
    return pets.filter(p => p.userId === userId);
  },

  getAllLostPets: () => {
    const pets = getStorage("pets");
    return pets.filter(p => p.status === 'lost');
  },

  // Spotted Reports
  saveSpottedReport: (userId, reportData) => {
    let reports = getStorage("spottedPets");
    const newReport = { ...reportData, id: Date.now().toString(), userId, createdAt: new Date().toISOString() };
    reports.push(newReport);
    // Keep only last 100 reports
    if (reports.length > 100) reports = reports.slice(-100);
    setStorage("spottedPets", reports);
    return newReport;
  },

  // Notifications
  getNotifications: (userId) => {
    const notifications = getStorage("notifications");
    const userPets = getStorage("pets").filter(p => p.userId === userId).map(p => p.id);
    return notifications.filter(n => userPets.includes(n.ownerPetId)).reverse();
  },

  saveNotification: (notification) => {
    let notifications = getStorage("notifications");
    notifications.push({ ...notification, id: Date.now().toString() + Math.random(), read: false });
    // Keep only last 100 notifications
    if (notifications.length > 100) notifications = notifications.slice(-100);
    setStorage("notifications", notifications);
  }
};
