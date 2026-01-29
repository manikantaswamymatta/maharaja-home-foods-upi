export const WHATSAPP_NUMBER = "919542477392";

export const createWhatsAppOrderLink = (message: string) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};