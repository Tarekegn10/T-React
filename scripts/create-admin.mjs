import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import pg from 'pg'

const { Pool } = pg

function loadEnvFile(fileName) {
  const envPath = path.resolve(process.cwd(), fileName)

  if (!fs.existsSync(envPath)) {
    return
  }

  const contents = fs.readFileSync(envPath, 'utf8')

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const equalsIndex = line.indexOf('=')
    if (equalsIndex === -1) {
      continue
    }

    const key = line.slice(0, equalsIndex).trim()
    const value = line.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function parseArgs(argv) {
  const options = {}

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i]

    if (!current.startsWith('--')) {
      continue
    }

    const key = current.slice(2)
    const next = argv[i + 1]

    if (!next || next.startsWith('--')) {
      options[key] = 'true'
      continue
    }

    options[key] = next
    i += 1
  }

  return options
}

function getOptionValue(args, envName, argName) {
  return args[argName] || process.env[envName] || ''
}

function printUsage() {
  console.log(`
Create or update the first admin user.

Usage:
  pnpm create-admin --username admin --email admin@example.com --password "StrongPassword123!" --name "Administrator"

PowerShell example:
  pnpm create-admin --username admin --email admin@example.com --password "StrongPassword123!" --name "Administrator"
`)
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const args = parseArgs(process.argv.slice(2))

if (args.help === 'true') {
  printUsage()
  process.exit(0)
}

const databaseUrl = (process.env.DATABASE_URL || '').trim()

if (!databaseUrl) {
  console.error('DATABASE_URL is missing. Update .env.local first.')
  process.exit(1)
}

if (databaseUrl.includes('://username:password@')) {
  console.error('DATABASE_URL still uses the placeholder username/password. Put your real PostgreSQL credentials in .env.local first.')
  process.exit(1)
}

const username = getOptionValue(args, 'ADMIN_USERNAME', 'username').trim()
const email = getOptionValue(args, 'ADMIN_EMAIL', 'email').trim()
const password = getOptionValue(args, 'ADMIN_PASSWORD', 'password')
const name = getOptionValue(args, 'ADMIN_NAME', 'name').trim() || 'Administrator'

if (!username || !email || !password) {
  printUsage()
  console.error('Username, email, and password are required.')
  process.exit(1)
}

if (password.length < 8) {
  console.error('Use a password with at least 8 characters.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
})

async function main() {
  const passwordHash = await bcrypt.hash(password, 10)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const existingByUsername = await client.query(
      'SELECT id, email FROM users WHERE username = $1 LIMIT 1',
      [username]
    )

    const existingByEmail = await client.query(
      'SELECT id, username FROM users WHERE email = $1 LIMIT 1',
      [email]
    )

    if (
      existingByUsername.rows[0] &&
      existingByEmail.rows[0] &&
      existingByUsername.rows[0].id !== existingByEmail.rows[0].id
    ) {
      throw new Error('The username and email belong to two different existing users. Choose a different username or email.')
    }

    const existingUser = existingByUsername.rows[0] || existingByEmail.rows[0]

    if (existingUser) {
      await client.query(
        `UPDATE users
         SET username = $1,
             email = $2,
             password_hash = $3,
             name = $4,
             role = 'admin',
             status = 'active',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [username, email, passwordHash, name, existingUser.id]
      )

      await client.query('COMMIT')
      console.log(`Updated existing user "${username}" and granted admin access.`)
      return
    }

    await client.query(
      `INSERT INTO users (username, email, password_hash, name, role, status)
       VALUES ($1, $2, $3, $4, 'admin', 'active')`,
      [username, email, passwordHash, name]
    )

    await client.query('COMMIT')
    console.log(`Created admin user "${username}".`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
