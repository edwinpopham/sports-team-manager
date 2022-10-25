import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

type Props = {
  children: JSX.Element;
};

export const LoginLayout = ({ children }: Props) => {
  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm">{children}</Container>
    </React.Fragment>
  );
};
