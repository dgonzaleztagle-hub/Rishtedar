'use client'

import { useState, useEffect } from 'react'
import {
  Plus, RefreshCw, Pencil, KeyRound, UserMinus, UserCheck,
  X, Check, AlertCircle, ChevronDown,
} from 'lucide-react'
import type { StaffRole } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffUser {
  id:           string
  display_name: string
  email:        string | null
  role:         StaffRole
  branches:     string[]
  is_active:    boolean
  last_sign_in: string | null
  created_at:   string
}

const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super Admin',
  manager:     'Gerente',
  kitchen:     'Cocina',
}

const ROLE_COLORS: Record<StaffRole, string> = {
  super_admin: 'text-gold-700 bg-gold-50 border-gold-200',
  manager:     'text-brand-700 bg-brand-50 border-brand-200',
  kitchen:     'text-emerald-700 bg-emerald-50 border-emerald-200',
}

const ALL_BRANCHES = [
  { id: 'providencia', label: 'Providencia' },
  { id: 'vitacura',    label: 'Vitacura'    },
  { id: 'la-reina',    label: 'La Reina'    },
  { id: 'la-dehesa',   label: 'La Dehesa'   },
]

// ─── Inline toast ─────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 text-sm border ${
      type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : 'bg-red-50 border-red-200 text-red-700'
    }`}>
      {type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
      {message}
      <button onClick={onClose} className="ml-auto">
        <X size={13} />
      </button>
    </div>
  )
}

// ─── BranchCheckboxes ─────────────────────────────────────────────────────────

function BranchCheckboxes({
  selected,
  onChange,
  disabled,
}: {
  selected: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter(b => b !== id))
    } else {
      onChange([...selected, id])
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_BRANCHES.map(b => (
        <button
          key={b.id}
          type="button"
          disabled={disabled}
          onClick={() => toggle(b.id)}
          className={`text-xs px-2.5 py-1 border transition-colors ${
            selected.includes(b.id)
              ? 'border-brand-400 bg-brand-50 text-brand-700'
              : 'border-warm-200 text-warm-500 hover:border-warm-300'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}

// ─── EditRow — inline editing ──────────────────────────────────────────────────

function EditRow({
  user,
  onSave,
  onCancel,
}: {
  user: StaffUser
  onSave: (data: { display_name: string; role: StaffRole; branches: string[] }) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName]       = useState(user.display_name)
  const [role, setRole]       = useState<StaffRole>(user.role)
  const [branches, setBranches] = useState(user.branches.includes('*') ? [] : user.branches)
  const [saving, setSaving]   = useState(false)

  async function handleSave() {
    setSaving(true)
    const finalBranches = role === 'super_admin' ? ['*'] : branches
    await onSave({ display_name: name, role, branches: finalBranches })
    setSaving(false)
  }

  return (
    <tr className="bg-brand-50/30">
      <td className="px-4 py-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-warm-300 px-2 py-1.5 text-sm text-warm-900 focus:outline-none focus:border-brand-400"
        />
      </td>
      <td className="px-4 py-3">
        <div className="relative">
          <select
            value={role}
            onChange={e => setRole(e.target.value as StaffRole)}
            className="w-full appearance-none border border-warm-300 px-2 py-1.5 text-sm text-warm-900 pr-7 focus:outline-none focus:border-brand-400 bg-white"
          >
            <option value="super_admin">Super Admin</option>
            <option value="manager">Gerente</option>
            <option value="kitchen">Cocina</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
        </div>
      </td>
      <td className="px-4 py-3">
        {role === 'super_admin'
          ? <span className="text-xs text-warm-400 italic">Todos los locales</span>
          : <BranchCheckboxes selected={branches} onChange={setBranches} />
        }
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <Check size={11} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button onClick={onCancel} className="text-warm-400 hover:text-warm-600">
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── ResetPasswordModal ───────────────────────────────────────────────────────

function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: StaffUser
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }

    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/staff/${user.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      onSuccess(`Contraseña de ${user.display_name} actualizada`)
      onClose()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al cambiar contraseña')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white w-full max-w-sm border border-warm-200 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100">
          <h3 className="font-medium text-warm-900 text-sm">Cambiar contraseña</h3>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <p className="text-warm-600 text-xs">Usuario: <span className="font-medium text-warm-900">{user.display_name}</span></p>
          <div className="space-y-1.5">
            <label className="text-warm-500 text-xs uppercase tracking-wider">Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null) }}
              placeholder="Mínimo 6 caracteres"
              autoFocus
              className="w-full border border-warm-300 px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── NewUserForm ──────────────────────────────────────────────────────────────

function NewUserForm({ onCreated, onCancel }: { onCreated: (msg: string) => void; onCancel: () => void }) {
  const [username,    setUsername]    = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role,        setRole]        = useState<StaffRole>('manager')
  const [branches,    setBranches]    = useState<string[]>([])
  const [password,    setPassword]    = useState('prueba')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !displayName || !password) { setError('Completa todos los campos'); return }
    if (role !== 'super_admin' && branches.length === 0) { setError('Asigna al menos un local'); return }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        display_name: displayName,
        role,
        branches: role === 'super_admin' ? ['*'] : branches,
        password,
      }),
    })

    if (res.ok) {
      onCreated(`Usuario "${displayName}" creado`)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al crear usuario')
    }
    setLoading(false)
  }

  return (
    <tr className="bg-warm-50">
      <td colSpan={4} className="px-4 py-4">
        <p className="text-xs font-medium text-warm-700 uppercase tracking-wider mb-3">Nuevo usuario</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-warm-500 text-[10px] uppercase tracking-wider">Username (slug)</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, '-'))}
              placeholder="ej: cocinero-juan"
              className="w-full border border-warm-300 px-2 py-1.5 text-sm focus:outline-none focus:border-brand-400"
            />
            <p className="text-warm-400 text-[10px]">Email: {username || 'username'}@rishtedar.local</p>
          </div>
          <div className="space-y-1">
            <label className="text-warm-500 text-[10px] uppercase tracking-wider">Nombre visible</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="ej: Juan (Cocina)"
              className="w-full border border-warm-300 px-2 py-1.5 text-sm focus:outline-none focus:border-brand-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-warm-500 text-[10px] uppercase tracking-wider">Rol</label>
            <div className="relative">
              <select
                value={role}
                onChange={e => setRole(e.target.value as StaffRole)}
                className="w-full appearance-none border border-warm-300 px-2 py-1.5 text-sm bg-white pr-7 focus:outline-none focus:border-brand-400"
              >
                <option value="manager">Gerente</option>
                <option value="kitchen">Cocina</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-warm-500 text-[10px] uppercase tracking-wider">Contraseña inicial</label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-warm-300 px-2 py-1.5 text-sm focus:outline-none focus:border-brand-400"
            />
          </div>
          {role !== 'super_admin' && (
            <div className="sm:col-span-2 space-y-1">
              <label className="text-warm-500 text-[10px] uppercase tracking-wider">Locales asignados</label>
              <BranchCheckboxes selected={branches} onChange={setBranches} />
            </div>
          )}
          {error && (
            <div className="sm:col-span-2 flex items-center gap-1.5 text-red-600 text-xs">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
          <div className="sm:col-span-2 flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              <Plus size={12} />
              {loading ? 'Creando…' : 'Crear usuario'}
            </button>
            <button type="button" onClick={onCancel} className="text-xs text-warm-400 hover:text-warm-600 px-2 py-2">
              Cancelar
            </button>
          </div>
        </form>
      </td>
    </tr>
  )
}

// ─── StaffAdminView ───────────────────────────────────────────────────────────

export function StaffAdminView() {
  const [users, setUsers]     = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [resetUser, setResetUser]   = useState<StaffUser | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch('/api/admin/staff')
    if (res.ok) {
      setUsers(await res.json())
    } else {
      showToast('Error al cargar usuarios', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleEdit(userId: string, data: { display_name: string; role: StaffRole; branches: string[] }) {
    const res = await fetch(`/api/admin/staff/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      showToast('Cambios guardados')
      setEditingId(null)
      await fetchUsers()
    } else {
      const d = await res.json()
      showToast(d.error ?? 'Error al guardar', 'error')
    }
  }

  async function handleToggleActive(user: StaffUser) {
    const res = await fetch(`/api/admin/staff/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !user.is_active }),
    })
    if (res.ok) {
      showToast(`${user.display_name} ${!user.is_active ? 'activado' : 'desactivado'}`)
      await fetchUsers()
    } else {
      const d = await res.json()
      showToast(d.error ?? 'Error', 'error')
    }
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-warm-900 font-display text-xl italic">Usuarios</h1>
          <p className="text-warm-500 text-sm">Gestión de accesos al dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-warm-700 transition-colors px-2 py-1.5 border border-warm-200 hover:border-warm-300"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => { setShowNewForm(v => !v); setEditingId(null) }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <Plus size={12} />
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Table */}
      <div className="bg-white border border-warm-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100 bg-warm-50">
                <th className="text-left px-4 py-3 text-[10px] text-warm-500 uppercase tracking-wider font-medium">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 text-[10px] text-warm-500 uppercase tracking-wider font-medium">
                  Rol
                </th>
                <th className="text-left px-4 py-3 text-[10px] text-warm-500 uppercase tracking-wider font-medium">
                  Locales
                </th>
                <th className="text-left px-4 py-3 text-[10px] text-warm-500 uppercase tracking-wider font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">

              {/* New user form */}
              {showNewForm && (
                <NewUserForm
                  onCreated={async (msg) => {
                    showToast(msg)
                    setShowNewForm(false)
                    await fetchUsers()
                  }}
                  onCancel={() => setShowNewForm(false)}
                />
              )}

              {loading && !users.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-warm-400 text-sm">
                    Cargando usuarios…
                  </td>
                </tr>
              )}

              {users.map(user => {
                if (editingId === user.id) {
                  return (
                    <EditRow
                      key={user.id}
                      user={user}
                      onSave={(data) => handleEdit(user.id, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  )
                }

                const branchLabels = user.branches.includes('*')
                  ? ['Todos']
                  : user.branches.map(b => ALL_BRANCHES.find(x => x.id === b)?.label ?? b)

                return (
                  <tr key={user.id} className={`hover:bg-warm-50/50 transition-colors ${!user.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-warm-900">{user.display_name}</p>
                      <p className="text-warm-400 text-xs">{user.email}</p>
                      {user.last_sign_in && (
                        <p className="text-warm-300 text-[10px]">
                          Último acceso: {new Date(user.last_sign_in).toLocaleDateString('es-CL')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 border font-medium uppercase tracking-wider ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {branchLabels.map(l => (
                          <span key={l} className="text-[10px] px-1.5 py-0.5 bg-warm-100 text-warm-600 border border-warm-200">
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingId(user.id); setShowNewForm(false) }}
                          title="Editar"
                          className="p-1.5 text-warm-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setResetUser(user)}
                          title="Cambiar contraseña"
                          className="p-1.5 text-warm-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <KeyRound size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          title={user.is_active ? 'Desactivar' : 'Activar'}
                          className={`p-1.5 transition-colors ${
                            user.is_active
                              ? 'text-warm-400 hover:text-red-500 hover:bg-red-50'
                              : 'text-warm-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {user.is_active ? <UserMinus size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset password modal */}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSuccess={showToast}
        />
      )}
    </div>
  )
}
