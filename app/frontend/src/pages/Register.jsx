import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import AuthLayout from "@/components/AuthLayout";
import PopupError from "@/components/PopupError";
import PopupSuccess from "@/components/PopupSuccess";
import { api } from "@/services/api";
import { handleMaskedInput, getPhoneDigits } from "@/utils/phoneMask";
import { useNavigate, Link } from "react-router-dom";
import FloatingInput from "@/components/FloatingInput";

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Select = styled.select`
  width: 100%;
  height: 52px;
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 15px;
  color: #222;
  background: transparent;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;

  &:focus {
    border-color: #0a57ff;
    box-shadow: 0 0 0 3px rgba(10, 87, 255, 0.15);
  }
`;

const SelectWrapper = styled.div`
  position: relative;
  margin-bottom: 20px;

  label {
    position: absolute;
    top: -7px;
    left: 12px;
    font-size: 12px;
    color: #0a57ff;
    background: #fff;
    padding: 0 6px;
  }
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

export default function Register() {
  const nav = useNavigate();
  const [openError, setOpenError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    confirmarEmail: "",
    password: "",
    confirmarSenha: "",
    phone: "",
    whatsapp: "",
    state: "",
    city: "",
    segment: "",
  });

  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const onPhone = (k) => (e) =>
    handleMaskedInput(e, (masked) =>
      setForm((s) => ({ ...s, [k]: masked }))
    );

  // === IBGE API ===
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((r) => r.json())
      .then((data) => setEstados(data))
      .catch(() => setEstados([]));
  }, []);

  useEffect(() => {
    if (!form.state) return;
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.state}/municipios`)
      .then((r) => r.json())
      .then((data) => setCidades(data))
      .catch(() => setCidades([]));
  }, [form.state]);

  // === Validação de senha ===
  function validarSenha(senha) {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
    return regex.test(senha);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.email !== form.confirmarEmail)
        throw new Error("Os e-mails não coincidem.");
      if (form.password !== form.confirmarSenha)
        throw new Error("As senhas não coincidem.");
      if (!validarSenha(form.password))
        throw new Error("A senha deve ter no mínimo 8 caracteres, 1 maiúscula e 1 símbolo.");

      const payload = {
        ...form,
        phone: getPhoneDigits(form.phone),
        whatsapp: getPhoneDigits(form.whatsapp),
      };

      await api.post("/auth/register", payload, { auth: false });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        nav("/login");
      }, 3000);
    } catch (err) {
      const message =
        err?.status === 409
          ? err?.response?.message || "E-mail ou telefone já cadastrados."
          : err?.message || "Falha ao cadastrar.";
      setErrorMsg(message);
      setOpenError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout titleRight="CADASTRE-SE">
      <form onSubmit={submit} noValidate>
        <Row>
          <FloatingInput
            id="firstName"
            label="Nome *"
            value={form.firstName}
            onChange={onChange("firstName")}
            required
          />
          <FloatingInput
            id="lastName"
            label="Sobrenome *"
            value={form.lastName}
            onChange={onChange("lastName")}
            required
          />
        </Row>

        <FloatingInput
          id="email"
          type="email"
          label="E-mail *"
          value={form.email}
          onChange={onChange("email")}
          required
        />

        <FloatingInput
          id="confirmarEmail"
          type="email"
          label="Confirmar E-mail *"
          value={form.confirmarEmail}
          onChange={onChange("confirmarEmail")}
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

        <FloatingInput
          id="confirmarSenha"
          type="password"
          label="Confirmar Senha *"
          value={form.confirmarSenha}
          onChange={onChange("confirmarSenha")}
          required
        />

        <Row>
          <FloatingInput
            id="phone"
            label="Telefone *"
            value={form.phone}
            onChange={onPhone("phone")}
            inputMode="numeric"
            placeholder=" "
          />
          <FloatingInput
            id="whatsapp"
            label="WhatsApp *"
            value={form.whatsapp}
            onChange={onPhone("whatsapp")}
            inputMode="numeric"
            placeholder=" "
          />
        </Row>

        <Row>
          <SelectWrapper>
            <label>Estado *</label>
            <Select value={form.state} onChange={onChange("state")} required>
              <option value="">Selecione...</option>
              {estados.map((e) => (
                <option key={e.id} value={e.sigla}>
                  {e.nome}
                </option>
              ))}
            </Select>
          </SelectWrapper>

          <SelectWrapper>
            <label>Cidade *</label>
            <Select
              value={form.city}
              onChange={onChange("city")}
              required
              disabled={!form.state}
            >
              <option value="">Selecione...</option>
              {cidades.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </SelectWrapper>
        </Row>

        <SelectWrapper>
          <label>Segmento *</label>
          <Select value={form.segment} onChange={onChange("segment")} required>
            <option value="">Selecione…</option>
            <option value="odontologia">Odontologia</option>
            <option value="estetica">Estética</option>
            <option value="loja_roupas">Loja de Roupas</option>
            <option value="restaurante">Restaurante</option>
            <option value="outros">Outros</option>
          </Select>
        </SelectWrapper>

        <Button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Cadastrar e Iniciar Teste Gratuito"}
        </Button>

        <LinkLine>
          Já tem conta? <Link to="/login">Faça Login</Link>
        </LinkLine>
      </form>

      <PopupError
        open={openError}
        message={errorMsg}
        onClose={() => setOpenError(false)}
      />

      <PopupSuccess
        visible={success}
        message="Cadastro realizado com sucesso!"
        onClose={() => setSuccess(false)}
      />
    </AuthLayout>
  );
}