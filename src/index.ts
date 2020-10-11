import * as process from 'process';
import "reflect-metadata";
import { createConnection } from 'typeorm';
import { Contact } from './entity/Contact';
import sendOnboarding from './onboarding-mail';
import savePledges from './save-pledges';
import calculateStatistics from './statistics';
import { updateRepo } from './update-repo';

// https://github.com/puppeteer/puppeteer/issues/6214
declare module 'puppeteer' {
  export interface Page {
    waitForTimeout(duration: number): Promise<void>;
  }
}

// The main application pipeline.
(async () => {
  console.log('Data Studio Scraper');

  const dbConn = await createConnection();
  
  const data = await savePledges();
  const stats = await calculateStatistics(data);

  const contactRepo = dbConn.getRepository(Contact);
  await sendOnboarding(contactRepo, data);

  if (process.env.UPDATE_REPO) {
    await updateRepo(stats);
  } else {
    console.log('Skipping repo update');
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
