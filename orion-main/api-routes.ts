import express, { Router } from 'express';
import { customerAuthRouter } from './server/public-routes/customer-auth/public.customer-auth.routes';
import { customerPublicRouter } from './server/public-routes/customer/public.customer.routes';
import { customerEMIRouter } from './server/public-routes/customer/public.customer-emi.routes';
import { customerSupportRouter } from './server/public-routes/customer/public.customer-ticket.routes';

export const apiRouter: Router = express.Router();

apiRouter.use('/auth', customerAuthRouter);
apiRouter.use('/customer', customerPublicRouter);
apiRouter.use('/customer-emi', customerEMIRouter);
apiRouter.use('/customer-support', customerSupportRouter);
