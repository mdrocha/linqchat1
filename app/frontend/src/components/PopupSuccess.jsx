import { useEffect } from "react";
import styled from "@emotion/styled";

const Overlay = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: #4caf50;
  color: #fff;
  padding: 14px 22px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  opacity: ${(props) => (props.visible ? 1 : 0)};
  transform: translateY(${(props) => (props.visible ? "0" : "-10px")});
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

export default function PopupSuccess({ message, visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return visible ? <Overlay visible={visible}>{message}</Overlay> : null;
}
