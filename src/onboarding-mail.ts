import * as nodemailer from "nodemailer";
import { Repository } from "typeorm";
import * as config from "../config.json";
import { Contact } from "./entity/Contact";
import { Pledgees } from "./save-pledges";

const { user, host, pass } = config.email;

async function sendOnboardingMail(to: string) {
  const account = nodemailer.createTransport({
    host,
    port: 587,
    auth: {
      user,
      pass,
    },
  });

  console.log("Sending mail to", to);

  return await account.sendMail({
    from: "OFTW Team <" + user + ">",
    to,
    subject: "OFTW next steps",
    text: `Hello!

Thanks so much for taking the pledge for One for the World @ Stanford! To finalize your pledge, please fill out this form at https://airtable.com/shrGneCDX1AqhAXUF. Thanks so much!

- The OFTW Team`,
  });
}

export default async function sendOnboarding(contactsRepo: Repository<Contact>, currentPledgees: Pledgees) {
  const contacts = (await contactsRepo.find()).map(c => c.email);

  for (const { email } of currentPledgees) {
    if (!contacts.includes(email)) {
      // Send the email!
      await sendOnboardingMail(email);
      console.log("Sending initial onboarding mail to", email);
      const c = new Contact();
      c.email = email;
      await contactsRepo.insert(c);
    }
  }
}
