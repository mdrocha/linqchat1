import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { useNavigate, Link } from "react-router-dom";
import FloatingInput from "@/components/FloatingInput";
import AuthLayout from "@/components/AuthLayout";
import PopupError from "@/components/PopupError";
import PopupSuccess from "@/components/PopupSuccess";
import { api } from "@/services/api";

const Title = styled.h2`
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin-bottom: 28px;
  margin-top: -20px;
`;

const Button = styled.button`
  width: 100%;
  height: 46px;
  border: 0;
  border-radius: 10px;
  background: #5b6bff;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  margin-top: 8px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #4a55d4;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinkLine = styled.div`
  text-align: center;
  margin-top: 12px;
  font-size: 13px;
`;

export default function Login() {
  const nav = useNavigate();
  const [openError, setOpenError] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const success = sessionStorage.getItem("registerSuccess");
    if (success) {
      setOpenSuccess(true);
      sessionStorage.removeItem("registerSuccess");
    }
  }, []);

  const onChange = (k) => (e) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/login", form, { auth: false });
      nav("/connect-whatsapp");
    } catch (err) {
      setErrorMsg(err?.response?.message || "Credenciais inválidas.");
      setOpenError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout titleRight>
      <form onSubmit={submit} noValidate>
        <Title>ACESSE SUA CONTA</Title>

        <FloatingInput
          id="email"
          type="email"
          label="E-mail *"
          value={form.email}
          onChange={onChange("email")}
          required
        />
        <FloatingInput
          id="password"
          type="password"
          label="Senha *"
          value={form.password}
          onChange={onChange("password")}
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "ENTRAR"}
        </Button>

        <LinkLine>
          Novo por aqui? <Link to="/register">Crie sua conta</Link>
        </LinkLine>
      </form>

      <PopupError
        open={openError}
        message={errorMsg}
        onClose={() => setOpenError(false)}
      />

      <PopupSuccess
        visible={openSuccess}
        message="Cadastro realizado com sucesso"
        onClose={() => setOpenSuccess(false)}
      />
    </AuthLayout>
  );
}