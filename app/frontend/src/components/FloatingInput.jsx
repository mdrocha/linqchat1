import React, { useState } from "react";
import styled from "@emotion/styled";

const Wrapper = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  height: 52px;
  border: 2px solid #ccc;
  border-radius: 10px;
  font-size: 15px;
  color: #222;
  padding: 0 44px 0 14px; /* espaço pro ícone */
  background: transparent;
  outline: none;
  display: flex;
  align-items: center;
  line-height: 52px;
  transition: border-color 0.25s, box-shadow 0.25s;

  &:focus {
    border-color: #33A1E0;
    box-shadow: 0 0 0 3px rgba(122, 44, 255, 0.15);
  }

  &:focus + label,
  &:not(:placeholder-shown) + label {
    top: -7px;
    left: 12px;
    font-size: 12px;
    color: #33A1E0;
    background: #fff;
    padding: 0 6px;
  }
`;

const Label = styled.label`
  position: absolute;
  top: 16px;
  left: 16px;
  color: #555;
  font-size: 15px;
  pointer-events: none;
  background: transparent;
  transition: all 0.25s ease;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #666;
  width: 24px;
  height: 24px;

  &:hover {
    color: #111;
  }

  svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }
`;

export default function FloatingInput({
  id,
  type = "text",
  label,
  value,
  onChange,
  placeholder = " ",
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <Wrapper>
      <Input
        id={id}
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
      <Label htmlFor={id}>{label}</Label>
      {isPassword && (
        <ToggleButton
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          aria-label="Mostrar senha"
        >
          {showPassword ? (
            <svg viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </ToggleButton>
      )}
    </Wrapper>
  );
}
