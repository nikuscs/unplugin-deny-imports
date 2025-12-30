// API utilities
import { getUsers, createUser } from './db'

export async function fetchUsers() {
  const users = getUsers()
  return users
}

export async function addUser(name: string) {
  const user = createUser(name)
  return user
}
