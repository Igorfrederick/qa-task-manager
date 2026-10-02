import mongoose from 'mongoose'

import { ROLE_VALUES, ROLES } from '../utils/roles.js'

/**
 * Usuário do Task Manager.
 *
 * `passwordHash` é protegido por duas barreiras independentes, porque elas
 * falham em situações diferentes:
 *
 * 1. `select: false` — a query não traz o campo do banco. Protege o caminho
 *    comum, mas é anulado deliberadamente por `.select('+passwordHash')`, que
 *    o login vai precisar para comparar a senha.
 * 2. `transform` em `toJSON` e `toObject` — remove o campo na serialização.
 *    Protege exatamente o caminho que a barreira 1 abre: quando alguém
 *    selecionou o hash de propósito e devolve o documento sem pensar.
 *
 * `toObject` também, e não só `toJSON`: `res.json()` chama `toJSON`, mas
 * espalhar o documento (`{ ...user.toObject() }`) ou logá-lo não chama.
 *
 * Consequência registrada em `backend_conventions.md` §Senhas: `lean()` é
 * proibido em query que retorne User. `lean()` devolve objeto plano, sem
 * documento Mongoose, e o transform não se aplica — a barreira 2 desaparece
 * em silêncio, sem erro, sem aviso.
 */

function removePasswordHash(_doc, ret) {
  delete ret.passwordHash
  return ret
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ROLE_VALUES,
      default: ROLES.QA,
    },
  },
  {
    timestamps: true,
    toJSON: { transform: removePasswordHash },
    toObject: { transform: removePasswordHash },
  },
)

export const User = mongoose.model('User', userSchema)
