// Text formatting utilities for consistent display of entities and names
import { titleCase } from 'title-case';

/**
 * Converts text to title case with proper handling of special words
 * Maintains formats like "University of Birmingham" correctly
 * @param {string} text - The text to format
 * @returns {string} - Formatted text with proper capitalization
 */
export const formatTitleCase = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Use the title-case library for proper title case formatting
  return titleCase(text);
};

/**
 * Formats entity names for display (universities, colleges, schools, modules, etc.)
 * @param {string} entityName - The entity name to format
 * @returns {string} - Formatted entity name
 */
export const formatEntityName = (entityName) => {
  return formatTitleCase(entityName);
};

/**
 * Formats person names for display (lecturers, users, etc.)
 * @param {string} personName - The person name to format
 * @returns {string} - Formatted person name
 */
export const formatPersonName = (personName) => {
  return formatTitleCase(personName);
}; 