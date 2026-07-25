import type { Response } from 'express'

interface SseClient {
  id: string
  res: Response
}

const clients = new Map<string, SseClient>()

export function addClient(id: string, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
  clients.set(id, { id, res })
}

export function removeClient(id: string): void {
  clients.delete(id)
}

export function broadcast(event: string, data: object): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients.values()) {
    try {
      client.res.write(payload)
    } catch {
      clients.delete(client.id)
    }
  }
}

export const sseService = {
  ticketCreated: (ticket: object) => broadcast('ticket:created', ticket),
  ticketUpdated: (ticketId: string, patch: object) => broadcast('ticket:updated', { ticketId, ...patch }),
  ticketVoted:   (ticketId: string, votes: number) => broadcast('ticket:voted', { ticketId, votes }),
}
