// Route handlers
import { fetchUsers, addUser } from '../lib/api'

export async function handleIndex() {
  const users = await fetchUsers()
  console.log('Users:', users)
  return { users }
}

export async function handleCreateUser(name: string) {
  const user = await addUser(name)
  console.log('Created user:', user)
  return { user }
}
