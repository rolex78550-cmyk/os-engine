import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import * as fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  console.log("Searching for user with email asartist20@gmail.com...");
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", "asartist20@gmail.com"));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log("No user found with email asartist20@gmail.com");
    // List all users instead
    const allUsersSnap = await getDocs(usersRef);
    console.log("All users in DB:", allUsersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    return;
  }
  
  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();
  console.log("Found User ID:", userId);
  console.log("User Profile Data:", JSON.stringify(userData, null, 2));
  
  console.log("Fetching streak_events for user...");
  const eventsRef = collection(db, "users", userId, "streak_events");
  const eventsSnap = await getDocs(eventsRef);
  
  const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${events.length} streak events`);
  
  // Sort by localDate
  events.sort((a: any, b: any) => (a.localDate || "").localeCompare(b.localDate || ""));
  
  console.log("List of localDates in events:");
  events.forEach((e: any, idx) => {
    console.log(`${idx + 1}: localDate=${e.localDate}, createdAt=${e.createdAt}, label=${e.label}`);
  });
}

run().catch(console.error);
