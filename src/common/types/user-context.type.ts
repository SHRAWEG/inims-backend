import { UserRole } from '../enums/user-role.enum';

/** Decoded JWT payload attached to req.user on every authenticated request */
export interface UserContext {
  id: string;
  email: string;
  role: UserRole;
}
