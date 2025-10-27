import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const auth = admin.auth();

auth
  .listUsers(1)
  .then((res) => {
    console.log("Firebase conectado com sucesso:", res.users.length, "usuário(s) encontrados");
  })
  .catch((err) => {
    console.error("Erro ao conectar no Firebase:", err);
  });
