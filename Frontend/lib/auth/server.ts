import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getRoleFromUser } from "@/lib/auth/user";
import { ROLES } from "@/lib/constants/roles";
import { verifyCookieUser } from "@/lib/server/firebase-admin";

interface ServerUser {
  id: string;
  email: string | null;
}

export const requireUser = async () => {
  const user = await verifyCookieUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const mappedUser: ServerUser = {
    id: user.uid,
    email: user.email ?? null,
  };

  return mappedUser;
};

export const requireAdmin = async () => {
  const user = await requireUser();
  const role = getRoleFromUser(user);

  if (role !== ROLES.ADMIN) {
    redirect(ROUTES.HOME);
  }

  return user;
};
