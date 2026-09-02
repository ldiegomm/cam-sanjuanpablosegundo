import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import NotificacionesPage from './page'

const ADMIN_USER = { id: 1, nombre: 'William Admin', email: 'will@centro.com', rol: 'admin' }
const COLABORADOR_USER = { id: 2, nombre: 'Colaboradora', email: 'colab@centro.com', rol: 'colaborador' }

const CONFIG_TODOS_LOS_DIAS = {
  activo: true,
  correo_destino: 'avisos@centro.com',
  domingo: true,
  lunes: true,
  martes: true,
  miercoles: true,
  jueves: true,
  viernes: true,
  sabado: true,
}

const CONFIG_DIAS_ESPECIFICOS = {
  activo: true,
  correo_destino: 'avisos@centro.com',
  domingo: false,
  lunes: true,
  martes: false,
  miercoles: false,
  jueves: false,
  viernes: false,
  sabado: false,
}

function mockFetchImplementation({
  session = ADMIN_USER,
  sessionOk = true,
  config = CONFIG_TODOS_LOS_DIAS,
  configOk = true,
  putOk = true,
  putSuccess = true,
  putMessage,
}: {
  session?: typeof ADMIN_USER | null
  sessionOk?: boolean
  config?: typeof CONFIG_TODOS_LOS_DIAS | null
  configOk?: boolean
  putOk?: boolean
  putSuccess?: boolean
  putMessage?: string
} = {}) {
  ;(global.fetch as jest.Mock).mockImplementation((url: string, init?: RequestInit) => {
    if (url === '/api/auth/session') {
      return Promise.resolve({
        ok: sessionOk,
        json: async () => ({ success: sessionOk, usuario: session }),
      })
    }

    if (url === '/api/configuracion-notificaciones' && (!init || init.method === undefined)) {
      return Promise.resolve({
        ok: configOk,
        json: async () => ({ success: configOk, configuracion: config }),
      })
    }

    if (url === '/api/configuracion-notificaciones' && init?.method === 'PUT') {
      return Promise.resolve({
        ok: putOk,
        json: async () => ({ success: putSuccess, message: putMessage }),
      })
    }

    return Promise.reject(new Error(`fetch no mockeado para ${url}`))
  })
}

describe('NotificacionesPage', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('muestra "Cargando..." mientras se verifica la sesión', async () => {
    mockFetchImplementation()
    render(<NotificacionesPage />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()

    // Deja que la carga de sesión y configuración terminen para no dejar el efecto pendiente.
    await screen.findByLabelText('Correo de destino')
  })

  it('muestra un estado de acceso restringido cuando el usuario no es admin', async () => {
    mockFetchImplementation({ session: COLABORADOR_USER })
    render(<NotificacionesPage />)

    expect(await screen.findByText('No tenés acceso a esta sección')).toBeInTheDocument()
    expect(screen.getByText('Esta pantalla es exclusiva para usuarios administradores.')).toBeInTheDocument()
  })

  it('carga y muestra el formulario cuando el usuario es admin', async () => {
    mockFetchImplementation({ config: CONFIG_TODOS_LOS_DIAS })
    render(<NotificacionesPage />)

    expect(await screen.findByLabelText('Correo de destino')).toHaveValue('avisos@centro.com')
    expect(screen.getByText('Guardar')).toBeInTheDocument()
  })

  it('detecta modo "días específicos" cuando no todos los días están activos', async () => {
    mockFetchImplementation({ config: CONFIG_DIAS_ESPECIFICOS })
    render(<NotificacionesPage />)

    await screen.findByLabelText('Correo de destino')

    const especificosLabel = screen.getByText('Días específicos').closest('label')
    expect(especificosLabel).toHaveClass('diasModoBtnActive')
    expect(screen.getByText('Lunes', { selector: 'span' })).toBeInTheDocument()
  })

  it('detecta modo "todos" cuando todos los días están activos', async () => {
    mockFetchImplementation({ config: CONFIG_TODOS_LOS_DIAS })
    render(<NotificacionesPage />)

    await screen.findByLabelText('Correo de destino')

    const todosLabel = screen.getByText('Todos los días').closest('label')
    expect(todosLabel).toHaveClass('diasModoBtnActive')
    expect(screen.queryByText('Lunes', { selector: 'span' })).not.toBeInTheDocument()
  })

  it('muestra un error con opción de reintentar si falla la carga de configuración, y reintentar vuelve a cargar', async () => {
    mockFetchImplementation({ configOk: false })
    render(<NotificacionesPage />)

    expect(await screen.findByText('Error al cargar la configuración')).toBeInTheDocument()

    mockFetchImplementation({ config: CONFIG_TODOS_LOS_DIAS })
    fireEvent.click(screen.getByText('Reintentar'))

    expect(await screen.findByLabelText('Correo de destino')).toBeInTheDocument()
  })

  it('oculta el correo y los días cuando se desactiva el interruptor de notificaciones', async () => {
    mockFetchImplementation({ config: CONFIG_TODOS_LOS_DIAS })
    render(<NotificacionesPage />)

    await screen.findByLabelText('Correo de destino')
    expect(screen.getByLabelText('Correo de destino')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch'))

    expect(screen.queryByLabelText('Correo de destino')).not.toBeInTheDocument()
    expect(screen.queryByText('Días de envío')).not.toBeInTheDocument()
  })

  it('cambiar a "Todos los días" desde modo específico oculta la selección de días', async () => {
    mockFetchImplementation({ config: CONFIG_DIAS_ESPECIFICOS })
    render(<NotificacionesPage />)

    await screen.findByLabelText('Correo de destino')
    expect(screen.getByText('Lunes', { selector: 'span' })).toBeInTheDocument()

    fireEvent.click(screen.getByText('Todos los días'))

    expect(screen.queryByText('Lunes', { selector: 'span' })).not.toBeInTheDocument()
  })

  it('bloquea el guardado y muestra error cuando el correo es inválido', async () => {
    mockFetchImplementation({ config: CONFIG_TODOS_LOS_DIAS })
    render(<NotificacionesPage />)

    await screen.findByLabelText('Correo de destino')

    fireEvent.change(screen.getByLabelText('Correo de destino'), { target: { value: 'correo-invalido' } })
    fireEvent.click(screen.getByText('Guardar'))

    expect(await screen.findByText('Ingresá un correo electrónico válido.')).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalledWith('/api/configuracion-notificaciones', expect.objectContaining({ method: 'PUT' }))
  })

  it('bloquea el guardado cuando está activo en modo específico sin ningún día seleccionado', async () => {
    mockFetchImplementation({ config: CONFIG_DIAS_ESPECIFICOS })
    render(<NotificacionesPage />)

    await screen.findByLabelText('Correo de destino')

    // Único día activo en el fixture es "Lunes"; se desmarca para dejar la selección vacía.
    fireEvent.click(screen.getByText('Lu'))
    fireEvent.click(screen.getByText('Guardar'))

    expect(await screen.findByText('Seleccioná al menos un día de la semana.')).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalledWith('/api/configuracion-notificaciones', expect.objectContaining({ method: 'PUT' }))
  })

  it('guarda exitosamente y muestra un toast de éxito', async () => {
    mockFetchImplementation({ config: CONFIG_TODOS_LOS_DIAS, putSuccess: true })
    render(<NotificacionesPage />)

    await screen.findByLabelText('Correo de destino')

    fireEvent.click(screen.getByText('Guardar'))

    expect(await screen.findByText('Configuración guardada correctamente.')).toBeInTheDocument()

    const putCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) => url === '/api/configuracion-notificaciones' && init?.method === 'PUT'
    )
    expect(putCall).toBeDefined()
    const body = JSON.parse(putCall![1].body)
    expect(body).toEqual(expect.objectContaining({
      activo: true,
      correo_destino: 'avisos@centro.com',
    }))
  })

  it('muestra un toast de error cuando falla el guardado', async () => {
    mockFetchImplementation({ config: CONFIG_TODOS_LOS_DIAS, putOk: false, putSuccess: false, putMessage: 'boom' })
    render(<NotificacionesPage />)

    await screen.findByLabelText('Correo de destino')

    fireEvent.click(screen.getByText('Guardar'))

    expect(await screen.findByText('Error al guardar la configuración.')).toBeInTheDocument()
  })
})
