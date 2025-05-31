// Backend/services/passwordGenerator.js

/**
 * Génère un mot de passe aléatoire via l'API PasswordWolf
 * @returns {Promise<string>}
 */
async function generatePassword() {
  // Exemple avec PasswordWolf
  const response = await fetch(
    'https://passwordwolf.com/api/?length=12&upper=1&numbers=1&special=1'
  );
  if (!response.ok) {
    throw new Error(`Erreur génération mot de passe : ${response.status}`);
  }
  const [result] = await response.json();
  return result.password;
}

module.exports = { generatePassword };
