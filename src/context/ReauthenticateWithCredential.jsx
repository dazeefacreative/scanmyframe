import { getAuth, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";

const auth = getAuth();
const user = auth.currentUser; // your logged-in user

const credential = EmailAuthProvider.credential(user.email, password);

reauthenticateWithCredential(user, credential)
  .then(async () => {
    // Password correct, now delete Firebase user
    await deleteUser(user);

    // Then call your backend to delete from DB
    const res = await fetch('/delete_account', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid }),
    });

    const data = await res.json();
    if (data.success) {
      console.log("Account deleted completely");
    }
  })
  .catch((error) => {
    console.error("Password incorrect or deletion failed:", error);
  });