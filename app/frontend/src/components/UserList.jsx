// /components/UserList.jsx
import React from "react";
import { useUsers } from "@/hooks/useUsers";

export default function UserList() {
  const { data, loading, error, refresh } = useUsers();

  if (loading) return <div>Carregando usuários...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  if (!data?.length) return <div>Nenhum usuário encontrado</div>;

  return (
    <div>
      <button onClick={refresh}>Atualizar</button>
      <ul>
        {data.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}