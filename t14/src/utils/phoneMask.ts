// src/utils/phoneMask.ts

/**
 * Aplica máscara de telefone brasileiro/português
 */
export function formatPhoneNumber(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 15 caracteres (formato internacional)
  const limited = numbers.slice(0, 15);
  
  // Aplica máscara baseada no tamanho
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)} ${limited.slice(3)}`;
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  } else if (limited.length <= 11) {
    return `${limited.slice(0, 3)} ${limited.slice(3, 7)} ${limited.slice(7)}`;
  } else {
    // Formato internacional: +351 123 456 789
    return `+${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 9)} ${limited.slice(9)}`;
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

