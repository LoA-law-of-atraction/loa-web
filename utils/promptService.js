import fs from 'fs';
import path from 'path';

/**
 * Load a prompt template from the prompts directory
 * @param {string} promptName - Name of the prompt file (without .txt extension)
 * @returns {string} The prompt template
 */
export function loadPrompt(promptName) {
  const promptPath = path.join(process.cwd(), 'prompts', `${promptName}.txt`);

  try {
    const prompt = fs.readFileSync(promptPath, 'utf-8');
    return prompt;
  } catch (error) {
    console.error(`Failed to load prompt: ${promptName}`, error);
    throw new Error(`Prompt file not found: ${promptName}.txt`);
  }
}

/**
 * Replace placeholders in a prompt template
 * @param {string} template - The prompt template
 * @param {object} variables - Object with variable names and values
 * @returns {string} The prompt with replaced variables
 */
export function fillPromptTemplate(template, variables) {
  let filledPrompt = template;

  // First, handle includes ({{include:filename}})
  const includePattern = /{{include:([^}]+)}}/g;
  let match;
  while ((match = includePattern.exec(filledPrompt)) !== null) {
    const includeFileName = match[1];
    try {
      const includedContent = loadPrompt(includeFileName);
      filledPrompt = filledPrompt.replace(match[0], includedContent);
    } catch (error) {
      console.error(`Failed to include prompt: ${includeFileName}`, error);
      // Keep the include directive if file not found
    }
  }

  // Then, handle variable replacements
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    const replacement = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
    filledPrompt = filledPrompt.replace(placeholder, replacement);
  }

  return filledPrompt;
}

/**
 * Load and fill a prompt template in one step
 * @param {string} promptName - Name of the prompt file
 * @param {object} variables - Variables to fill in the template
 * @returns {string} The filled prompt
 */
export function getPrompt(promptName, variables = {}) {
  const template = loadPrompt(promptName);
  return fillPromptTemplate(template, variables);
}
