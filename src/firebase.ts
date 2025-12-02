import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🔥 Firebase carregado pelo firebase.ts");

const firebaseConfig = {
  apiKey: "AIzaSyA7SgFJ35FFZ6uLN1776DeRNV6KyUJ2k",
  authDomain: "lucro-facil-28aaf.firebaseapp.com",
  projectId: "lucro-facil-28aaf",
  storageBucket: "lucro-facil-28aaf.appspot.com",
  messagingSenderId: "568743117540",
  appId: "1:568743117540:web:a1bc0e38ee9807207622f1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function testeFirebase() {
  try {
    const docRef = await addDoc(collection(db, "teste"), {
      nome: "Alexandre",
      criadoEm: new Date()
    });
    console.log("🔥 Documento salvo com sucesso:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("❌ Erro ao salvar:", e);
    return null;
  }
}

(window as any).testeFirebase = testeFirebase;
