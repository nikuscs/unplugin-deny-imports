// Database utilities - this file imports server-only packages
import 'drizzle-orm'

export function getUsers() {
  // Fake implementation
  return [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
}

export function createUser(name: string) {
  console.log('Creating user:', name)
  return { id: 3, name }
}
