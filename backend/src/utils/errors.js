/**
 * Erro de domínio.
 *
 * O service não conhece `req` nem `res`: quando a regra é violada, ele lança
 * isto. Quem traduz para HTTP é o middleware de erro, em um lugar só.
 *
 * O erro carrega `code` e `status` porque quem detecta a violação é quem sabe
 * a natureza dela. O middleware não precisa adivinhar nem manter um mapa.
 *
 * Ainda NÃO existe catálogo de `code`s: ele nasce na fatia de login, quando a
 * família `401` der a informação para decidir a forma — `CLAUDE.md` §10. Até
 * lá os `code`s vivem declarados aqui, ao lado do erro que os usa.
 */
export class DomainError extends Error {
  /**
   * @param {string} code    contrato, SCREAMING_SNAKE_CASE
   * @param {string} message apresentação, em português
   * @param {number} status  status HTTP da violação
   */
  constructor(code, message, status) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.status = status
  }
}

/**
 * Violação de unicidade de `User.email`.
 *
 * `409` porque é invariante de domínio: só se julga consultando o estado do
 * sistema. O formato do e-mail é invariante de entrada e morre no schema Zod
 * com `400`, antes de chegar aqui.
 */
export class EmailTakenError extends DomainError {
  constructor(email) {
    super('EMAIL_TAKEN', `Já existe usuário cadastrado com o e-mail ${email}`, 409)
    this.name = 'EmailTakenError'
  }
}
