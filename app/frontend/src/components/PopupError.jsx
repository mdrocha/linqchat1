import React from "react";
import styled from "@emotion/styled";

const Backdrop = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  display: grid; place-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,.2);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 14px 18px;
  background: #ffefef;
  color: #b00020;
  font-weight: 700;
  border-bottom: 1px solid #ffdada;
`;

const Body = styled.div`
  padding: 16px 18px;
  color: #333;
  font-size: 14px;
`;

const Actions = styled.div`
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 12px 18px; border-top: 1px solid #f1f3f7;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 10px;
  border: 0;
  background: #0a57ff;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
`;

export default function PopupError({ open, title = "Erro", message, onClose }) {
  if (!open) return null;
  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>{title}</Header>
        <Body>{message}</Body>
        <Actions>
          <Button onClick={onClose}>Fechar</Button>
        </Actions>
      </Modal>
    </Backdrop>
  );
}