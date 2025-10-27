import React from "react";
import styled from "@emotion/styled";

const FieldWrapper = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const InputStyled = styled.input`
  width: 100%;
  height: 52px;
  border: 2px solid #d6d6e5;
  border-radius: 10px;
  padding: 14px 14px 0 14px;
  font-size: 15px;
  outline: none;
  background: transparent;
  color: #222;
  transition: border-color 0.25s, box-shadow 0.25s;

  &:focus {
    border-color: #7a2cff;
    box-shadow: 0 0 0 3px rgba(122, 44, 255, 0.15);
  }

  &:focus + label,
  &:not(:placeholder-shown) + label {
    top: 6px;
    left: 12px;
    font-size: 12px;
    color: #7a2cff;
    background: #fff;
    padding: 0 6px;
  }
`;

const LabelStyled = styled.label`
  position: absolute;
  top: 17px;
  left: 16px;
  color: #555;
  font-size: 15px;
  pointer-events: none;
  transition: all 0.25s ease;
`;

export default function AnimatedInput({
  id,
  type = "text",
  label,
  value,
  onChange,
  placeholder = " ",
  ...rest
}) {
  return (
    <FieldWrapper>
      <InputStyled
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
      <LabelStyled htmlFor={id}>{label}</LabelStyled>
    </FieldWrapper>
  );
}