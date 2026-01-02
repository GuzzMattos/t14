// src/utils/phoneMask.ts

/**
 * Aplica máscara de telefone português (PT)
 * Formato: 912 345 678 (9 dígitos)
 */
export function formatPhoneNumber(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 9 dígitos (formato português)
  const limited = numbers.slice(0, 9);
  
  // Aplica máscara baseada no tamanho
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)} ${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  }
}

/**
 * Remove máscara do telefone
 */
export function removePhoneMask(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formata telefone para exibição
 */
export function displayPhone(phone: string | null | undefined): string {
  if (!phone) return "Não definido";
  return formatPhoneNumber(phone);
}

