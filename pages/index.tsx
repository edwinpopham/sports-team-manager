import type { ReactElement } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { LoginLayout } from "../src/components/LoginLayout/index";
import type { NextPageWithLayout } from "./_app";

const Login: NextPageWithLayout = () => {
  const { data: session } = useSession();
  if (session !== null && session !== undefined) {
    return (
      <>
        Signed in as {session?.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
};

Login.getLayout = function getLayout(page: ReactElement) {
  return <LoginLayout>{page}</LoginLayout>;
};

export default Login;
