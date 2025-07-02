// This file helps typescript recognize the added credentials fields
import "next-auth";

declare module "next-auth" {
  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    walletAddress?: string | null;
    walletType?: string | null;
    solanaAddress?: string | null;
    evmAddress?: string | null;
    referralCode?: string | null;
    referrer: null | {
      id: string | null;
    };
  }

  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      email?: string | null;
      walletAddress?: string | null;
      walletType?: string | null;
      solanaAddress?: string | null;
      evmAddress?: string | null;
      referralCode?: string | null;
    };
  }

  /** Used for credentials sign in */
  interface CredentialsSignin {
    userId: string;
    email?: string;
    wallet?: string;
    walletType?: string;
  }
}
