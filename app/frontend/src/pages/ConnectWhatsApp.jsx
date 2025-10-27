/** @jsxImportSource @emotion/react */
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AuthLayout from "@/layouts/AuthLayout";

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
`;

const Title = styled.h1`
  margin: 0 0 6px 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  text-align: center;
`;

const Subtitle = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
`;

const QRBox = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  height: 300px;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
  overflow: hidden;
`;

const Meta = styled.div`
  margin-top: 10px;
  text-align: center;
  font-size: 13px;
  color: #374151;
`;

const Danger = styled.p`
  color: #b91c1c;
  font-size: 13px;
  text-align: center;
  margin: 12px 0 0;
`;

const PrimaryButton = styled.button`
  width: 100%;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #4f46e5;
  background: #4f46e5;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: #4338ca; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;

export default function ConnectWhatsApp() {
  const navigate = useNavigate();
  const [qr, setQr] = useState(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [expired, setExpired] = useState(false);
  const [count, setCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:4000", {
      transports: ["websocket"],
    });
    setSocket(s);

    s.on("qr", (data) => {
      setQr(data.img);
      setExpiresAt(data.expiresAt || Date.now() + 60_000);
      setExpired(false);
    });

    s.on("qr_expired", () => setExpired(true));
    s.on("ready", () => navigate("/dashboard", { replace: true }));

    return () => s.close();
  }, [navigate]);

  useEffect(() => {
    if (!expiresAt || expired) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setCount(left);
      if (left <= 0) setExpired(true);
    }, 500);
    return () => clearInterval(id);
  }, [expiresAt, expired]);

  return (
    <AuthLayout>
      <div
        css={css`
          width: 100%;
          display: grid;
          place-items: center;
          min-height: calc(100vh - 120px);
        `}
      >
        <Card>
          <Title>Conectar WhatsApp</Title>
          <Subtitle>Escaneie o QR Code no app do WhatsApp para vincular sua conta.</Subtitle>

          <QRBox>
            {!qr && !expired && (
              <span css={css`color:#6b7280; font-size:14px;`}>Aguardando QR Code…</span>
            )}
            {qr && !expired && (
              <img
                src={qr}
                alt="QR Code"
                css={css`width: 280px; height: 280px; border-radius: 8px;`}
              />
            )}
          </QRBox>

          {!expired && qr && (
            <Meta>Expira em {count}s</Meta>
          )}

          {expired && (
            <>
              <Danger>QR expirado</Danger>
              <PrimaryButton
                onClick={() => {
                  if (!socket) return;
                  setLoading(true);
                  setQr(null);
                  setExpired(false);
                  setExpiresAt(0);
                  socket.emit("qr_regenerate");
                  // destrava após 1s apenas para feedback visual
                  setTimeout(() => setLoading(false), 1000);
                }}
                disabled={loading}
              >
                {loading ? "Gerando..." : "Gerar novo QR"}
              </PrimaryButton>
            </>
          )}
        </Card>
      </div>
    </AuthLayout>
  );
}
