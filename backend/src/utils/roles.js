/**
 * Perfis de usuário.
 *
 * Constante única. String de perfil espalhada pelo código transforma erro de
 * digitação em falha de autorização silenciosa — o middleware compara com um
 * valor que nunca bate e nega, ou compara com o errado e libera.
 */
export const ROLES = Object.freeze({
  QA: 'qa',
  LEAD: 'lead',
})

/** Valores aceitos em `User.role`. Consumido pelo schema Mongoose e pelo Zod. */
export const ROLE_VALUES = Object.freeze(Object.values(ROLES))
