import * as process from "process";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { Contact } from "./entity/Contact";
import sendOnboarding from "./onboarding-mail";
import savePledges from "./save-pledges";
import calculateStatistics from "./statistics";
import { updateRepo } from "./update-repo";

// The main application pipeline.
// Connects to the database (using TypeOrm), fetches pledges from the dashboard
// using headless Chrome, then calculates statistics, sends onboarding emails,
// and updates the github repo.
(async () => {
  console.log("Data Studio Scraper");

  const dbConn = await createConnection();

  const data = await savePledges();
  const stats = await calculateStatistics(data);

  const contactRepo = dbConn.getRepository(Contact);
  if (process.env.SEND_ONBOARDING) {
    await sendOnboarding(contactRepo, data);
  }

  if (process.env.UPDATE_REPO) {
    await updateRepo(stats);
  } else {
    console.log("Skipping repo update");
  }
})().catch((e) => {
  // Catch any async errors and force the process to terminate
  console.error(e);
  process.exit(1);
});
