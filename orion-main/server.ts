import express, { Express } from 'express';
import cors from 'cors';
import { crmRouter } from './crm-routes';
import dotenv from 'dotenv';
import findConfig from 'find-config';
import { apiRouter } from './api-routes';
import * as Sentry from '@sentry/node';
import cron from 'node-cron';
import { sendDailyWelcomeMailJob } from './jobs/welcome-mail';

const envPath = findConfig('.env');
dotenv.config({ path: envPath ? envPath.toString() : undefined });

const app: Express = express();

const port = process.env.PORT || 3000;

app.set('trust proxy', true);
app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
app.use(Sentry.Handlers.tracingHandler());

app.use(cors());
app.use(express.json());
app.use('/crm-api', crmRouter);
app.use('/api', apiRouter);

const emailSchedule = cron.schedule(
  '00 08 * * *',
  () => {
    console.log('running welcome mail job daily');
    sendDailyWelcomeMailJob();
  },
  {
    timezone: 'Asia/Kolkata',
  },
);
emailSchedule.stop();

app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

app.get('/',(req,res)=>{
  res.send("HELLO WORLD")
})
app.listen(port, () => {
  console.log(`Orion is live at port ${port}`);
});
