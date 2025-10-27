/**
 * Hook genérico para ler uma coleção do Firestore em tempo real.
 * Mantém sincronização com Zustand.
 */
import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../services/firebase";

export const useFirestoreStore = create((set) => ({
  data: [],
  loading: true,
  error: null,
  setData: (d) => set({ data: d, loading: false }),
  setError: (e) => set({ error: e, loading: false }),
}));

export const useFirestoreCollection = (collectionName) => {
  const { setData, setError } = useFirestoreStore();

  useEffect(() => {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setData(docs);
      },
      (err) => setError(err.message)
    );

    return () => unsubscribe();
  }, [collectionName, setData, setError]);
};
