import { render, screen, fireEvent } from '@testing-library/react'
import ErrorState from './ErrorState'

describe('ErrorState Component', () => {
  it('debe renderizar el título correctamente', () => {
    render(<ErrorState title="Error de prueba" />)
    expect(screen.getByText('Error de prueba')).toBeInTheDocument()
  })

  it('debe renderizar el icono por defecto cuando no se proporciona uno', () => {
    const { container } = render(<ErrorState title="Error" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('debe renderizar un icono personalizado cuando se proporciona', () => {
    const customIcon = <div data-testid="custom-icon">Custom</div>
    render(<ErrorState title="Error" icon={customIcon} />)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('debe renderizar la descripción cuando se proporciona', () => {
    render(
      <ErrorState
        title="Error"
        description="Esta es una descripción de prueba"
      />
    )
    expect(screen.getByText('Esta es una descripción de prueba')).toBeInTheDocument()
  })

  it('no debe renderizar la descripción cuando no se proporciona', () => {
    const { container } = render(<ErrorState title="Error" />)
    const paragraphs = container.querySelectorAll('p')
    // Solo debe haber un párrafo (el título)
    expect(paragraphs).toHaveLength(1)
  })

  it('debe renderizar el botón de acción cuando se proporcionan actionLabel y onAction', () => {
    const mockAction = jest.fn()
    render(
      <ErrorState
        title="Error"
        actionLabel="Reintentar"
        onAction={mockAction}
      />
    )
    const button = screen.getByText('Reintentar')
    expect(button).toBeInTheDocument()
  })

  it('debe llamar a onAction cuando se hace clic en el botón', () => {
    const mockAction = jest.fn()
    render(
      <ErrorState
        title="Error"
        actionLabel="Reintentar"
        onAction={mockAction}
      />
    )
    const button = screen.getByText('Reintentar')
    fireEvent.click(button)
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('no debe renderizar el botón cuando falta actionLabel', () => {
    const mockAction = jest.fn()
    render(<ErrorState title="Error" onAction={mockAction} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('no debe renderizar el botón cuando falta onAction', () => {
    render(<ErrorState title="Error" actionLabel="Reintentar" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('debe aplicar estilos correctamente', () => {
    const { container } = render(<ErrorState title="Error" />)
    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveStyle({
      textAlign: 'center',
      padding: '3rem 1rem',
    })
  })
})
