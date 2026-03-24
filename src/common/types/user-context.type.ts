import { SystemRole } from '../enums/system-role.enum';

/** Decoded JWT payload attached to req.user on every authenticated request */
export interface UserContext {
  id: string;
  email: string;
  systemRole: SystemRole | null;
  roleId: string | null;
}
