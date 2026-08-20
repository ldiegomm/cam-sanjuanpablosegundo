import { renderHook } from '@testing-library/react'
import { useEscapeKey } from './useEscapeKey'

describe('useEscapeKey Hook', () => {
  it('debe llamar a onEscape cuando se presiona la tecla Escape y está activo', () => {
    const onEscape = jest.fn()
    renderHook(() => useEscapeKey(true, onEscape))

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)

    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('no debe llamar a onEscape cuando se presiona la tecla Escape pero no está activo', () => {
    const onEscape = jest.fn()
    renderHook(() => useEscapeKey(false, onEscape))

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)

    expect(onEscape).not.toHaveBeenCalled()
  })

  it('no debe llamar a onEscape cuando se presiona otra tecla', () => {
    const onEscape = jest.fn()
    renderHook(() => useEscapeKey(true, onEscape))

    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    window.dispatchEvent(event)

    expect(onEscape).not.toHaveBeenCalled()
  })

  it('debe limpiar el event listener al desmontar', () => {
    const onEscape = jest.fn()
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    
    const { unmount } = renderHook(() => useEscapeKey(true, onEscape))
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  it('debe actualizar el listener cuando cambia onEscape', () => {
    const onEscape1 = jest.fn()
    const onEscape2 = jest.fn()
    
    const { rerender } = renderHook(
      ({ callback }) => useEscapeKey(true, callback),
      { initialProps: { callback: onEscape1 } }
    )

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)
    expect(onEscape1).toHaveBeenCalledTimes(1)
    expect(onEscape2).not.toHaveBeenCalled()

    // Cambiar el callback
    rerender({ callback: onEscape2 })
    
    window.dispatchEvent(event)
    expect(onEscape1).toHaveBeenCalledTimes(1) // No debe aumentar
    expect(onEscape2).toHaveBeenCalledTimes(1) // Ahora este debe ser llamado
  })

  it('debe actualizar el listener cuando cambia el estado activo', () => {
    const onEscape = jest.fn()
    
    const { rerender } = renderHook(
      ({ active }) => useEscapeKey(active, onEscape),
      { initialProps: { active: false } }
    )

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)
    expect(onEscape).not.toHaveBeenCalled()

    // Activar
    rerender({ active: true })
    
    window.dispatchEvent(event)
    expect(onEscape).toHaveBeenCalledTimes(1)
  })
})
