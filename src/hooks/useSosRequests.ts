import { useCallback, useEffect, useRef, useState } from 'react'
import { HeartPulse } from 'lucide-react'
import { environment } from '../config/environment'
import { initialSosRequests, type SosRequest, type SosStatus } from '../data/sosRequests'
import { apiFetch } from '../utils/api'
import { toSosRequest, type ApiSosRecord } from '../utils/sosMapper'

const POLL_INTERVAL_MS = 5_000

interface UseSosRequestsOptions {
  /** True while the admin is signed in. */
  enabled: boolean
  /** Bearer token for the API. */
  token: string
  /** admin/campmanager only — controls polling and status updates. */
  canManage: boolean
  /** Fired once per batch of requests that arrived since the last poll. */
  onNewRequests: (count: number) => void
}

function buildMockRequest(id: string): SosRequest {
  return {
    id,
    name: 'New resident request',
    contact: '0917-XXX-0000',
    location: 'Purok 6, Pitogo',
    coordinates: [10.121, 124.558],
    type: 'Emergency assistance',
    category: 'Medical',
    priority: 'High',
    description: 'A newly received request is awaiting dispatch review.',
    period: 'today',
    received: 'Just now',
    status: 'Pending',
    color: 'bg-rose-500/15 text-rose-300',
    icon: HeartPulse,
  }
}

/**
 * Owns the SOS request list.
 *
 * Real mode (`VITE_ENABLE_MOCK_DATA=false`): loads the queue from the API,
 * then polls every few seconds. The first successful response becomes the
 * baseline — anything appearing later is "new" and triggers the alarm via
 * `onNewRequests`.
 *
 * Mock mode: starts from the local mock records; the simulate button adds
 * one locally.
 */
export function useSosRequests({ enabled, token, canManage, onNewRequests }: UseSosRequestsOptions) {
  const isMock = environment.features.useMockData
  const [requests, setRequests] = useState<SosRequest[]>(() => (isMock ? initialSosRequests : []))
  const knownIdsRef = useRef<Set<string> | null>(null)
  const onNewRequestsRef = useRef(onNewRequests)

  useEffect(() => {
    onNewRequestsRef.current = onNewRequests
  }, [onNewRequests])

  const pollingEnabled = enabled && !isMock && canManage && token.length > 0

  useEffect(() => {
    if (!pollingEnabled) return

    let cancelled = false

    const poll = async () => {
      try {
        const response = await apiFetch<{ data: ApiSosRecord[] }>('/sos-requests', { token })
        if (cancelled) return

        const mapped = response.data.map(toSosRequest)
        const knownIds = knownIdsRef.current

        if (knownIds === null) {
          knownIdsRef.current = new Set(mapped.map((request) => request.id))
        } else {
          const fresh = mapped.filter((request) => !knownIds.has(request.id))
          for (const request of fresh) knownIds.add(request.id)
          if (fresh.length > 0) onNewRequestsRef.current(fresh.length)
        }

        setRequests(mapped)
      } catch {
        // Backend unreachable or session expired — retry on the next tick.
      }
    }

    void poll()
    const interval = window.setInterval(() => void poll(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [pollingEnabled, token])

  const updateStatus = useCallback(
    async (id: string, status: SosStatus) => {
      setRequests((current) => current.map((request) => (request.id === id ? { ...request, status } : request)))

      if (!isMock && pollingEnabled) {
        try {
          await apiFetch(`/sos-requests/${id}`, { method: 'PATCH', body: { status }, token })
        } catch {
          // Keep the optimistic update; the next poll resyncs the truth.
        }
      }
    },
    [isMock, pollingEnabled, token],
  )

  /**
   * "Simulate incoming SOS" — a resident device submitting an emergency.
   * Mock mode adds locally; real mode POSTs to the API so every signed-in
   * admin panel picks it up.
   */
  const simulateIncomingSos = useCallback(async () => {
    if (isMock) {
      setRequests((current) => [buildMockRequest(`SOS-2024-${String(526 + current.length).padStart(4, '0')}`), ...current])
      onNewRequestsRef.current(1)
      return
    }

    try {
      const response = await apiFetch<{ data: ApiSosRecord }>('/sos-requests', {
        method: 'POST',
        body: {
          name: 'New resident request',
          contact: '0917-XXX-0000',
          location: 'Purok 6, Pitogo',
          latitude: 10.121,
          longitude: 124.558,
          type: 'Emergency assistance',
          category: 'Medical',
          priority: 'High',
          description: 'A newly received request is awaiting dispatch review.',
        },
      })
      const mapped = toSosRequest(response.data)
      knownIdsRef.current?.add(mapped.id)
      setRequests((current) => [mapped, ...current])
      onNewRequestsRef.current(1)
    } catch {
      // Submission failed (offline/validation) — stay quiet.
    }
  }, [isMock])

  return { requests, updateStatus, simulateIncomingSos }
}
