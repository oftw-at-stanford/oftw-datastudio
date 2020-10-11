import * as nodemailer from 'nodemailer';
import * as config from '../config.json';

const {user, host, pass} = config.email;

export async function sendOnboardingMail(to: string) {
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
    from: 'OFTW Team <' + user + '>',
    to,
    subject: 'OFTW next steps',
    text: `Hello!

Thanks so much for taking the pledge for One for the World @ Stanford! To finalize your information, please fill out this form at https://airtable.com/shrGneCDX1AqhAXUF. Thanks so much!

- The OFTW Team`,
  });
}
