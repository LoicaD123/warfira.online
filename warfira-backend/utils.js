// Validation email
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validation champs obligatoires
export function hasRequiredFields(obj, fields) {
  return fields.every(field => obj[field] !== undefined && obj[field] !== '');
}

// Formatage nom
export function formatName(prenom, nom) {
  return `${prenom.trim()} ${nom.trim()}`;
}

// Validation téléphone
export function isValidPhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}

// Statut par défaut
export function getDefaultStatus() {
  return 'nouveau';
}  import { describe, test, expect, vi } from 'vitest';
import { isValidEmail, hasRequiredFields, formatName, isValidPhone, getDefaultStatus } from './utils.js';

// ══ TESTS SIMPLES ══
describe('isValidEmail', () => {
  test('retourne true pour un email valide', () => {
    expect(isValidEmail('contact@warfira.com')).toBe(true);
  });
  test('retourne false pour un email invalide', () => {
    expect(isValidEmail('pasunemail')).toBe(false);
  });
  test('retourne false pour un email sans domaine', () => {
    expect(isValidEmail('test@')).toBe(false);
  });
});

describe('hasRequiredFields', () => {
  test('retourne true si tous les champs sont présents', () => {
    const data = { prenom: 'Loica', nom: 'Ewongo', email: 'l@w.com' };
    expect(hasRequiredFields(data, ['prenom', 'nom', 'email'])).toBe(true);
  });
  test('retourne false si un champ est manquant', () => {
    const data = { prenom: 'Loica', nom: '' };
    expect(hasRequiredFields(data, ['prenom', 'nom', 'email'])).toBe(false);
  });
});

describe('formatName', () => {
  test('formate correctement le nom complet', () => {
    expect(formatName('Loica', 'Ewongo')).toBe('Loica Ewongo');
  });
  test('supprime les espaces superflus', () => {
    expect(formatName(' Loica ', ' Ewongo ')).toBe('Loica Ewongo');
  });
});

describe('isValidPhone', () => {
  test('retourne true pour un numéro valide', () => {
    expect(isValidPhone('0753584725')).toBe(true);
  });
  test('retourne false pour un numéro trop court', () => {
    expect(isValidPhone('012345')).toBe(false);
  });
});

describe('getDefaultStatus', () => {
  test('retourne le statut par défaut nouveau', () => {
    expect(getDefaultStatus()).toBe('nouveau');
  });
});

// ══ TEST MOCK ══
describe('mock - notification email', () => {
  test('la fonction sendMail est appelée', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: '123' });
    const result = await sendMail({ to: 'contact@warfira.com', subject: 'Test' });
    expect(sendMail).toHaveBeenCalled();
    expect(result.messageId).toBe('123');
  });
});

// ══ TEST ASYNCHRONE ══
describe('async - insertion base de données', () => {
  test('simule une insertion réussie', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ insertId: 1, affectedRows: 1 });
    const result = await mockInsert({ prenom: 'Loica', nom: 'Ewongo' });
    expect(result.insertId).toBe(1);
    expect(result.affectedRows).toBe(1);
  });
});