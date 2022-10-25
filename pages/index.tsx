import type { ReactElement } from "react";
import { LoginLayout } from "../src/components/LoginLayout/index";
import type { NextPageWithLayout } from "./_app";

const Login: NextPageWithLayout = () => {
  return <p>Login Here</p>;
};

Login.getLayout = function getLayout(page: ReactElement) {
  return <LoginLayout>{page}</LoginLayout>;
};

export default Login;
