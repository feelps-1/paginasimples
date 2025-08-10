import { InfluxDB } from '@influxdata/influxdb-client'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.INFLUX_URL
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET

const influx = new InfluxDB({ url, token })
const queryApi = influx.getQueryApi(org)

async function queryCpuUsage() {
    const fluxQuery = `
    from(bucket: "${bucket}")
        |> range(start: -15m)
        |> filter(fn: (r) => r._measurement == "system_stats" and r._field == "cpu_usage")
        |> group(columns: ["host"])
        |> mean()
  `
    console.log('CPU Usage (média por host nos últimos 15 min):')
    for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
        const row = tableMeta.toObject(values)
        console.log(`Host: ${row.host} - CPU Mean: ${row._value.toFixed(2)}%`)
    }
}

async function queryCpuTempMax() {
    const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "system_stats" and r._field == "cpu_temp_c")
      |> max()
      |> group(columns: ["host"])
  `
    console.log('\nTemperatura máxima da CPU (última 1 hora) por host:')
    for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
        const row = tableMeta.toObject(values)
        console.log(`Host: ${row.host} - Max CPU Temp: ${row._value.toFixed(1)} °C`)
    }
}

async function queryMemoryUsedMean() {
    const fluxQuery = `
    from(bucket: "${bucket}")
        |> range(start: -30m)
        |> filter(fn: (r) => r._measurement == "system_stats" and r._field == "memory_used_mb")
        |> group(columns: ["host"])
        |> mean()
  `
    console.log('\nMemória usada média (últimos 30 min) por host:')
    for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
        const row = tableMeta.toObject(values)
        console.log(`Host: ${row.host} - Memory Mean: ${row._value.toFixed(1)} MB`)
    }
}

async function main() {
    await queryCpuUsage()
    await queryCpuTempMax()
    await queryMemoryUsedMean()
}

main().catch(err => {
    console.error('Erro nas queries:', err)
})
