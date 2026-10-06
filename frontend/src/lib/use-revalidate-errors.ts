import { useEffect } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

/**
 * react-hook-form only re-checks fields on change after a full submit. In a multi-step form
 * the steps validate with trigger(), so without this an error would stay visible after the
 * user fixes the field. Re-checks any field that currently shows an error as soon as it changes.
 */
export function useRevalidateErrors<T extends FieldValues>(form: UseFormReturn<T>): void {
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name && form.getFieldState(name as Path<T>).error) void form.trigger(name as Path<T>)
    })
    return () => subscription.unsubscribe()
  }, [form])
}
