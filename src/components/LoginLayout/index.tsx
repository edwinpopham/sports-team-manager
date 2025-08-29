import * as React from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const LoginLayout = ({ children }: Props) => {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      {children}
    </div>
  );
};
