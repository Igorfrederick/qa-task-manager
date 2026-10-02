import { ZodError } from 'zod'

/**
 * Validação de entrada por schema Zod.
 *
 * Aplicado na definição da rota, antes do controller. O service pode assumir
 * que recebeu dado com a forma correta — é o que permite que ele trate só de
 * regra de negócio.
 *
 * Substitui `req.body` pelo resultado do parse, e não apenas valida: o Zod
 * normaliza (`trim`, `toLowerCase`) e remove campo não declarado. Sem a
 * substituição, o controller seguiria com o payload cru e a normalização seria
 * trabalho jogado fora.
 */
export function validateBody(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      next(error instanceof ZodError ? new ValidationError(error) : error)
    }
  }
}

/**
 * Falha de validação de payload. `400`, com `details` preenchido.
 *
 * Declarada aqui, e não em `utils/errors.js`, porque é o erro deste middleware
 * e só ele a constrói — não é violação de regra de domínio. Quando o catálogo
 * de `code`s nascer, no commit de login, `VALIDATION_ERROR` migra para lá
 * junto com `EMAIL_TAKEN`.
 */
export class ValidationError extends Error {
  constructor(zodError) {
    super('Dados inválidos na requisição')
    this.name = 'ValidationError'
    this.code = 'VALIDATION_ERROR'
    this.status = 400
    this.details = zodError.issues.map((issue) => ({
      field: issue.path.join('.'),
      issue: issue.message,
    }))
  }
}
