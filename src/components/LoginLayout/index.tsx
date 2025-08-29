import * as React from "react";

type Props = {
  children: JSX.Element;
};

export const LoginLayout = ({ children }: Props) => {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      {children}
    </div>
  );
};
