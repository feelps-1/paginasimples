import { InfluxDB, Point } from '@influxdata/influxdb-client'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.INFLUX_URL
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET

const influx = new InfluxDB({ url, token })
const writeApi = influx.getWriteApi(org, bucket)
writeApi.useDefaultTags({ app: 'synthetic-monitor' })

function getFakeStats(hostname) {
  const timestamp = new Date()
  const cpu = Math.abs(20 + Math.sin(Date.now() / 30000) * 40 + Math.random() * 5)
  const memory = 4096 + Math.random() * 2048
  const temp = 40 + Math.random() * 25
  return { cpu, memory, temp, timestamp, hostname }
}

function sendFakeStats() {
  const hosts = ['demo-pc-1', 'demo-pc-2', 'demo-pc-3', 'demo-pc-4', 'demo-pc-5']
  hosts.forEach(host => {
    const stats = getFakeStats(host)
    const point = new Point('system_stats')
      .tag('host', stats.hostname)
      .floatField('cpu_usage', stats.cpu)
      .floatField('memory_used_mb', stats.memory)
      .floatField('cpu_temp_c', stats.temp)
      .timestamp(stats.timestamp)

    try {
      writeApi.writePoint(point)
      console.log(`Enviado com sucesso: [${stats.timestamp.toISOString()}] ${host} | CPU: ${stats.cpu.toFixed(1)}% | TEMP: ${stats.temp.toFixed(1)}°C | MEM: ${stats.memory.toFixed(1)}MB`)
    } catch (err) {
      console.error(`Falha ao enviar dados de ${host}:`, err)
    }
  })
}

setInterval(sendFakeStats, 5000)

process.on('SIGINT', async () => {
  console.log('\nFinalizando...')
  try {
    await writeApi.close()
    console.log('Envio finalizado com sucesso.')
  } catch (err) {
    console.error('Erro ao fechar o writeApi:', err)
  }
  process.exit()
})
