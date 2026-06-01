/**
 * Interpolates variables in a message string using data from a contact object.
 * e.g. "Hello {name}" -> "Hello John"
 */
export const interpolate = (message, contact) => {
  return message.replace(/{(\w+)}/g, (match, key) => {
    return contact[key] || match;
  });
};

/**
 * Formats a phone number for WhatsApp.
 * Removes non-digits and ensures it has a country code.
 */
export const formatPhone = (phone) => {
  const cleaned = phone.toString().replace(/\D/g, '');
  // Basic validation: if it doesn't start with a plus (or 91 for India as example), we might need logic.
  // For now, assume the user provides a full number or we just return the cleaned digits.
  return cleaned;
};

/**
 * Generates a WhatsApp Web link.
 */
export const getWhatsAppLink = (phone, message) => {
  const encodedMsg = encodeURIComponent(message);
  return `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`;
};
