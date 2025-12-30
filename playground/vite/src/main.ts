// Entry point - simulates client-side app
import { handleIndex, handleCreateUser } from './routes/index'

async function main() {
  console.log('App starting...')

  const result = await handleIndex()
  console.log('Index result:', result)

  const newUser = await handleCreateUser('Charlie')
  console.log('New user:', newUser)
}

main()
