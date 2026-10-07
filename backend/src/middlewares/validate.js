import { ZodError } from 'zod'

import { AppError } from '../utils/errors.js'

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
      next(error instanceof ZodError ? new AppError('VALIDATION_ERROR', toDetails(error)) : error)
    }
  }
}

/** Uma entrada de `details` por falha, no formato de `api_contract.md`. */
function toDetails(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    issue: issue.message,
  }))
}
