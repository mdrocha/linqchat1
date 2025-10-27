import React from "react";
import styled from "@emotion/styled";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 520px;
  min-height: 100vh;
  background: #f7f8fc;
`;

const Left = styled.div`
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #6d8bff 0%, #2a5bff 70%);
  color: #fff;
  position: relative;
  overflow: hidden;
`;

const Wave = styled.div`
  position: absolute;
  width: 140%;
  height: 40%;
  left: -10%;
  bottom: -5%;
  background: #0047ff;
  border-radius: 50% 50% 0 0;
  transform: rotate(-5deg);
`;

const LeftContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 520px;
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  margin: 0;
  opacity: 0.95;
  font-size: 14px;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-left: 1px solid #eef0f4;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 24px;
  h2 {
    margin-top: 0;
    margin-bottom: 20px; /* adiciona espaço entre título e formulário */
  }
`;

export default function AuthLayout({ children, titleRight }) {
  return (
    <Wrapper>
      <Left>
        <LeftContent>
          <Title>Bem-vindo à Plataforma de IA para Atendimento</Title>
          <Subtitle>Automatize seu WhatsApp com a inteligência dos assistentes da OpenAI.</Subtitle>
        </LeftContent>
        <Wave />
      </Left>
      <Right>
        <Card>
          {titleRight ? <h2 style={{ marginTop: 0 }}>{titleRight}</h2> : null}
          {children}
        </Card>
      </Right>
    </Wrapper>
  );
}
