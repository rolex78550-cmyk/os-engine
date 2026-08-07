import admin from "firebase-admin";

admin.initializeApp({
  projectId: "gen-lang-client-0876553272"
});

const db = admin.firestore();

async function run() {
  console.log("Searching for user with email asartist20@gmail.com via Admin SDK...");
  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("email", "==", "asartist20@gmail.com").get();
  
  if (snapshot.empty) {
    console.log("No user found with email asartist20@gmail.com");
    // List some users to check what we have
    const allUsersSnap = await usersRef.limit(5).get();
    console.log("Some users in DB:", allUsersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    return;
  }
  
  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();
  console.log("Found User ID:", userId);
  console.log("User Profile Data:", JSON.stringify(userData, null, 2));
  
  console.log("Fetching streak_events for user...");
  const eventsRef = db.collection("users").doc(userId).collection("streak_events");
  const eventsSnap = await eventsRef.get();
  
  const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${events.length} streak events`);
  
  // Sort by localDate
  events.sort((a: any, b: any) => (a.localDate || "").localeCompare(b.localDate || ""));
  
  console.log("List of localDates in events:");
  events.forEach((e: any, idx) => {
    console.log(`${idx + 1}: id=${e.id} localDate=${e.localDate}, createdAt=${e.createdAt}, label=${e.label}`);
  });
}

run().catch(console.error);
