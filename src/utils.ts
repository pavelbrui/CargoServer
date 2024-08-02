import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { GraphQLTypes } from 'gei-bookings/lib/zeus/index.js';

export function updateNestedFields(inputObject: Record<string, any>, nestedObjectName: string) {
  let updateObject: Record<string, any> = {};
  for (const field in inputObject) {
    if (
      typeof inputObject[field] === 'object' &&
      !Array.isArray(inputObject[field]) &&
      !(inputObject[field] instanceof Date)
    ) {
      const updateNestedObjectSet = updateNestedFields(inputObject[field], field);
      for (const nestedField in updateNestedObjectSet) {
        const fieldName = `${nestedObjectName}.${nestedField}`;
        updateObject[fieldName] = updateNestedObjectSet[nestedField];
      }
    } else {
      const fieldName = `${nestedObjectName}.${field}`;
      updateObject[fieldName] = inputObject[field];
    }
  }
  return updateObject;
}

const { key, domain, sender, url } = (() => {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_SENDER, MAILGUN_SERVER_DOMAIN } = process.env;
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_SENDER) {
    throw new Error('Mailgun envs not set');
  }
  const url = MAILGUN_SERVER_DOMAIN || `https://api.eu.mailgun.net/`;
  return { key: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN, sender: MAILGUN_SENDER, url };
})();

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ key, url, username: 'api' });

export const sendMessage = ({ message, to, subject, from }: GraphQLTypes['MailgunData']) =>
  mg.messages.create(domain, {
    from: from || sender,
    to,
    subject,
    text: message,
  });

export const sendMessageHTML = ({ message, to, subject, from }: GraphQLTypes['MailgunData']) =>
  mg.messages.create(domain, {
    from: from || sender,
    to,
    subject,
    html: message,
  });
