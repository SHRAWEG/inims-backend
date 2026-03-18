import { UserContext } from '../common/types/user-context.type';

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}
