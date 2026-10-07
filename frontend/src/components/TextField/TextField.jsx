import FormField from '../FormField/FormField.jsx'

/**
 * Campo de texto. As demais props vão para o `input` — entre elas o retorno
 * do `register` do React Hook Form, `ref` incluída, e o `data-cy`.
 */
export default function TextField({ label, error, errorDataCy, ...inputProps }) {
  return (
    <FormField label={label} error={error} errorDataCy={errorDataCy}>
      {(controlProps) => <input {...controlProps} {...inputProps} />}
    </FormField>
  )
}
